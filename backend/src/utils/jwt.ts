import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AppJwtPayload = { sub: number; email: string; role: string };

export function signToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AppJwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  return decoded as unknown as AppJwtPayload;
}
