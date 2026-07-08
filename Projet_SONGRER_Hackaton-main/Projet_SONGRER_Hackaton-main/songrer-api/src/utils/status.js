const apiToDb = {
  pending: "PENDING",
  in_progress: "IN_PROGRESS",
  urgent: "URGENT",
  resolved: "RESOLVED",
  closed: "CLOSED"
};

const dbToApi = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  URGENT: "urgent",
  RESOLVED: "resolved",
  CLOSED: "closed"
};

export function toDbStatus(status) {
  return apiToDb[status] || "PENDING";
}

export function toApiStatus(status) {
  return dbToApi[status] || status || "pending";
}

export function toDbChannel(channel) {
  const normalized = String(channel || "text").toLowerCase();
  if (normalized === "voice") return "VOICE";
  if (normalized === "mixed") return "MIXED";
  return "TEXT";
}

export function toApiReport(report) {
  if (!report) return null;

  return {
    id: report.id,
    anonymousId: report.anonymousId,
    status: toApiStatus(report.status),
    statusText: report.statusText,
    priority: report.priority,
    channel: String(report.channel || "TEXT").toLowerCase(),
    description: report.description,
    dateString: report.dateString,
    audioUrl: report.audioUrl,
    assignedTo: report.organization?.name || "",
    organizationId: report.organizationId,
    createdAt: report.createdAt?.toISOString?.() || report.createdAt,
    updatedAt: report.updatedAt?.toISOString?.() || report.updatedAt,
    messages: (report.messages || []).map((message) => ({
      id: message.id,
      sender: message.sender,
      text: message.text,
      time: message.time,
      audioUri: message.audioUrl,
      audioUrl: message.audioUrl,
      duration: message.duration,
      createdAt: message.createdAt?.toISOString?.() || message.createdAt
    }))
  };
}
