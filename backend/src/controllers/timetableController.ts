import type { Response } from "express";
import { z } from "zod";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { analyzeTimetableProposal } from "../services/conflictService.js";
import { generateMissingTimetableEntries } from "../services/timetableGenerator.js";
import { logActivity } from "../services/activityLog.js";
import { notifyUser } from "../services/notificationService.js";
import type { ResultSetHeader } from "mysql2";

const proposalSchema = z.object({
  roomId: z.number(),
  facultyUserId: z.number(),
  divisionId: z.number(),
  dayOfWeek: z.number().min(1).max(6),
  startTime: z.string(),
  durationSlots: z.number().min(1).max(2),
  entryType: z.enum(["lecture", "lab"]),
  excludeEntryId: z.number().optional(),
});

export async function checkTimetable(req: AuthedRequest, res: Response) {
  const p = proposalSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const r = await analyzeTimetableProposal(pool, { ...p.data } as Parameters<typeof analyzeTimetableProposal>[1]);
  res.json({ conflicts: r.conflicts, suggestions: r.suggestions, ok: r.conflicts.length === 0 });
}

const createSchema = proposalSchema.extend({
  semesterId: z.number(),
  subjectId: z.number(),
  submitAnyway: z.boolean().optional(),
});

export async function createEntry(req: AuthedRequest, res: Response) {
  const p = createSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const { semesterId, subjectId, submitAnyway, ...rest } = p.data;
  const analysis = await analyzeTimetableProposal(pool, rest as Parameters<typeof analyzeTimetableProposal>[1]);
  if (analysis.conflicts.length > 0 && !submitAnyway) {
    return res.status(409).json({
      error: "Conflicts detected",
      conflicts: analysis.conflicts,
      suggestions: analysis.suggestions,
    });
  }
  const reviewStatus =
    analysis.conflicts.length > 0 && submitAnyway ? "pending_review" : "none";
  const [ins] = (await pool.query(
    `INSERT INTO timetable_entries
     (semester_id, division_id, subject_id, faculty_user_id, room_id, day_of_week, start_time, duration_slots, entry_type, review_status, admin_notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      semesterId,
      rest.divisionId,
      subjectId,
      rest.facultyUserId,
      rest.roomId,
      rest.dayOfWeek,
      rest.startTime.length === 5 ? `${rest.startTime}:00` : rest.startTime,
      rest.durationSlots,
      rest.entryType,
      reviewStatus,
      reviewStatus === "pending_review" ? JSON.stringify(analysis.conflicts) : null,
    ]
  )) as [ResultSetHeader, unknown];
  await logActivity(pool, req.user?.id ?? null, "timetable_entry_created", "timetable_entry", ins.insertId, undefined);
  if (rest.facultyUserId) {
    await notifyUser(
      pool,
      rest.facultyUserId,
      reviewStatus === "pending_review" ? "Timetable entry needs review" : "New timetable slot",
      reviewStatus === "pending_review"
        ? "An admin placed or approved a conflicting slot pending review."
        : "Your teaching schedule has been updated."
    );
  }
  res.status(201).json({ id: ins.insertId, reviewStatus, suggestions: analysis.suggestions });
}

const updateSchema = z.object({
  roomId: z.number().optional(),
  dayOfWeek: z.number().min(1).max(6).optional(),
  startTime: z.string().optional(),
  durationSlots: z.number().min(1).max(2).optional(),
  reviewStatus: z.enum(["none", "pending_review", "resolved"]).optional(),
  /** Admin: apply update even if conflicts remain (manual override). */
  ignoreConflicts: z.boolean().optional(),
});

export async function updateEntry(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = updateSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });

  const [cur] = await pool.query(`SELECT room_id, faculty_user_id, division_id, day_of_week, start_time, duration_slots, entry_type FROM timetable_entries WHERE id = ?`, [id]);
  const row = cur[0];
  if (!row) return res.status(404).json({ error: "Not found" });

  const next = {
    roomId: p.data.roomId ?? row.room_id,
    facultyUserId: row.faculty_user_id,
    divisionId: row.division_id,
    dayOfWeek: p.data.dayOfWeek ?? row.day_of_week,
    startTime: (p.data.startTime ?? String(row.start_time).slice(0, 8)).slice(0, 8),
    durationSlots: p.data.durationSlots ?? row.duration_slots,
    entryType: row.entry_type as "lecture" | "lab",
    excludeEntryId: id,
  };
  const analysis = await analyzeTimetableProposal(pool, next as Parameters<typeof analyzeTimetableProposal>[1]);
  if (analysis.conflicts.length > 0 && !p.data.ignoreConflicts) {
    return res.status(409).json({ conflicts: analysis.conflicts, suggestions: analysis.suggestions });
  }

  const st = next.startTime.length === 5 ? `${next.startTime}:00` : next.startTime;
  await pool.query(
    `UPDATE timetable_entries SET room_id=?, day_of_week=?, start_time=?, duration_slots=?, review_status=COALESCE(?, review_status) WHERE id=?`,
    [next.roomId, next.dayOfWeek, st, next.durationSlots, p.data.reviewStatus ?? null, id]
  );
  if (p.data.ignoreConflicts && analysis.conflicts.length > 0) {
    await pool.query(`UPDATE timetable_entries SET admin_notes=? WHERE id=?`, [
      `Admin override: ${analysis.conflicts.map((c) => c.message).join("; ")}`,
      id,
    ]);
  } else if (p.data.reviewStatus === "resolved") {
    await pool.query(`UPDATE timetable_entries SET admin_notes=NULL WHERE id=?`, [id]);
  }
  await logActivity(pool, req.user?.id ?? null, "timetable_entry_updated", "timetable_entry", id, null);
  res.json({ ok: true });
}

export async function deleteEntry(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });
  await pool.query(`DELETE FROM timetable_entries WHERE id = ?`, [id]);
  await logActivity(pool, req.user?.id ?? null, "timetable_entry_deleted", "timetable_entry", id, null);
  res.json({ ok: true });
}

export async function listTimetable(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const semesterId = req.query.semesterId ? Number(req.query.semesterId) : null;

  let sql = `
    SELECT te.*, s.name AS subject_name, s.code AS subject_code, r.name AS room_name, r.room_type,
           u.full_name AS faculty_name, d.name AS division_name, sem.name AS semester_name
    FROM timetable_entries te
    JOIN subjects s ON s.id = te.subject_id
    JOIN rooms r ON r.id = te.room_id
    JOIN users u ON u.id = te.faculty_user_id
    JOIN divisions d ON d.id = te.division_id
    JOIN semesters sem ON sem.id = te.semester_id
    WHERE 1=1`;
  const params: unknown[] = [];

  if (req.user.role === "faculty") {
    sql += ` AND te.faculty_user_id = ?`;
    params.push(req.user.id);
  } else if (req.user.role === "student") {
    const [u] = await pool.query(`SELECT division_id FROM users WHERE id = ?`, [req.user.id]);
    let div = (u as { division_id: number | null }[])[0]?.division_id;
    if (!div) {
      const [e] = await pool.query(
        `SELECT division_id FROM student_enrollments WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );
      div = (e as { division_id: number }[])[0]?.division_id ?? null;
    }
    if (!div) return res.json([]);
    sql += ` AND te.division_id = ?`;
    params.push(div);
  }

  if (semesterId) {
    sql += ` AND te.semester_id = ?`;
    params.push(semesterId);
  }

  sql += ` ORDER BY te.day_of_week, te.start_time`;
  const [rows] = await pool.query(sql, params);
  res.json(rows as unknown[]);
}

export async function generateTimetable(req: AuthedRequest, res: Response) {
  const schema = z.object({ semesterId: z.number(), divisionId: z.number() });
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const r = await generateMissingTimetableEntries(pool, p.data.semesterId, p.data.divisionId);
  await logActivity(pool, req.user?.id ?? null, "timetable_generated", undefined, undefined, JSON.stringify(r));
  const [facultyRows] = await pool.query(
    `SELECT DISTINCT user_id AS id FROM faculty_subjects WHERE division_id = ?`,
    [p.data.divisionId]
  );
  const faculty = facultyRows as { id: number }[];
  for (const f of faculty) {
    await notifyUser(pool, f.id, "Timetable generation run", `Created ${r.created} new slots. Skipped: ${r.skipped.length}.`);
  }
  res.json(r);
}

const importRowSchema = z.object({
  day_of_week: z.coerce.number().min(1).max(6),
  start_time: z.string(),
  duration_slots: z.coerce.number().min(1).max(2),
  subject_code: z.string(),
  room_name: z.string(),
  faculty_email: z.string().email(),
  division_code: z.string(),
  semester_id: z.coerce.number(),
  entry_type: z.enum(["lecture", "lab"]).optional(),
});

/** Simple CSV import: header row required matching importRowSchema keys. */
export async function importCsv(req: AuthedRequest, res: Response) {
  const raw = String(req.body?.csv ?? "");
  if (!raw.trim()) return res.status(400).json({ error: "Missing csv body field" });
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return res.status(400).json({ error: "CSV must have header and rows" });
  const headers = lines[0].split(",").map((h) => h.trim());
  let ok = 0;
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? "";
    });
    const parsed = importRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`Line ${i + 1}: ${parsed.error.message}`);
      continue;
    }
    const d = parsed.data;
    const [subRows] = await pool.query("SELECT id FROM subjects WHERE code = ?", [d.subject_code]);
    const [roomRows] = await pool.query("SELECT id FROM rooms WHERE name = ?", [d.room_name]);
    const [facRows] = await pool.query("SELECT id FROM users WHERE email = ?", [d.faculty_email.toLowerCase()]);
    const [divRows] = await pool.query("SELECT id FROM divisions WHERE code = ?", [d.division_code]);
    const sub = (subRows as { id: number }[])[0];
    const room = (roomRows as { id: number }[])[0];
    const fac = (facRows as { id: number }[])[0];
    const div = (divRows as { id: number }[])[0];
    if (!sub || !room || !fac || !div) {
      errors.push(`Line ${i + 1}: unknown subject/room/faculty/division reference`);
      continue;
    }
    const analysis = await analyzeTimetableProposal(pool, {
      roomId: room.id,
      facultyUserId: fac.id,
      divisionId: div.id,
      dayOfWeek: d.day_of_week,
      startTime: d.start_time,
      durationSlots: d.duration_slots,
      entryType: d.entry_type ?? "lecture",
    });
    if (analysis.conflicts.length > 0) {
      errors.push(`Line ${i + 1}: conflicts — ${analysis.conflicts.map((c) => c.message).join("; ")}`);
      continue;
    }
    await pool.query(
      `INSERT INTO timetable_entries (semester_id, division_id, subject_id, faculty_user_id, room_id, day_of_week, start_time, duration_slots, entry_type, review_status)
       VALUES (?,?,?,?,?,?,?,?,?,'none')`,
      [
        d.semester_id,
        div.id,
        sub.id,
        fac.id,
        room.id,
        d.day_of_week,
        d.start_time.length === 5 ? `${d.start_time}:00` : d.start_time,
        d.duration_slots,
        d.entry_type ?? "lecture",
      ]
    );
    ok++;
  }
  res.json({ imported: ok, errors });
}
