import type { Response } from "express";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";

export async function unreadCount(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0`,
    [req.user.id]
  );
  const row = (rows as { c: number }[])[0];
  res.json({ count: Number(row?.c ?? 0) });
}

export async function listNotifications(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json(rows);
}

export async function markRead(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const id = Number(req.params.id);
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [
    id,
    req.user.id,
  ]);
  res.json({ ok: true });
}

export async function markAllRead(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
  res.json({ ok: true });
}
