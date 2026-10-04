import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { ArrowLeft, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { apiJson, ApiError } from "../../../lib/api";

type Room = { id: number; name: string; room_type: string; capacity: number };
type Suggestion = {
  roomId: number;
  roomName: string;
  dayLabel?: string;
  startTime: string;
  endTime: string;
  reason: string;
  eventDate?: string;
};

const DURATION_MAP: Record<string, number> = {
  "1 Hour": 1,
  "2 Hours": 2,
  "3 Hours": 3,
  "4 Hours": 4,
  "6 Hours": 6,
  "Full Day (8 Hours)": 8,
};

export default function BookingRequestForm() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState({
    eventName: "",
    date: "",
    time: "",
    duration: "",
    roomId: "",
    description: "",
    roomTypePreference: "Lecture Hall",
  });
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflicts, setConflicts] = useState<{ message: string }[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiJson<Room[]>("/rooms").then(setRooms);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.eventName.trim()) e.eventName = "Required";
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Required";
    if (!form.duration) e.duration = "Required";
    if (!form.roomId) e.roomId = "Select a room";
    if (!form.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const tryCreate = async (submitAnyway: boolean) => {
    setBusy(true);
    setConflictOpen(false);
    const durationHours = DURATION_MAP[form.duration];
    if (!durationHours) {
      setErrors({ duration: "Invalid duration" });
      setBusy(false);
      return;
    }
    const room = rooms.find((r) => String(r.id) === form.roomId);
    const body = {
      roomId: Number(form.roomId),
      eventDate: form.date,
      startTime: form.time.length === 5 ? `${form.time}:00` : form.time,
      durationHours,
      eventTitle: form.eventName,
      description: form.description,
      roomTypePreference: form.roomTypePreference,
      minCapacity: room?.capacity ?? 1,
      submitAnyway,
    };
    try {
      await apiJson("/bookings", { method: "POST", body: JSON.stringify(body) });
      setSuccess(true);
      setTimeout(() => navigate("/organiser"), 2400);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const d = err.data as { conflicts?: { message: string }[]; suggestions?: Suggestion[] };
        setConflicts(d.conflicts ?? []);
        setSuggestions(d.suggestions ?? []);
        setConflictOpen(true);
      } else {
        setErrors({ eventName: err instanceof Error ? err.message : "Failed" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    tryCreate(false);
  };

  const applySuggestion = (s: Suggestion) => {
    setForm((f) => ({
      ...f,
      roomId: String(s.roomId),
      time: s.startTime.slice(0, 5),
      date: s.eventDate ?? f.date,
    }));
    setConflictOpen(false);
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="organiser" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="organiser" pageTitle="New Booking Request" />
        <main className="flex-1 overflow-y-auto p-7">
          <button
            onClick={() => navigate("/organiser")}
            className="mb-5 flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Request New Booking</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>
              Conflicts are checked against timetable + existing bookings
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-6 bg-green-50 border border-green-200">
              <CheckCircle2 size={18} color="#16a34a" />
              <p className="text-green-800 font-medium">Submitted for admin approval.</p>
            </div>
          )}

          {conflictOpen && (
            <div className="rounded-xl overflow-hidden mb-6 border border-red-200">
              <div className="flex items-center gap-3 px-5 py-4 bg-red-50">
                <AlertTriangle size={18} color="#dc2626" />
                <div>
                  <p className="font-bold text-red-700">Conflict</p>
                  {conflicts.map((c, i) => (
                    <p key={i} className="text-sm text-red-600">
                      {c.message}
                    </p>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-amber-50 border-t border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} color="#d97706" />
                  <p className="font-bold text-amber-900">Database-suggested alternatives</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="p-3 rounded-xl text-left bg-white border border-green-200 text-sm"
                    >
                      <p className="font-bold">{s.roomName}</p>
                      <p className="text-slate-600">
                        {s.eventDate ? `${s.eventDate} · ` : ""}
                        {s.dayLabel ? `${s.dayLabel} ` : ""}
                        {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                      </p>
                      <p className="text-xs text-green-700 mt-1">{s.reason}</p>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => tryCreate(true)}
                  disabled={busy}
                  className="text-sm font-semibold text-amber-900 underline bg-transparent border-none cursor-pointer"
                >
                  Submit anyway for admin review
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-7 bg-white border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Event name *</label>
                <input
                  value={form.eventName}
                  onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                />
                {errors.eventName && <p className="text-red-500 text-xs mt-1">{errors.eventName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                  {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Start *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                  {errors.time && <p className="text-red-500 text-xs">{errors.time}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Duration *</label>
                <select
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">Select</option>
                  {Object.keys(DURATION_MAP).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.duration && <p className="text-red-500 text-xs">{errors.duration}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Room type hint (for suggestions)</label>
                <select
                  value={form.roomTypePreference}
                  onChange={(e) => setForm({ ...form, roomTypePreference: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Auditorium">Auditorium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Room *</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">Select room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.room_type}, cap {r.capacity})
                    </option>
                  ))}
                </select>
                {errors.roomId && <p className="text-red-500 text-xs">{errors.roomId}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2"
                />
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-60"
              >
                {busy ? "…" : "Submit request"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
