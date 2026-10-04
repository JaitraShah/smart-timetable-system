import type { Response } from "express";
import { z } from "zod";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { analyzeBookingProposal } from "../services/conflictService.js";
import { logActivity } from "../services/activityLog.js";
import { notifyUser, notifyAdmins } from "../services/notificationService.js";

const checkSchema = z.object({
  roomId: z.number(),
  eventDate: z.string(),
  startTime: z.string(),
  durationHours: z.number().positive(),
  excludeBookingId: z.number().optional(),
  /** Defaults to selected room capacity so suggestions are not smaller than the chosen room. */
  minCapacity: z.number().optional(),
  roomTypePreference: z.string().optional(),
});

export async function checkBooking(req: AuthedRequest, res: Response) {
  const p = checkSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const r = await analyzeBookingProposal(pool, p.data as Parameters<typeof analyzeBookingProposal>[1]);
  res.json({ conflicts: r.conflicts, suggestions: r.suggestions, ok: r.conflicts.length === 0 });
}

const createSchema = checkSchema.extend({
  eventTitle: z.string().min(1),
  description: z.string().min(1),
  submitAnyway: z.boolean().optional(),
});

export async function createBooking(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const p = createSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const { eventTitle, description, submitAnyway, ...checkFields } = p.data;
  const analysis = await analyzeBookingProposal(pool, checkFields as Parameters<typeof analyzeBookingProposal>[1]);
  if (analysis.conflicts.length > 0 && !submitAnyway) {
    return res.status(409).json({
      error: "Conflicts detected",
      conflicts: analysis.conflicts,
      suggestions: analysis.suggestions,
    });
  }
  const [ins] = (await pool.query(
    `INSERT INTO booking_requests
     (user_id, room_id, event_title, description, event_date, start_time, duration_hours, status, submitted_anyway, conflict_summary, suggestions_json)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      req.user.id,
      checkFields.roomId,
      eventTitle,
      description,
      checkFields.eventDate,
      checkFields.startTime.length === 5 ? `${checkFields.startTime}:00` : checkFields.startTime,
      checkFields.durationHours,
      "pending",
      analysis.conflicts.length > 0 && submitAnyway ? 1 : 0,
      analysis.conflicts.length ? analysis.conflicts.map((c) => c.message).join("; ") : null,
      JSON.stringify(analysis.suggestions),
    ]
  )) as [ResultSetHeader, unknown];
  await logActivity(pool, req.user.id, "booking_request_created", "booking_request", ins.insertId, undefined);
  await notifyAdmins(pool, "New booking request", `${eventTitle} on ${checkFields.eventDate}`);
  res.status(201).json({ id: ins.insertId, suggestions: analysis.suggestions });
}

export async function listBookings(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "admin") {
    const [rows] = await pool.query(
      `SELECT b.*, u.full_name AS organiser_name, r.name AS room_name
       FROM booking_requests b
       JOIN users u ON u.id = b.user_id
       JOIN rooms r ON r.id = b.room_id
       ORDER BY b.event_date DESC, b.start_time`
    );
    return res.json(rows);
  }
  if (req.user.role === "event_organiser") {
    const [rows] = await pool.query(
      `SELECT b.*, r.name AS room_name FROM booking_requests b
       JOIN rooms r ON r.id = b.room_id WHERE b.user_id = ? ORDER BY b.event_date DESC`,
      [req.user.id]
    );
    return res.json(rows);
  }
  return res.status(403).json({ error: "Forbidden" });
}

const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().optional(),
});

export async function decideBooking(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = decisionSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });
  await pool.query(`UPDATE booking_requests SET status = ?, admin_note = ? WHERE id = ?`, [
    p.data.status,
    p.data.adminNote ?? null,
    id,
  ]);
  const [rows] = await pool.query(
    `SELECT user_id, event_title FROM booking_requests WHERE id = ?`,
    [id]
  );
  const row0 = (rows as { user_id: number; event_title: string }[])[0];
  if (row0) {
    await notifyUser(
      pool,
      row0.user_id,
      `Booking ${p.data.status}`,
      `Your request "${row0.event_title}" was ${p.data.status}.`
    );
  }
  await logActivity(pool, req.user?.id ?? null, `booking_${p.data.status}`, "booking_request", id, null);
  res.json({ ok: true });
}

const applyAltSchema = z.object({
  roomId: z.number(),
  startTime: z.string(),
  /** When the suggestion moved the event to another calendar day. */
  eventDate: z.string().optional(),
  force: z.boolean().optional(),
  adminNote: z.string().optional(),
});

/** Approve booking after moving to a conflict-free slot (or force override). */
export async function applyBookingAlternative(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const p = applyAltSchema.safeParse(req.body);
  if (!id || !p.success) return res.status(400).json({ error: "Invalid request" });

  const [bRows] = await pool.query(`SELECT * FROM booking_requests WHERE id = ?`, [id]);
  const b = (bRows as Record<string, unknown>[])[0];
  if (!b) return res.status(404).json({ error: "Not found" });
  if (String(b.status) !== "pending") return res.status(400).json({ error: "Booking is not pending" });

  const eventDate = (p.data.eventDate ?? String(b.event_date)).slice(0, 10);
  const durationHours = Number(b.duration_hours);
  let startNorm = p.data.startTime.length === 5 ? `${p.data.startTime}:00` : p.data.startTime;

  const analysis = await analyzeBookingProposal(pool, {
    roomId: p.data.roomId,
    eventDate,
    startTime: startNorm,
    durationHours,
    excludeBookingId: id,
  });

  if (analysis.conflicts.length > 0 && !p.data.force) {
    return res.status(409).json({
      error: "Conflicts at chosen slot",
      conflicts: analysis.conflicts,
      suggestions: analysis.suggestions,
    });
  }

  const note =
    p.data.adminNote ??
    (p.data.force
      ? "Approved with admin override (conflicts acknowledged)."
      : "Approved using suggested alternative slot.");

  await pool.query(
    `UPDATE booking_requests SET room_id = ?, start_time = ?, event_date = ?, status = 'approved', admin_note = ?, conflict_summary = NULL, suggestions_json = NULL WHERE id = ?`,
    [p.data.roomId, startNorm, eventDate, note, id]
  );

  await notifyUser(
    pool,
    Number(b.user_id),
    "Booking approved",
    `Your event "${String(b.event_title)}" was approved for ${eventDate} at ${startNorm.slice(0, 5)}.`
  );
  await logActivity(pool, req.user?.id ?? null, "booking_approved_alternative", "booking_request", id, note);
  res.json({ ok: true });
}
