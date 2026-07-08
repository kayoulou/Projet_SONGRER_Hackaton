import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Session invalide." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expiree ou invalide." });
  }
}

