import type { Response } from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { notifyUser } from "../services/notificationService.js";

export async function listUsers(req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name, r.name AS role_name, u.registration_status, u.division_id, u.department_id
     FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.id`
  );
  res.json(rows);
}

const statusSchema = z.object({
  registrationStatus: z.enum(["pending", "active", "rejected"]),
});

export async function updateUserStatus(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid request" });

  await pool.query(`UPDATE users SET registration_status = ? WHERE id = ?`, [
    parsed.data.registrationStatus,
    id,
  ]);

  const [rows] = await pool.query("SELECT email FROM users WHERE id = ?", [id]);
  if ((rows as { email: string }[])[0]) {
    await notifyUser(
      pool,
      id,
      "Account status updated",
      `Your registration is now: ${parsed.data.registrationStatus}.`
    );
  }
  res.json({ ok: true });
}

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  departmentId: z.number().nullable().optional(),
});

export async function updateProfile(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.fullName) {
    await pool.query(`UPDATE users SET full_name = ? WHERE id = ?`, [parsed.data.fullName, req.user.id]);
  }
  if (parsed.data.departmentId !== undefined && req.user.role === "faculty") {
    await pool.query(`UPDATE users SET department_id = ? WHERE id = ?`, [
      parsed.data.departmentId,
      req.user.id,
    ]);
  }
  res.json({ ok: true });
}
