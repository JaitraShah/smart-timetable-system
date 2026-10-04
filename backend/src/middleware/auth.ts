import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export type AuthedRequest = Request & {
  user?: { id: number; email: string; role: string };
};

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const token = h.slice(7);
    const p = verifyToken(token);
    req.user = { id: p.sub, email: p.email, role: p.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRoles(...allowed: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for this role" });
    }
    next();
  };
}
