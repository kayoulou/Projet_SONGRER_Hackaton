import express from "express";
import { z } from "zod";
import { assessConversation } from "../services/safety.service.js";
import { generateAssistantReply } from "../services/llm.service.js";
import { getLightweightContext } from "../services/rag.service.js";

const router = express.Router();

const messageSchema = z.object({
  sender: z.enum(["user", "assistant"]).or(z.string()),
  text: z.string().min(1),
  time: z.string().optional().nullable()
});

const chatSchema = z.object({
  anonymousId: z.string().optional(),
  messages: z.array(messageSchema).min(1)
});

router.post("/", async (req, res, next) => {
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

