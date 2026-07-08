import { prisma } from "../prisma.js";

export async function getLightweightContext() {
  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    take: 5,
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      phone: true,
      city: true,
      distance: true
    }
  });

  if (organizations.length === 0) {
    return "";
  }

  return [
    "ONG/structures partenaires disponibles:",
    ...organizations.map((organization) => {
      const details = [
        organization.city,
        organization.distance,
        organization.phone ? `tel: ${organization.phone}` : null
      ].filter(Boolean).join(", ");
      return `- ${organization.name}${details ? ` (${details})` : ""}`;
    })
  ].join("\n");
}

