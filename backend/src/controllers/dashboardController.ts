import type { Response } from "express";
import { pool } from "../config/db.js";
import type { AuthedRequest } from "../middleware/auth.js";

function firstRow<T>(rows: unknown): T | undefined {
  return (rows as T[])[0];
}

export async function adminDashboard(_req: AuthedRequest, res: Response) {
  const [tcRows] = await pool.query("SELECT COUNT(*) AS c FROM timetable_entries");
  const [rmRows] = await pool.query("SELECT COUNT(*) AS c FROM rooms");
  const [bkRows] = await pool.query("SELECT COUNT(*) AS c FROM booking_requests");
  const [clRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM activity_logs WHERE action LIKE '%conflict%' OR action LIKE '%Conflict%'`
  );
  const [userRows] = await pool.query("SELECT COUNT(*) AS c FROM users");
  const [subjRows] = await pool.query("SELECT COUNT(*) AS c FROM subjects");
  const timetableCount = firstRow<{ c: number }>(tcRows);
  const roomCount = firstRow<{ c: number }>(rmRows);
  const bookingCount = firstRow<{ c: number }>(bkRows);
  const conflictLogs = firstRow<{ c: number }>(clRows);
  const userCount = firstRow<{ c: number }>(userRows);
  const subjectCount = firstRow<{ c: number }>(subjRows);

  const [pendingBookings] = await pool.query(
    `SELECT b.id, b.event_title, b.event_date, b.start_time, u.full_name AS organiser_name, r.name AS room_name,
            b.suggestions_json, b.conflict_summary, b.duration_hours
     FROM booking_requests b
     JOIN users u ON u.id = b.user_id
     JOIN rooms r ON r.id = b.room_id
     WHERE b.status = 'pending' ORDER BY b.event_date LIMIT 10`
  );
  const [pendingRegs] = await pool.query(
    `SELECT id, email, full_name, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.registration_status = 'pending' LIMIT 10`
  );
  const [pendingFacultyReq] = await pool.query(
    `SELECT id, reason, created_at, subject_hint, preferred_day, preferred_start_time
     FROM timetable_change_requests WHERE status = 'pending' LIMIT 10`
  );
  const [activities] = await pool.query(
    `SELECT a.*, u.full_name FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT 15`
  );
  res.json({
    stats: {
      timetableEntries: Number(timetableCount?.c ?? 0),
      rooms: Number(roomCount?.c ?? 0),
      bookings: Number(bookingCount?.c ?? 0),
      conflictRelatedActions: Number(conflictLogs?.c ?? 0),
      users: Number(userCount?.c ?? 0),
      subjects: Number(subjectCount?.c ?? 0),
    },
    pendingBookings,
    pendingRegistrations: pendingRegs,
    pendingFacultyRequests: pendingFacultyReq,
    recentActivity: activities,
  });
}

export async function facultyDashboard(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [nextClasses] = await pool.query(
    `SELECT te.day_of_week, te.start_time, s.name AS subject_name, r.name AS room_name
     FROM timetable_entries te
     JOIN subjects s ON s.id = te.subject_id
     JOIN rooms r ON r.id = te.room_id
     WHERE te.faculty_user_id = ? ORDER BY te.day_of_week, te.start_time LIMIT 8`,
    [req.user.id]
  );
  const [rcRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM timetable_change_requests WHERE user_id = ? AND status = 'pending'`,
    [req.user.id]
  );
  const reqCount = firstRow<{ c: number }>(rcRows);
  const [notes] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
    [req.user.id]
  );
  res.json({ nextClasses, pendingRequests: Number(reqCount?.c ?? 0), notifications: notes });
}

export async function studentDashboard(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [uRows] = await pool.query(`SELECT division_id FROM users WHERE id = ?`, [req.user.id]);
  const u0 = firstRow<{ division_id: number | null }>(uRows);
  let div = u0?.division_id;
  let classes: unknown[] = [];
  if (div) {
    const [rows] = await pool.query(
      `SELECT te.day_of_week, te.start_time, s.name AS subject_name, r.name AS room_name, fac.full_name AS faculty_name
       FROM timetable_entries te
       JOIN subjects s ON s.id = te.subject_id
       JOIN rooms r ON r.id = te.room_id
       JOIN users fac ON fac.id = te.faculty_user_id
       WHERE te.division_id = ? ORDER BY te.day_of_week, te.start_time LIMIT 10`,
      [div]
    );
    classes = rows as unknown[];
  }
  if (!div) {
    const [eRows] = await pool.query(
      `SELECT division_id FROM student_enrollments WHERE user_id = ? LIMIT 1`,
      [req.user.id]
    );
    const e0 = firstRow<{ division_id: number }>(eRows);
    if (e0?.division_id) {
      div = e0.division_id;
      const [rows] = await pool.query(
        `SELECT te.day_of_week, te.start_time, s.name AS subject_name, r.name AS room_name, fac.full_name AS faculty_name
         FROM timetable_entries te
         JOIN subjects s ON s.id = te.subject_id
         JOIN rooms r ON r.id = te.room_id
         JOIN users fac ON fac.id = te.faculty_user_id
         WHERE te.division_id = ? ORDER BY te.day_of_week, te.start_time LIMIT 10`,
        [div]
      );
      classes = rows as unknown[];
    }
  }
  const [notes] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
    [req.user.id]
  );
  res.json({ upcomingClasses: classes, notifications: notes });
}

export async function organiserDashboard(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const [upcoming] = await pool.query(
    `SELECT * FROM booking_requests WHERE user_id = ? AND event_date >= CURDATE() ORDER BY event_date LIMIT 10`,
    [req.user.id]
  );
  const [past] = await pool.query(
    `SELECT * FROM booking_requests WHERE user_id = ? AND event_date < CURDATE() ORDER BY event_date DESC LIMIT 5`,
    [req.user.id]
  );
  const [cntRows] = await pool.query(
    `SELECT SUM(status='pending') AS p, SUM(status='approved') AS a FROM booking_requests WHERE user_id = ?`,
    [req.user.id]
  );
  const counts = firstRow<{ p: number | string | null; a: number | string | null }>(cntRows);
  res.json({
    upcoming,
    past,
    pendingCount: Number(counts?.p ?? 0),
    approvedCount: Number(counts?.a ?? 0),
  });
}
