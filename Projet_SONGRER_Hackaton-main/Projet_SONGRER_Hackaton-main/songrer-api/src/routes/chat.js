import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { assessConversation } from "../services/safety.service.js";
import { generateAssistantReply } from "../services/llm.service.js";
import { getLightweightContext } from "../services/rag.service.js";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes de chat. Réessayez plus tard." }
});

const messageSchema = z.object({
  sender: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(2000),
  time: z.string().optional().nullable()
});

const chatSchema = z.object({
  anonymousId: z.string().min(6).max(128).optional(),
  messages: z.array(messageSchema).min(1).max(30)
});

router.post("/", chatLimiter, async (req, res, next) => {
  try {
    const input = chatSchema.parse(req.body);
    const assessment = assessConversation(input.messages);
    const context = await getLightweightContext();
    const llm = await generateAssistantReply({
      messages: input.messages,
      assessment,
      context
    });

    res.json({
      reply: {
        sender: "assistant",
        text: llm.text
      },
      ai: {
        provider: llm.provider,
        model: llm.model || null
      },
      safety: {
        isEmergency: assessment.isEmergency,
        hasViolenceSignal: assessment.hasViolenceSignal,
        recommendedStatus: assessment.recommendedStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

