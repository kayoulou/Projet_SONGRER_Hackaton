const emergencyTerms = [
  "danger",
  "urgence",
  "tuer",
  "me tuer",
  "menace",
  "menaces",
  "arme",
  "couteau",
  "pistolet",
  "sang",
  "blessee",
  "blessée",
  "frappe",
  "frappee",
  "frappée",
  "viol",
  "agression",
  "il arrive",
  "porte",
  "aidez-moi",
  "aidez moi"
];

const violenceTerms = [
  "battu",
  "battue",
  "coups",
  "violence",
  "violent",
  "harcelement",
  "harcèlement",
  "chantage",
  "peur",
  "menace",
  "agress"
];

export function assessConversation(messages = []) {
  const text = messages
    .filter((message) => message.sender === "user")
    .map((message) => message.text || "")
    .join(" ")
    .toLowerCase();

  const isEmergency = emergencyTerms.some((term) => text.includes(term));
  const hasViolenceSignal = violenceTerms.some((term) => text.includes(term));

  return {
    isEmergency,
    hasViolenceSignal,
    recommendedStatus: isEmergency ? "urgent" : hasViolenceSignal ? "pending" : "pending",
    guidance: isEmergency
      ? "Si la personne est en danger immediat, rappeler de contacter les secours locaux, la police ou une personne de confiance sans attendre."
      : "Repondre avec ecoute, prudence, et encourager a contacter une structure humaine de soutien."
  };
}

export function buildSafetyInstruction(assessment) {
  return `
Tu es l'assistant de soutien SONGRER pour une application de signalement VBG.
Regles imperatives:
- Reponds en francais clair, doux, court et non jugeant.
- Ne te presente jamais comme police, medecin, avocat, psychologue ou service d'urgence.
- Ne promets jamais une confidentialite absolue si la securite est en jeu.
- Si danger immediat: conseille de se mettre en securite et de contacter les secours locaux, la police ou une personne de confiance.
- N'incite jamais a confronter l'agresseur.
- Pose au maximum une question simple a la fin.
- Ne donne pas de diagnostic medical ou juridique.
- Oriente vers ONG, proches fiables, centre d'aide ou autorites competentes.
Evaluation securite: ${JSON.stringify(assessment)}.
`.trim();
}

