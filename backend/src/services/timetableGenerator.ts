/**
 * Simple greedy timetable generator: places each faculty–subject–division
 * assignment that does not yet have an entry for the semester.
 */

import type { Pool, RowDataPacket } from "mysql2/promise";
import { isSlotFreeForTimetable, roomTypeMatchesEntry } from "./conflictService.js";
import { endMinutes, minutesToTime, validStartsForDurationSlots } from "../utils/timeSlots.js";

interface FsRow extends RowDataPacket {
  user_id: number;
  subject_id: number;
  division_id: number;
  default_duration_slots: number;
  requires_lab: number;
}

export async function generateMissingTimetableEntries(
  pool: Pool,
  semesterId: number,
  divisionId: number
): Promise<{ created: number; skipped: { subjectId: number; reason: string }[] }> {
  const [fsRowsRaw] = await pool.query(
    `SELECT fs.user_id, fs.subject_id, fs.division_id, s.default_duration_slots, s.requires_lab
     FROM faculty_subjects fs
     JOIN subjects s ON s.id = fs.subject_id
     WHERE fs.division_id = ?
     AND NOT EXISTS (
       SELECT 1 FROM timetable_entries te
       WHERE te.semester_id = ? AND te.division_id = fs.division_id AND te.subject_id = fs.subject_id
     )`,
    [divisionId, semesterId]
  );
  const fsRows = fsRowsRaw as FsRow[];

  const [roomsRaw] = await pool.query(
    `SELECT id, room_type FROM rooms WHERE is_available = 1 ORDER BY id`
  );
  const rooms = roomsRaw as { id: number; room_type: string }[];

  let created = 0;
  const skipped: { subjectId: number; reason: string }[] = [];

  for (const fs of fsRows) {
    const durationSlots = fs.default_duration_slots;
    const entryType = fs.requires_lab ? "lab" : "lecture";
    const starts = validStartsForDurationSlots(durationSlots);
    let placed = false;

    outer: for (let day = 1; day <= 6; day++) {
      for (const room of rooms) {
        if (!roomTypeMatchesEntry(entryType, room.room_type)) continue;
        for (const startMin of starts) {
          const endMin = endMinutes(startMin, durationSlots);
          const ok = await isSlotFreeForTimetable(pool, {
            roomId: room.id,
            dayOfWeek: day,
            startMin,
            endMin,
            facultyUserId: fs.user_id,
            divisionId: fs.division_id,
          });
          if (!ok) continue;
          await pool.query(
            `INSERT INTO timetable_entries (semester_id, division_id, subject_id, faculty_user_id, room_id, day_of_week, start_time, duration_slots, entry_type, review_status)
             VALUES (?,?,?,?,?,?,?,?,?,'none')`,
            [
              semesterId,
              fs.division_id,
              fs.subject_id,
              fs.user_id,
              room.id,
              day,
              minutesToTime(startMin),
              durationSlots,
              entryType,
            ]
          );
          created++;
          placed = true;
          break outer;
        }
      }
    }
    if (!placed) {
      skipped.push({
        subjectId: fs.subject_id,
        reason: "No free slot found respecting room, faculty, and division constraints.",
      });
    }
  }

  return { created, skipped };
}
