import type { Response } from "express";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { notifyAdmins, notifyUser } from "../services/notificationService.js";
import { logActivity } from "../services/activityLog.js";
import { analyzeTimetableProposal } from "../services/conflictService.js";

const createSchema = z.object({
  subjectHint: z.string().optional(),
  reason: z.string().min(5),
  preferredDay: z.number().min(1).max(6).optional(),
  preferredStartTime: z.string().optional(),
});

export async function createChangeRequest(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const p = createSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const [ins] = (await pool.query(
    `INSERT INTO timetable_change_requests (user_id, subject_hint, reason, preferred_day, preferred_start_time)
     VALUES (?,?,?,?,?)`,
    [
      req.user.id,
      p.data.subjectHint ?? null,
      p.data.reason,
      p.data.preferredDay ?? null,
      p.data.preferredStartTime ?? null,
    ]
  )) as [ResultSetHeader, unknown];
  await notifyAdmins(pool, "Faculty timetable request", `${req.user.email} submitted a change request.`);
  await logActivity(pool, req.user.id, "timetable_change_request", "timetable_change_request", ins.insertId, undefined);
  res.status(201).json({ id: ins.insertId });
}

export async function listChangeRequests(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "admin") {
    const [rows] = await pool.query(
      `SELECT t.*, u.full_name, u.email FROM timetable_change_requests t
       JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC`
    );
    return res.json(rows);
  }
  const [rows] = await pool.query(
    `SELECT * FROM timetable_change_requests WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}

const resolveSchema = z.object({
  status: z.enum(["approved", "rejected", "resolved"]),
  adminResponse: z.string().optional(),
});

export async function resolveChangeRequest(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = resolveSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  await pool.query(
    `UPDATE timetable_change_requests SET status = ?, admin_response = ? WHERE id = ?`,
    [p.data.status, p.data.adminResponse ?? null, id]
  );
  const [rows] = await pool.query(
    `SELECT user_id FROM timetable_change_requests WHERE id = ?`,
    [id]
  );
  const u0 = (rows as { user_id: number }[])[0];
  if (u0) {
    await notifyUser(
      pool,
      u0.user_id,
      "Timetable request updated",
      `Status: ${p.data.status}. ${p.data.adminResponse ?? ""}`
    );
  }
  await logActivity(pool, req.user?.id ?? null, "timetable_change_resolved", "timetable_change_request", id, null);
  res.json({ ok: true });
}

/** DB-driven alternatives for a faculty request (matches one timetable row + optional preferred slot). */
export async function getChangeRequestSuggestions(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  const [reqRows] = await pool.query(
    `SELECT t.* FROM timetable_change_requests t WHERE t.id = ?`,
    [id]
  );
  const row = (reqRows as Record<string, unknown>[])[0];
  if (!row) return res.status(404).json({ error: "Not found" });

  const facultyId = Number(row.user_id);
  const hint = row.subject_hint;

  const [entryRows] = await pool.query(
    `SELECT te.* FROM timetable_entries te
     JOIN subjects s ON s.id = te.subject_id
     WHERE te.faculty_user_id = ?
     AND (? IS NULL OR ? = '' OR s.name LIKE CONCAT('%', ?, '%'))
     ORDER BY te.id LIMIT 1`,
    [facultyId, hint, hint, hint]
  );
  const entry = (entryRows as Record<string, unknown>[])[0];
  if (!entry) {
    return res.json({
      ok: false,
      message: "No timetable row found for this faculty (add a subject hint that matches a subject name).",
      conflicts: [],
      suggestions: [],
    });
  }

  const day =
    row.preferred_day != null && row.preferred_day !== ""
      ? Number(row.preferred_day)
      : Number(entry.day_of_week);
  const startRaw = row.preferred_start_time ?? entry.start_time;
  const startTime = String(startRaw).slice(0, 8);

  const analysis = await analyzeTimetableProposal(pool, {
    roomId: Number(entry.room_id),
    facultyUserId: facultyId,
    divisionId: Number(entry.division_id),
    dayOfWeek: day,
    startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
    durationSlots: Number(entry.duration_slots),
    entryType: String(entry.entry_type) === "lab" ? "lab" : "lecture",
    excludeEntryId: Number(entry.id),
  });

  res.json({
    ok: true,
    basedOnEntryId: Number(entry.id),
    conflicts: analysis.conflicts,
    suggestions: analysis.suggestions,
  });
}
