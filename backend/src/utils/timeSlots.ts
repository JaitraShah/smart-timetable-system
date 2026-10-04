/**
 * Academic working hours: Mon–Sat, 08:00–18:00.
 * Slots are 1-hour blocks; 2-hour activities use two consecutive blocks.
 */

export const WORK_START_MIN = 8 * 60;
export const WORK_END_MIN = 18 * 60;

/** Monday = 1 … Saturday = 6 (project convention). Sunday = 0 is not a working day. */
export function jsDateToAcademicDayOfWeek(d: Date): number | null {
  const js = d.getDay(); // 0 Sun .. 6 Sat
  if (js === 0) return null;
  if (js >= 1 && js <= 6) return js;
  return null;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

/** Valid start minutes for 1-hour slots (08:00 … 17:00). */
export function oneHourSlotStarts(): number[] {
  const out: number[] = [];
  for (let m = WORK_START_MIN; m < WORK_END_MIN; m += 60) out.push(m);
  return out;
}

/** Valid start minutes for N consecutive hour slots within the working day. */
export function validStartsForDurationSlots(durationSlots: number): number[] {
  const durationMin = durationSlots * 60;
  const out: number[] = [];
  for (let start = WORK_START_MIN; start + durationMin <= WORK_END_MIN; start += 60) {
    out.push(start);
  }
  return out;
}

export function endMinutes(startMin: number, durationSlots: number): number {
  return startMin + durationSlots * 60;
}

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function bookingDurationToMinutes(durationHours: number): number {
  return Math.round(durationHours * 60);
}
