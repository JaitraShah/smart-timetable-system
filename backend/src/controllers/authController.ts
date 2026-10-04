import type { Response } from "express";
import type { ResultSetHeader } from "mysql2";
import { z } from "zod";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { signToken } from "../utils/jwt.js";
import { notifyAdmins } from "../services/notificationService.js";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["faculty", "student", "event_organiser"]),
  divisionId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
});

/**
 * INSECURE: passwords stored and compared as plain text — local academic demo only.
 * Do not use in production.
 */
export async function register(req: AuthedRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { fullName, email, password, role, divisionId, departmentId } = parsed.data;

  const [countRows] = await pool.query("SELECT COUNT(*) as c FROM users WHERE email = ?", [email.toLowerCase()]);
  const existing = (countRows as { c: number }[])[0];
  if (Number(existing?.c ?? 0) > 0) return res.status(409).json({ error: "Email already registered" });

  const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = ?", [role]);
  const roleRow = (roleRows as { id: number }[])[0];
  if (!roleRow) return res.status(400).json({ error: "Invalid role" });

  let divId: number | null = null;
  let deptId: number | null = null;
  if (role === "student") {
    if (!divisionId) return res.status(400).json({ error: "Students must select a division" });
    const [d] = await pool.query("SELECT id FROM divisions WHERE id = ?", [divisionId]);
    if (!(d as { id: number }[])[0]) return res.status(400).json({ error: "Invalid division" });
    divId = divisionId;
  }
  if (role === "faculty" && departmentId) {
    const [d] = await pool.query("SELECT id FROM departments WHERE id = ?", [departmentId]);
    if (!(d as { id: number }[])[0]) return res.status(400).json({ error: "Invalid department" });
    deptId = departmentId;
  }

  const [ins] = (await pool.query(
    `INSERT INTO users (email, password_plain, full_name, role_id, registration_status, division_id, department_id)
     VALUES (?,?,?,?, 'pending', ?, ?)`,
    [email.toLowerCase(), password, fullName, roleRow.id, divId, deptId]
  )) as [ResultSetHeader, unknown];
  const newId = ins.insertId;

  if (role === "student" && divId) {
    await pool.query(`INSERT INTO student_enrollments (user_id, division_id) VALUES (?,?)`, [newId, divId]);
  }

  await notifyAdmins(
    pool,
    "New registration pending",
    `${fullName} (${email}) registered as ${role}.`
  );

  return res.status(201).json({ ok: true, message: "Registration submitted. An admin must activate your account." });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: AuthedRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const email = parsed.data.email.toLowerCase();
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.password_plain, u.full_name, u.registration_status, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email]
  );
  const u = (rows as { id: number; email: string; password_plain: string; full_name: string; registration_status: string; role_name: string }[])[0];
  if (!u || u.password_plain !== parsed.data.password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (u.registration_status === "pending") {
    return res.status(403).json({ error: "Account pending admin approval" });
  }
  if (u.registration_status === "rejected") {
    return res.status(403).json({ error: "Registration was rejected" });
  }

  const token = signToken({ sub: u.id, email: u.email, role: u.role_name });
  return res.json({
    token,
    user: { id: u.id, email: u.email, fullName: u.full_name, role: u.role_name },
  });
}

export async function me(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name, r.name AS role_name, u.division_id, u.department_id
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [req.user.id]
  );
  const u = (rows as {
    id: number;
    email: string;
    full_name: string;
    role_name: string;
    division_id: number | null;
    department_id: number | null;
  }[])[0];
  if (!u) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role_name,
    divisionId: u.division_id,
    departmentId: u.department_id,
  });
}
