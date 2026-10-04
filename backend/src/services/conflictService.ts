/**
 * Conflict detection and real alternative suggestions using DB occupancy.
 * Suggestions are deterministic: scan valid slots/rooms in fixed order until 3 found.
 */

import type { Pool, RowDataPacket } from "mysql2/promise";
import {
  bookingDurationToMinutes,
  endMinutes,
  jsDateToAcademicDayOfWeek,
  rangesOverlap,
  timeToMinutes,
  validStartsForDurationSlots,
  WORK_END_MIN,
  WORK_START_MIN,
  minutesToTime,
} from "../utils/timeSlots.js";

export type ConflictDetail = {
  code: "ROOM" | "FACULTY" | "DIVISION" | "DURATION" | "EVENT_TIMETABLE" | "OUTSIDE_HOURS" | "INVALID_DAY";
  message: string;
};

export type AlternativeSuggestion = {
  roomId: number;
  roomName: string;
  roomType: string;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  reason: string;
  /** When set, use this calendar date instead of the original request date. */
  eventDate?: string;
};

const DAY_LABELS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dayLabel(d: number): string {
  return DAY_LABELS[d] ?? `Day ${d}`;
}

/** Local calendar arithmetic (avoid UTC off-by-one on YYYY-MM-DD). */
function addCalendarDaysLocal(isoDate: string, days: number): string {
  const parts = isoDate.split("-").map((x) => parseInt(x, 10));
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d0 = parts[2] ?? 1;
  const dt = new Date(y, m - 1, d0 + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Hourly grid, or 30-minute steps when duration is not a whole hour. */
function bookingStartGridMinutes(durationMin: number): number[] {
  const step = durationMin % 60 !== 0 ? 30 : 60;
  const starts: number[] = [];
  for (let m = WORK_START_MIN; m + durationMin <= WORK_END_MIN; m += step) {
    starts.push(m);
  }
  return starts;
}

function sortStartsPreferring(preferred: number, grid: number[]): number[] {
  const has = grid.includes(preferred);
  const rest = grid.filter((x) => x !== preferred);
  return has ? [preferred, ...rest] : [...grid];
}

type BookingSuggestCore = {
  durationHours: number;
  durationMin: number;
  excludeBookingId?: number;
  minCapacity: number;
  roomTypePreference?: string;
  originalRoomId: number;
  originalStartMin: number;
  originalEventDate: string;
};

async function collectBookingSuggestionsForDate(
  pool: Pool,
  core: BookingSuggestCore,
  forDate: string,
  forDow: number,
  maxToAdd: number,
  skipOriginalSlot: boolean
): Promise<AlternativeSuggestion[]> {
  if (maxToAdd <= 0) return [];
  const allowedTypes = core.roomTypePreference
    ? roomTypesForBookingPreference(core.roomTypePreference)
    : ["classroom", "multipurpose", "lab", "event_room"];

  const allRooms = await loadRooms(pool);
  const candidates = allRooms.filter(
    (r) => allowedTypes.includes(r.room_type) && r.capacity >= core.minCapacity
  );
  const ordered: RoomRow[] = [];
  const orig = candidates.find((r) => r.id === core.originalRoomId);
  if (orig) ordered.push(orig);
  for (const r of candidates) {
    if (!ordered.find((x) => x.id === r.id)) ordered.push(r);
  }

  const starts = sortStartsPreferring(core.originalStartMin, bookingStartGridMinutes(core.durationMin));
  const out: AlternativeSuggestion[] = [];

  for (const room of ordered) {
    for (const startMin of starts) {
      if (out.length >= maxToAdd) return out;
      const endMin = startMin + core.durationMin;
      if (endMin > WORK_END_MIN || startMin < WORK_START_MIN) continue;

      if (
        skipOriginalSlot &&
        forDate === core.originalEventDate &&
        room.id === core.originalRoomId &&
        startMin === core.originalStartMin
      ) {
        continue;
      }

      let clash = false;
      for (const r of await fetchTimetableForRoomOnCalendarDay(pool, room.id, forDate)) {
        const iv = intervalFromTimetableRow(r);
        if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
          clash = true;
          break;
        }
      }
      if (clash) continue;
      for (const b of await fetchBookingsForRoomOnDate(pool, room.id, forDate, core.excludeBookingId)) {
        const iv = intervalFromBookingRow(b);
        if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
          clash = true;
          break;
        }
      }
      if (clash) continue;

      const altDate = forDate !== core.originalEventDate ? forDate : undefined;
      out.push({
        roomId: room.id,
        roomName: room.name,
        roomType: room.room_type,
        dayOfWeek: forDow,
        dayLabel: dayLabel(forDow),
        startTime: minutesToTime(startMin),
        endTime: minutesToTime(endMin),
        reason: altDate
          ? `${dayLabel(forDow)} ${altDate}: ${room.name} is free for this interval (timetable + bookings checked).`
          : `On ${forDate}, ${room.name} has no overlapping class or booking for this interval.`,
        eventDate: altDate,
      });
      if (out.length >= maxToAdd) return out;
    }
  }
  return out;
}

async function buildBookingSuggestionsAcrossDates(pool: Pool, core: BookingSuggestCore): Promise<AlternativeSuggestion[]> {
  const out: AlternativeSuggestion[] = [];
  for (let delta = 1; delta <= 28 && out.length < 3; delta++) {
    const nd = addCalendarDaysLocal(core.originalEventDate, delta);
    const ndow = jsDateToAcademicDayOfWeek(new Date(nd + "T12:00:00"));
    if (ndow == null) continue;
    const batch = await collectBookingSuggestionsForDate(pool, core, nd, ndow, 3 - out.length, false);
    out.push(...batch);
  }
  return out;
}

interface TimetableRow extends RowDataPacket {
  id: number;
  room_id: number;
  faculty_user_id: number;
  division_id: number;
  day_of_week: number;
  start_time: string;
  duration_slots: number;
}

interface BookingRow extends RowDataPacket {
  id: number;
  room_id: number;
  event_date: string;
  start_time: string;
  duration_hours: string | number;
  status: string;
}

interface RoomRow extends RowDataPacket {
  id: number;
  name: string;
  room_type: string;
  capacity: number;
  is_available: number;
}

function intervalFromTimetableRow(r: TimetableRow): { start: number; end: number } {
  const start = timeToMinutes(String(r.start_time).slice(0, 8));
  return { start, end: endMinutes(start, r.duration_slots) };
}

function intervalFromBookingRow(r: BookingRow): { start: number; end: number } {
  const start = timeToMinutes(String(r.start_time).slice(0, 8));
  const hours = Number(r.duration_hours);
  const end = start + bookingDurationToMinutes(hours);
  return { start, end };
}

export async function fetchTimetableForRoomDay(
  pool: Pool,
  roomId: number,
  dayOfWeek: number,
  excludeEntryId?: number
): Promise<TimetableRow[]> {
  const [rows] = await pool.query(
    `SELECT id, room_id, faculty_user_id, division_id, day_of_week, start_time, duration_slots
     FROM timetable_entries WHERE room_id = ? AND day_of_week = ?
     ${excludeEntryId ? "AND id <> ?" : ""}`,
    excludeEntryId ? [roomId, dayOfWeek, excludeEntryId] : [roomId, dayOfWeek]
  );
  return rows as TimetableRow[];
}

export async function fetchTimetableForFacultyDay(
  pool: Pool,
  facultyUserId: number,
  dayOfWeek: number,
  excludeEntryId?: number
): Promise<TimetableRow[]> {
  const [rows] = await pool.query(
    `SELECT id, room_id, faculty_user_id, division_id, day_of_week, start_time, duration_slots
     FROM timetable_entries WHERE faculty_user_id = ? AND day_of_week = ?
     ${excludeEntryId ? "AND id <> ?" : ""}`,
    excludeEntryId ? [facultyUserId, dayOfWeek, excludeEntryId] : [facultyUserId, dayOfWeek]
  );
  return rows as TimetableRow[];
}

export async function fetchTimetableForDivisionDay(
  pool: Pool,
  divisionId: number,
  dayOfWeek: number,
  excludeEntryId?: number
): Promise<TimetableRow[]> {
  const [rows] = await pool.query(
    `SELECT id, room_id, faculty_user_id, division_id, day_of_week, start_time, duration_slots
     FROM timetable_entries WHERE division_id = ? AND day_of_week = ?
     ${excludeEntryId ? "AND id <> ?" : ""}`,
    excludeEntryId ? [divisionId, dayOfWeek, excludeEntryId] : [divisionId, dayOfWeek]
  );
  return rows as TimetableRow[];
}

export async function fetchBookingsForRoomOnDate(
  pool: Pool,
  roomId: number,
  eventDate: string,
  excludeBookingId?: number
): Promise<BookingRow[]> {
  const [rows] = await pool.query(
    `SELECT id, room_id, event_date, start_time, duration_hours, status FROM booking_requests
     WHERE room_id = ? AND event_date = ? AND status IN ('pending','approved')
     ${excludeBookingId ? "AND id <> ?" : ""}`,
    excludeBookingId ? [roomId, eventDate, excludeBookingId] : [roomId, eventDate]
  );
  return rows as BookingRow[];
}

/** Timetable pattern on the weekday of `eventDate` for this room (for event vs class conflict). */
export async function fetchTimetableForRoomOnCalendarDay(
  pool: Pool,
  roomId: number,
  eventDate: string
): Promise<TimetableRow[]> {
  const d = new Date(eventDate + "T12:00:00");
  const dow = jsDateToAcademicDayOfWeek(d);
  if (dow == null) return [];
  return fetchTimetableForRoomDay(pool, roomId, dow);
}

export function roomTypeMatchesEntry(entryType: "lecture" | "lab", roomType: string): boolean {
  if (entryType === "lab") return roomType === "lab" || roomType === "multipurpose";
  return roomType === "classroom" || roomType === "lab" || roomType === "multipurpose";
}

function roomTypesForBookingPreference(pref: string): string[] {
  const p = pref.toLowerCase();
  if (p.includes("auditorium")) return ["event_room"];
  if (p.includes("lecture")) return ["multipurpose", "classroom"];
  if (p.includes("computer") || p.includes("lab")) return ["lab", "multipurpose"];
  if (p.includes("classroom")) return ["classroom", "multipurpose"];
  return ["classroom", "multipurpose", "lab", "event_room"];
}

async function loadRooms(pool: Pool): Promise<RoomRow[]> {
  const [rows] = await pool.query(
    `SELECT id, name, room_type, capacity, is_available FROM rooms WHERE is_available = 1 ORDER BY id`
  );
  return rows as RoomRow[];
}

export type FreeCheck = {
  roomId: number;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
  facultyUserId: number;
  divisionId: number;
  excludeTimetableEntryId?: number;
};

export async function isSlotFreeForTimetable(
  pool: Pool,
  c: FreeCheck
): Promise<boolean> {
  const roomRows = await fetchTimetableForRoomDay(pool, c.roomId, c.dayOfWeek, c.excludeTimetableEntryId);
  for (const r of roomRows) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(c.startMin, c.endMin, iv.start, iv.end)) return false;
  }
  const facRows = await fetchTimetableForFacultyDay(
    pool,
    c.facultyUserId,
    c.dayOfWeek,
    c.excludeTimetableEntryId
  );
  for (const r of facRows) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(c.startMin, c.endMin, iv.start, iv.end)) return false;
  }
  const divRows = await fetchTimetableForDivisionDay(
    pool,
    c.divisionId,
    c.dayOfWeek,
    c.excludeTimetableEntryId
  );
  for (const r of divRows) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(c.startMin, c.endMin, iv.start, iv.end)) return false;
  }
  return true;
}

/** Also ensure no booking on any concrete Monday..Saturday date is needed for weekly slot — we only check "template" day; bookings are date-specific. */
/**
 * For a proposed recurring timetable slot, check room/faculty/division overlaps (timetable only).
 * Booking-vs-timetable is handled in booking flow using a specific date.
 */
export async function analyzeTimetableProposal(pool: Pool, p: {
  roomId: number;
  facultyUserId: number;
  divisionId: number;
  dayOfWeek: number;
  startTime: string;
  durationSlots: number;
  entryType: "lecture" | "lab";
  excludeEntryId?: number;
}): Promise<{ conflicts: ConflictDetail[]; suggestions: AlternativeSuggestion[] }> {
  const conflicts: ConflictDetail[] = [];
  const startMin = timeToMinutes(p.startTime.slice(0, 8));
  const endMin = endMinutes(startMin, p.durationSlots);

  if (p.dayOfWeek < 1 || p.dayOfWeek > 6) {
    conflicts.push({ code: "INVALID_DAY", message: "Day must be Monday–Saturday." });
    return { conflicts, suggestions: [] };
  }
  const validStarts = validStartsForDurationSlots(p.durationSlots);
  if (!validStarts.includes(startMin)) {
    conflicts.push({
      code: "DURATION",
      message: `Start time must allow ${p.durationSlots} consecutive hour(s) within 08:00–18:00.`,
    });
  }

  const [roomRows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [p.roomId]);
  const room = (roomRows as RoomRow[])[0];
  if (!room) {
    conflicts.push({ code: "ROOM", message: "Room not found." });
    return { conflicts, suggestions: await buildTimetableSuggestions(pool, p, undefined) };
  }
  if (!roomTypeMatchesEntry(p.entryType, room.room_type)) {
    conflicts.push({
      code: "ROOM",
      message: `Lab sessions should prefer lab/multipurpose rooms; ${room.name} is ${room.room_type}.`,
    });
  }

  for (const r of await fetchTimetableForRoomDay(pool, p.roomId, p.dayOfWeek, p.excludeEntryId)) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
      conflicts.push({
        code: "ROOM",
        message: `Room ${room.name} is already booked for another class at this time (${dayLabel(p.dayOfWeek)}).`,
      });
      break;
    }
  }
  for (const r of await fetchTimetableForFacultyDay(pool, p.facultyUserId, p.dayOfWeek, p.excludeEntryId)) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
      conflicts.push({
        code: "FACULTY",
        message: "This faculty member already has another class at this time.",
      });
      break;
    }
  }
  for (const r of await fetchTimetableForDivisionDay(pool, p.divisionId, p.dayOfWeek, p.excludeEntryId)) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
      conflicts.push({
        code: "DIVISION",
        message: "This class division already has another subject at this time.",
      });
      break;
    }
  }

  const suggestions =
    conflicts.length > 0 || validStarts.includes(startMin) === false
      ? await buildTimetableSuggestions(pool, p, room)
      : [];

  return { conflicts, suggestions };
}

async function buildTimetableSuggestions(
  pool: Pool,
  p: {
    roomId: number;
    facultyUserId: number;
    divisionId: number;
    dayOfWeek: number;
    startTime: string;
    durationSlots: number;
    entryType: "lecture" | "lab";
    excludeEntryId?: number;
  },
  primaryRoom: RoomRow | undefined
): Promise<AlternativeSuggestion[]> {
  const allRooms = await loadRooms(pool);
  const orderedRooms: RoomRow[] = [];
  if (primaryRoom) orderedRooms.push(primaryRoom);
  for (const r of allRooms) {
    if (primaryRoom && r.id === primaryRoom.id) continue;
    if (roomTypeMatchesEntry(p.entryType, r.room_type)) orderedRooms.push(r);
  }
  if (orderedRooms.length === 0) {
    for (const r of allRooms) {
      if (roomTypeMatchesEntry(p.entryType, r.room_type)) orderedRooms.push(r);
    }
  }
  const dayOrder: number[] = [];
  for (let d = 1; d <= 6; d++) dayOrder.push(d);
  const pivot = dayOrder.indexOf(p.dayOfWeek);
  if (pivot >= 0) {
    const reordered = [p.dayOfWeek, ...dayOrder.filter((x) => x !== p.dayOfWeek)];
    dayOrder.splice(0, dayOrder.length, ...reordered);
  }

  const starts = validStartsForDurationSlots(p.durationSlots);
  const out: AlternativeSuggestion[] = [];

  for (const room of orderedRooms) {
    for (const day of dayOrder) {
      for (const startMin of starts) {
        const endMin = endMinutes(startMin, p.durationSlots);
        if (endMin > WORK_END_MIN || startMin < WORK_START_MIN) continue;
        const ok = await isSlotFreeForTimetable(pool, {
          roomId: room.id,
          dayOfWeek: day,
          startMin,
          endMin,
          facultyUserId: p.facultyUserId,
          divisionId: p.divisionId,
          excludeTimetableEntryId: p.excludeEntryId,
        });
        if (!ok) continue;
        if (room.id === p.roomId && day === p.dayOfWeek && startMin === timeToMinutes(p.startTime.slice(0, 8))) {
          continue;
        }
        out.push({
          roomId: room.id,
          roomName: room.name,
          roomType: room.room_type,
          dayOfWeek: day,
          dayLabel: dayLabel(day),
          startTime: minutesToTime(startMin),
          endTime: minutesToTime(endMin),
          reason: `No overlap on ${dayLabel(day)} for room, faculty, or division; ${room.name} fits ${p.entryType} needs.`,
        });
        if (out.length >= 3) return out;
      }
    }
  }
  return out;
}

export async function analyzeBookingProposal(pool: Pool, p: {
  roomId: number;
  eventDate: string;
  startTime: string;
  durationHours: number;
  excludeBookingId?: number;
  minCapacity?: number;
  roomTypePreference?: string;
}): Promise<{ conflicts: ConflictDetail[]; suggestions: AlternativeSuggestion[] }> {
  const conflicts: ConflictDetail[] = [];
  const startMin = timeToMinutes(p.startTime.slice(0, 8));
  const durationMin = bookingDurationToMinutes(p.durationHours);
  const endMin = startMin + durationMin;

  const [roomRows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [p.roomId]);
  const room = (roomRows as RoomRow[])[0];
  if (!room) {
    conflicts.push({ code: "ROOM", message: "Room not found." });
    return { conflicts, suggestions: [] };
  }

  const minCap = p.minCapacity ?? room.capacity;

  const d = new Date(p.eventDate + "T12:00:00");
  const dow = jsDateToAcademicDayOfWeek(d);
  if (dow == null) {
    conflicts.push({ code: "INVALID_DAY", message: "Events can only be scheduled Monday–Saturday." });
    const core: BookingSuggestCore = {
      durationHours: p.durationHours,
      durationMin,
      excludeBookingId: p.excludeBookingId,
      minCapacity: minCap,
      roomTypePreference: p.roomTypePreference,
      originalRoomId: p.roomId,
      originalStartMin: startMin,
      originalEventDate: p.eventDate,
    };
    const suggestions = await buildBookingSuggestionsAcrossDates(pool, core);
    return { conflicts, suggestions };
  }

  if (startMin < WORK_START_MIN || endMin > WORK_END_MIN) {
    conflicts.push({
      code: "OUTSIDE_HOURS",
      message: "Event must fit within working hours 08:00–18:00.",
    });
  }

  if (p.minCapacity && room.capacity < p.minCapacity) {
    conflicts.push({ code: "ROOM", message: "Room capacity may be insufficient for your event." });
  }

  for (const r of await fetchTimetableForRoomOnCalendarDay(pool, p.roomId, p.eventDate)) {
    const iv = intervalFromTimetableRow(r);
    if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
      conflicts.push({
        code: "EVENT_TIMETABLE",
        message: `Room ${room.name} has a scheduled class at this time on ${dayLabel(dow)}.`,
      });
      break;
    }
  }

  for (const b of await fetchBookingsForRoomOnDate(pool, p.roomId, p.eventDate, p.excludeBookingId)) {
    const iv = intervalFromBookingRow(b);
    if (rangesOverlap(startMin, endMin, iv.start, iv.end)) {
      conflicts.push({
        code: "ROOM",
        message: "Another event booking already uses this room at the selected time.",
      });
      break;
    }
  }

  const suggestions =
    conflicts.length > 0 || endMin > WORK_END_MIN || startMin < WORK_START_MIN
      ? await buildBookingSuggestions(pool, {
          dow,
          eventDate: p.eventDate,
          durationHours: p.durationHours,
          excludeBookingId: p.excludeBookingId,
          minCapacity: minCap,
          roomTypePreference: p.roomTypePreference,
          originalRoomId: p.roomId,
          startMin,
        })
      : [];

  return { conflicts, suggestions };
}

async function buildBookingSuggestions(
  pool: Pool,
  ctx: {
    dow: number;
    eventDate: string;
    durationHours: number;
    excludeBookingId?: number;
    minCapacity: number;
    roomTypePreference?: string;
    originalRoomId: number;
    startMin: number;
  }
): Promise<AlternativeSuggestion[]> {
  const durationMin = bookingDurationToMinutes(ctx.durationHours);
  const core: BookingSuggestCore = {
    durationHours: ctx.durationHours,
    durationMin,
    excludeBookingId: ctx.excludeBookingId,
    minCapacity: ctx.minCapacity,
    roomTypePreference: ctx.roomTypePreference,
    originalRoomId: ctx.originalRoomId,
    originalStartMin: ctx.startMin,
    originalEventDate: ctx.eventDate,
  };

  let out = await collectBookingSuggestionsForDate(pool, core, ctx.eventDate, ctx.dow, 3, true);
  for (let delta = 1; out.length < 3 && delta <= 21; delta++) {
    const nd = addCalendarDaysLocal(ctx.eventDate, delta);
    const ndow = jsDateToAcademicDayOfWeek(new Date(nd + "T12:00:00"));
    if (ndow == null) continue;
    const more = await collectBookingSuggestionsForDate(pool, core, nd, ndow, 3 - out.length, false);
    const seen = new Set(out.map((s) => `${s.eventDate ?? ctx.eventDate}|${s.roomId}|${s.startTime}`));
    for (const s of more) {
      const k = `${s.eventDate ?? nd}|${s.roomId}|${s.startTime}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
      if (out.length >= 3) break;
    }
  }
  return out.slice(0, 3);
}
