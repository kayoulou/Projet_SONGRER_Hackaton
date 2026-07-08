import { buildSafetyInstruction } from "./safety.service.js";

function fallbackReply(assessment) {
  if (assessment.isEmergency) {
    return "Je suis vraiment desolee que tu sois dans cette situation. Ta securite passe avant tout : si tu es en danger immediat, eloigne-toi si tu peux et contacte les secours, la police ou une personne de confiance maintenant. Es-tu dans un endroit ou tu peux te mettre en securite ?";
  }

  return "Je suis la avec toi. Merci de m'avoir ecrit, ce que tu vis compte et tu n'as pas a porter cela seule. Si tu te sens menacee, cherche d'abord un endroit sur et contacte une personne ou une structure de confiance. Peux-tu me dire si tu es en securite en ce moment ?";
}

function toGeminiContents(messages = []) {
  return messages.slice(-12).map((message) => ({
    role: message.sender === "assistant" ? "model" : "user",
    parts: [{ text: message.text || "" }]
  }));
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

export async function generateAssistantReply({ messages, assessment, context = "" }) {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (provider !== "gemini" || !apiKey) {
    return {
      provider: "fallback",
      text: fallbackReply(assessment)
    };
  }

  try {
    const systemInstruction = `${buildSafetyInstruction(assessment)}

Contexte utile SONGRER:
${context || "Aucun contexte documentaire specifique disponible pour cette reponse."}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: toGeminiContents(messages),
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 360
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn("Gemini API returned non-OK response:", response.status, errorBody);
      return {
        provider: "fallback",
        text: fallbackReply(assessment)
      };
    }

    const data = await response.json();
    const text = extractGeminiText(data);

    return {
      provider: "gemini",
      model,
      text: text || fallbackReply(assessment)
    };
  } catch (error) {
    console.error("Failed to connect to Gemini API:", error);
    return {
      provider: "fallback",
      text: fallbackReply(assessment)
    };
  }
}
