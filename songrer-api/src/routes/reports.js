import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { toApiReport, toDbChannel, toDbStatus } from "../utils/status.js";

const router = express.Router();

const messageSchema = z.object({
  sender: z.string().min(1),
  text: z.string().min(1),
  time: z.string().optional().nullable(),
  audioUri: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  duration: z.coerce.number().int().optional().nullable()
});

const reportCreateSchema = z.object({
  anonymousId: z.string().min(6),
  status: z.string().optional(),
  statusText: z.string().optional(),
  priority: z.string().optional().nullable(),
  channel: z.string().optional(),
  description: z.string().min(2),
  dateString: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  messages: z.array(messageSchema).optional()
});

const reportUpdateSchema = z.object({
  status: z.string().optional(),
  statusText: z.string().optional(),
  priority: z.string().optional().nullable(),
  description: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
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

router.get("/", requireAuth, async (req, res, next) => {
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

router.get("/track/:anonymousId", async (req, res, next) => {
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

router.get("/:id", requireAuth, async (req, res, next) => {
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

router.post("/", async (req, res, next) => {
  try {
    const input = reportCreateSchema.parse(req.body);
    const report = await prisma.report.upsert({
      where: { anonymousId: input.anonymousId },
      update: {
        status: toDbStatus(input.status),
        statusText: input.statusText,
        priority: input.priority,
        channel: toDbChannel(input.channel),
        description: input.description,
        dateString: input.dateString,
        audioUrl: input.audioUrl,
        messages: {
          deleteMany: {},
          create: messageData(input.messages)
        }
      },
      create: {
        anonymousId: input.anonymousId,
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

router.patch("/:id", requireAuth, async (req, res, next) => {
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

