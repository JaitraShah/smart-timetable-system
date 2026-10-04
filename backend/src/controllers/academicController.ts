import type { Response } from "express";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";

async function countRows(sql: string, params: unknown[]): Promise<number> {
  const [rows] = await pool.query(sql, params);
  return Number((rows as { c: number }[])[0]?.c ?? 0);
}

export async function listDepartments(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query("SELECT * FROM departments ORDER BY name");
  res.json(rows);
}

const deptSchema = z.object({ name: z.string().min(1), code: z.string().min(1) });
export async function createDepartment(req: AuthedRequest, res: Response) {
  const p = deptSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(`INSERT INTO departments (name, code) VALUES (?,?)`, [
    p.data.name,
    p.data.code,
  ])) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const deptPatchSchema = deptSchema.partial();
export async function updateDepartment(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = deptPatchSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(`UPDATE departments SET name = COALESCE(?, name), code = COALESCE(?, code) WHERE id = ?`, [
    b.name ?? null,
    b.code ?? null,
    id,
  ]);
  res.json({ ok: true });
}

export async function deleteDepartment(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM subjects WHERE department_id = ?", [id]))
    return res.status(409).json({ error: "Department has subjects; remove or reassign them first." });
  if (await countRows("SELECT COUNT(*) AS c FROM divisions WHERE department_id = ?", [id]))
    return res.status(409).json({ error: "Department has divisions." });
  if (await countRows("SELECT COUNT(*) AS c FROM users WHERE department_id = ?", [id]))
    return res.status(409).json({ error: "Department assigned to users." });
  await pool.query(`DELETE FROM departments WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listTerms(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query("SELECT * FROM academic_terms ORDER BY id");
  res.json(rows);
}

const termSchema = z.object({
  name: z.string(),
  startMonth: z.number().min(1).max(12),
  endMonth: z.number().min(1).max(12),
});
export async function createTerm(req: AuthedRequest, res: Response) {
  const p = termSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(`INSERT INTO academic_terms (name, start_month, end_month) VALUES (?,?,?)`, [
    p.data.name,
    p.data.startMonth,
    p.data.endMonth,
  ])) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const termPatchSchema = termSchema.partial();
export async function updateTerm(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = termPatchSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(
    `UPDATE academic_terms SET name = COALESCE(?, name), start_month = COALESCE(?, start_month), end_month = COALESCE(?, end_month) WHERE id = ?`,
    [b.name ?? null, b.startMonth ?? null, b.endMonth ?? null, id]
  );
  res.json({ ok: true });
}

export async function deleteTerm(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM semesters WHERE academic_term_id = ?", [id]))
    return res.status(409).json({ error: "Term still has semesters." });
  await pool.query(`DELETE FROM academic_terms WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listSemesters(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT s.*, t.name AS term_name FROM semesters s JOIN academic_terms t ON t.id = s.academic_term_id ORDER BY s.academic_year DESC, s.id`
  );
  res.json(rows);
}

const semSchema = z.object({
  name: z.string(),
  academicYear: z.number(),
  academicTermId: z.number(),
});
export async function createSemester(req: AuthedRequest, res: Response) {
  const p = semSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(
    `INSERT INTO semesters (name, academic_year, academic_term_id) VALUES (?,?,?)`,
    [p.data.name, p.data.academicYear, p.data.academicTermId]
  )) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const semPatchSchema = semSchema.partial();
export async function updateSemester(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = semPatchSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(
    `UPDATE semesters SET name = COALESCE(?, name), academic_year = COALESCE(?, academic_year), academic_term_id = COALESCE(?, academic_term_id) WHERE id = ?`,
    [b.name ?? null, b.academicYear ?? null, b.academicTermId ?? null, id]
  );
  res.json({ ok: true });
}

export async function deleteSemester(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM divisions WHERE semester_id = ?", [id]))
    return res.status(409).json({ error: "Semester has divisions." });
  if (await countRows("SELECT COUNT(*) AS c FROM timetable_entries WHERE semester_id = ?", [id]))
    return res.status(409).json({ error: "Semester has timetable entries." });
  await pool.query(`DELETE FROM semesters WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listDivisions(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT d.*, s.name AS semester_name, dep.name AS department_name
     FROM divisions d
     JOIN semesters s ON s.id = d.semester_id
     JOIN departments dep ON dep.id = d.department_id
     ORDER BY d.id`
  );
  res.json(rows);
}

const divSchema = z.object({
  name: z.string(),
  code: z.string(),
  semesterId: z.number(),
  departmentId: z.number(),
});
export async function createDivision(req: AuthedRequest, res: Response) {
  const p = divSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(
    `INSERT INTO divisions (name, code, semester_id, department_id) VALUES (?,?,?,?)`,
    [p.data.name, p.data.code, p.data.semesterId, p.data.departmentId]
  )) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const divPatchSchema = divSchema.partial();
export async function updateDivision(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = divPatchSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(
    `UPDATE divisions SET name = COALESCE(?, name), code = COALESCE(?, code), semester_id = COALESCE(?, semester_id), department_id = COALESCE(?, department_id) WHERE id = ?`,
    [b.name ?? null, b.code ?? null, b.semesterId ?? null, b.departmentId ?? null, id]
  );
  res.json({ ok: true });
}

export async function deleteDivision(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM faculty_subjects WHERE division_id = ?", [id]))
    return res.status(409).json({ error: "Division has faculty-subject links." });
  if (await countRows("SELECT COUNT(*) AS c FROM timetable_entries WHERE division_id = ?", [id]))
    return res.status(409).json({ error: "Division has timetable entries." });
  if (await countRows("SELECT COUNT(*) AS c FROM student_enrollments WHERE division_id = ?", [id]))
    return res.status(409).json({ error: "Division has student enrollments." });
  if (await countRows("SELECT COUNT(*) AS c FROM users WHERE division_id = ?", [id]))
    return res.status(409).json({ error: "Division assigned to users." });
  await pool.query(`DELETE FROM divisions WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listSubjects(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT s.*, d.name AS department_name FROM subjects s JOIN departments d ON d.id = s.department_id ORDER BY s.code`
  );
  res.json(rows);
}

const subSchema = z.object({
  name: z.string(),
  code: z.string(),
  departmentId: z.number(),
  defaultDurationSlots: z.number().min(1).max(2),
  requiresLab: z.boolean(),
});
export async function createSubject(req: AuthedRequest, res: Response) {
  const p = subSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(
    `INSERT INTO subjects (name, code, department_id, default_duration_slots, requires_lab) VALUES (?,?,?,?,?)`,
    [
      p.data.name,
      p.data.code,
      p.data.departmentId,
      p.data.defaultDurationSlots,
      p.data.requiresLab ? 1 : 0,
    ]
  )) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const subPatchSchema = subSchema.partial();
export async function updateSubject(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = subPatchSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(
    `UPDATE subjects SET name = COALESCE(?, name), code = COALESCE(?, code), department_id = COALESCE(?, department_id),
     default_duration_slots = COALESCE(?, default_duration_slots), requires_lab = COALESCE(?, requires_lab) WHERE id = ?`,
    [
      b.name ?? null,
      b.code ?? null,
      b.departmentId ?? null,
      b.defaultDurationSlots ?? null,
      b.requiresLab !== undefined ? (b.requiresLab ? 1 : 0) : null,
      id,
    ]
  );
  res.json({ ok: true });
}

export async function deleteSubject(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM faculty_subjects WHERE subject_id = ?", [id]))
    return res.status(409).json({ error: "Subject has faculty assignments." });
  if (await countRows("SELECT COUNT(*) AS c FROM timetable_entries WHERE subject_id = ?", [id]))
    return res.status(409).json({ error: "Subject has timetable entries." });
  await pool.query(`DELETE FROM subjects WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listFacultySubjects(_req: AuthedRequest, res: Response) {
  const [rows] = await pool.query(
    `SELECT fs.*, u.full_name AS faculty_name, s.name AS subject_name, s.code AS subject_code, d.name AS division_name
     FROM faculty_subjects fs
     JOIN users u ON u.id = fs.user_id
     JOIN subjects s ON s.id = fs.subject_id
     JOIN divisions d ON d.id = fs.division_id`
  );
  res.json(rows);
}

const fsSchema = z.object({
  userId: z.number(),
  subjectId: z.number(),
  divisionId: z.number(),
});
export async function createFacultySubject(req: AuthedRequest, res: Response) {
  const p = fsSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  try {
    const [ins] = (await pool.query(`INSERT INTO faculty_subjects (user_id, subject_id, division_id) VALUES (?,?,?)`, [
      p.data.userId,
      p.data.subjectId,
      p.data.divisionId,
    ])) as [ResultSetHeader, unknown];
    res.status(201).json({ ok: true, id: ins.insertId });
  } catch {
    res.status(409).json({ error: "Duplicate faculty-subject-division or invalid reference." });
  }
}

export async function deleteFacultySubject(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  await pool.query(`DELETE FROM faculty_subjects WHERE id = ?`, [id]);
  res.json({ ok: true });
}

export async function listRooms(req: AuthedRequest, res: Response) {
  if (req.user?.role === "event_organiser") {
    const [rows] = await pool.query(`SELECT * FROM rooms WHERE is_available = 1 ORDER BY name`);
    return res.json(rows);
  }
  const [rows] = await pool.query(`SELECT * FROM rooms ORDER BY name`);
  res.json(rows);
}

const roomSchema = z.object({
  name: z.string(),
  roomType: z.enum(["classroom", "lab", "event_room", "multipurpose"]),
  capacity: z.number(),
  isAvailable: z.boolean(),
  departmentId: z.number().nullable().optional(),
});
export async function createRoom(req: AuthedRequest, res: Response) {
  const p = roomSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(
    `INSERT INTO rooms (name, room_type, capacity, is_available, department_id) VALUES (?,?,?,?,?)`,
    [
      p.data.name,
      p.data.roomType,
      p.data.capacity,
      p.data.isAvailable ? 1 : 0,
      p.data.departmentId ?? null,
    ]
  )) as [ResultSetHeader, unknown];
  res.status(201).json({ ok: true, id: ins.insertId });
}

const roomUpdateSchema = roomSchema.extend({ id: z.number().optional() }).partial();

export async function updateRoom(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = roomUpdateSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  const b = p.data;
  await pool.query(
    `UPDATE rooms SET name = COALESCE(?, name), room_type = COALESCE(?, room_type),
     capacity = COALESCE(?, capacity), is_available = COALESCE(?, is_available), department_id = COALESCE(?, department_id)
     WHERE id = ?`,
    [
      b.name ?? null,
      b.roomType ?? null,
      b.capacity ?? null,
      b.isAvailable !== undefined ? (b.isAvailable ? 1 : 0) : null,
      b.departmentId !== undefined ? b.departmentId : null,
      id,
    ]
  );
  res.json({ ok: true });
}

export async function deleteRoom(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  if (await countRows("SELECT COUNT(*) AS c FROM timetable_entries WHERE room_id = ?", [id]))
    return res.status(409).json({ error: "Room used in timetable." });
  if (await countRows("SELECT COUNT(*) AS c FROM booking_requests WHERE room_id = ?", [id]))
    return res.status(409).json({ error: "Room has booking requests." });
  await pool.query(`DELETE FROM rooms WHERE id = ?`, [id]);
  res.json({ ok: true });
}
