import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    let token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      const cookieHeader = req.headers.cookie || "";
      const cookies = Object.fromEntries(
        cookieHeader
          .split(";")
          .map((cookie) => cookie.trim())
          .filter(Boolean)
          .map((cookie) => {
            const separatorIndex = cookie.indexOf("=");
            const key = separatorIndex >= 0 ? cookie.slice(0, separatorIndex).trim() : cookie;
            const value = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1).trim() : "";
            return [key, decodeURIComponent(value)];
          })
      );

      token = cookies.songrer_admin_session || null;
    }

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

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acces refuse : privileges insuffisants." });
    }

    return next();
  };
}

