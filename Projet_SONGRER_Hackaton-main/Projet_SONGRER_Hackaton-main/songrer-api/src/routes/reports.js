import express from "express";
import { randomBytes } from "node:crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { toApiReport, toDbChannel, toDbStatus } from "../utils/status.js";

const router = express.Router();

const reportCreateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de signalements envoyés. Réessayez plus tard." }
});

const reportTrackLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de vérifications de dossier. Réessayez plus tard." }
});

const messageSchema = z.object({
  sender: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(4000),
  time: z.string().optional().nullable(),
  audioUri: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  duration: z.coerce.number().int().optional().nullable()
});

const reportCreateSchema = z.object({
  anonymousId: z.string().optional().nullable(),
  status: z.string().max(32).optional(),
  statusText: z.string().max(250).optional(),
  priority: z.string().max(64).optional().nullable(),
  channel: z.string().optional(),
  description: z.string().min(2).max(4000),
  dateString: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  messages: z.array(messageSchema).max(50).optional()
});

const reportUpdateSchema = z.object({
  status: z.string().max(32).optional(),
  statusText: z.string().max(250).optional(),
  priority: z.string().max(64).optional().nullable(),
  description: z.string().max(4000).optional(),
  assignedTo: z.string().max(200).optional().nullable(),
  organizationId: z.string().optional().nullable()
});

function messageData(messages = []) {
  return messages.map((message) => ({
    sender: message.sender,
    text: message.text,
    time: message.time,
    audioUrl: message.audioUrl || message.audioUri,
    duration: message.duration
  }));
}

async function findOrganizationId(input) {
  if (input.organizationId) return input.organizationId;
  if (!input.assignedTo) return undefined;

  const organization = await prisma.organization.findFirst({
    where: {
      name: input.assignedTo,
      isActive: true
    }
  });

  return organization?.id;
}

function generateAnonymousId() {
  return `SG-${randomBytes(8).toString("hex").toUpperCase()}`;
}

router.get("/", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "NGO"), async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        organization: true,
        messages: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(reports.map(toApiReport));
  } catch (error) {
    next(error);
  }
});

router.get("/track/:anonymousId", reportTrackLimiter, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { anonymousId: req.params.anonymousId },
      include: {
        organization: true,
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!report) {
      return res.status(404).json({ message: "Signalement introuvable." });
    }

    res.json(toApiReport(report));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "NGO"), async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        organization: true,
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!report) {
      return res.status(404).json({ message: "Signalement introuvable." });
    }

    res.json(toApiReport(report));
  } catch (error) {
    next(error);
  }
});

router.post("/", reportCreateLimiter, async (req, res, next) => {
  try {
    const input = reportCreateSchema.parse(req.body);
    const report = await prisma.report.create({
      data: {
        anonymousId: generateAnonymousId(),
        status: toDbStatus(input.status),
        statusText: input.statusText || "En attente de traitement",
        priority: input.priority,
        channel: toDbChannel(input.channel),
        description: input.description,
        dateString: input.dateString,
        audioUrl: input.audioUrl,
        messages: {
          create: messageData(input.messages)
        }
      },
      include: {
        organization: true,
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    res.status(201).json(toApiReport(report));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "NGO"), async (req, res, next) => {
  try {
    const input = reportUpdateSchema.parse(req.body);
    const organizationId = await findOrganizationId(input);

    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status: input.status ? toDbStatus(input.status) : undefined,
        statusText: input.statusText,
        priority: input.priority,
        description: input.description,
        organizationId
      },
      include: {
        organization: true,
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    res.json(toApiReport(report));
  } catch (error) {
    next(error);
  }
});

export default router;

