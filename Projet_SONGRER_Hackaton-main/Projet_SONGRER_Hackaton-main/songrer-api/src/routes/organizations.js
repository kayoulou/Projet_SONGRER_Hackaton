import express from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = express.Router();

const organizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  distance: z.string().optional().nullable(),
  icon: z.string().optional()
});

router.get("/", async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    });
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const input = organizationSchema.parse(req.body);
    const organization = await prisma.organization.create({ data: input });
    res.status(201).json(organization);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const input = organizationSchema.partial().parse(req.body);
    const organization = await prisma.organization.update({
      where: { id: req.params.id },
      data: input
    });
    res.json(organization);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    await prisma.organization.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

