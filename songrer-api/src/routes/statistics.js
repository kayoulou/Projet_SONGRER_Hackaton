import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = express.Router();

const statisticSchema = z.object({
  id: z.string().optional(),
  callsToday: z.coerce.number().int().nonnegative().optional(),
  activeCases: z.coerce.number().int().nonnegative().optional(),
  womenHelped: z.coerce.number().int().nonnegative().optional()
});

router.get("/", async (req, res, next) => {
  try {
    const activeCases = await prisma.report.count({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS", "URGENT"]
        }
      }
    });

    const womenHelped = await prisma.report.count({
      where: {
        status: {
          in: ["RESOLVED", "CLOSED"]
        }
      }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const callsToday = await prisma.report.count({
      where: {
        createdAt: {
          gte: todayStart
        }
      }
    });

    const statistic = {
      id: "global",
      callsToday,
      activeCases,
      womenHelped
    };

    res.json([statistic]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const input = statisticSchema.parse(req.body);
    const statistic = await prisma.statistic.upsert({
      where: { id: req.params.id },
      update: input,
      create: { id: req.params.id, ...input }
    });
    res.json(statistic);
  } catch (error) {
    next(error);
  }
});

export default router;

