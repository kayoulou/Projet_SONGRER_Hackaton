import express from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = express.Router();

const videoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  author: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  views: z.string().optional().nullable(),
  likes: z.coerce.number().int().nonnegative().optional(),
  commentsCount: z.coerce.number().int().nonnegative().optional(),
  sharesCount: z.coerce.number().int().nonnegative().optional(),
  description: z.string().optional().nullable()
});

router.get("/", async (req, res, next) => {
  try {
    const videos = await prisma.video.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(videos);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const input = videoSchema.parse(req.body);
    if (input.id === "") delete input.id;

    // Force default metrics to 0 for any newly published video
    const videoData = {
      ...input,
      views: input.views || "0",
      likes: input.likes !== undefined ? input.likes : 0,
      commentsCount: input.commentsCount !== undefined ? input.commentsCount : 0,
      sharesCount: input.sharesCount !== undefined ? input.sharesCount : 0
    };

    const video = await prisma.video.create({ data: videoData });
    res.status(201).json(video);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const input = videoSchema.partial().parse(req.body);
    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: input
    });
    res.json(video);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    await prisma.video.update({
      where: { id: req.params.id },
      data: { isPublished: false }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

