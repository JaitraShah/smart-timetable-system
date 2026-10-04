import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Clock, MapPin } from "lucide-react";
import { apiJson } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_OPTIONS = [
  { v: "", label: "No preference" },
  { v: "1", label: "Monday" },
  { v: "2", label: "Tuesday" },
  { v: "3", label: "Wednesday" },
  { v: "4", label: "Thursday" },
  { v: "5", label: "Friday" },
  { v: "6", label: "Saturday" },
];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [next, setNext] = useState<{ day_of_week: number; start_time: string; subject_name: string; room_name: string }[]>(
    []
  );
  const [notes, setNotes] = useState<{ id: number; title: string; body: string; created_at: string }[]>([]);
  const [pendingReq, setPendingReq] = useState(0);
  const [myRequests, setMyRequests] = useState<
    { id: number; reason: string; status: string; created_at: string; admin_response: string | null }[]
  >([]);
  const [reason, setReason] = useState("");
  const [subjectHint, setSubjectHint] = useState("");
  const [preferredDay, setPreferredDay] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiJson<{
      nextClasses: typeof next;
      notifications: typeof notes;
      pendingRequests: number;
    }>("/dashboard/faculty")
      .then((d) => {
        setNext(d.nextClasses);
        setNotes(d.notifications);
        setPendingReq(d.pendingRequests);
      })
      .catch(() => {});
    apiJson<typeof myRequests>("/requests/timetable-change")
      .then(setMyRequests)
      .catch(() => setMyRequests([]));
  }, []);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const pt =
      preferredTime.length === 5 ? `${preferredTime}:00` : preferredTime ? preferredTime.slice(0, 8) : undefined;
    await apiJson("/requests/timetable-change", {
      method: "POST",
      body: JSON.stringify({
        reason,
        subjectHint: subjectHint || undefined,
        preferredDay: preferredDay ? Number(preferredDay) : undefined,
        preferredStartTime: pt,
      }),
    });
    setMsg("Request submitted.");
    setReason("");
    setSubjectHint("");
    setPreferredDay("");
    setPreferredTime("");
    apiJson<typeof myRequests>("/requests/timetable-change")
      .then(setMyRequests)
      .catch(() => {});
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="faculty" pageTitle="Dashboard" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Faculty Dashboard</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>
              Welcome, {user?.fullName}. Pending requests you opened: {pendingReq}
            </p>
          </div>

          <div className="rounded-2xl p-6 mb-5 bg-white border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-4">Upcoming classes (from timetable)</h2>
            <div className="space-y-3">
              {next.map((c, i) => (
                <div key={i} className="p-4 rounded-xl bg-cyan-50 border-l-4 border-cyan-500">
                  <p className="font-semibold text-slate-900">{c.subject_name}</p>
                  <p className="text-sm text-slate-600 flex gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {DAYS[c.day_of_week]} {String(c.start_time).slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {c.room_name}
                    </span>
                  </p>
                </div>
              ))}
              {next.length === 0 && <p className="text-slate-500 text-sm">No entries assigned to you yet.</p>}
            </div>
          </div>

          {myRequests.length > 0 && (
            <div className="rounded-2xl p-6 mb-5 bg-white border border-slate-100">
              <h2 className="font-bold text-slate-900 mb-3">Your requests</h2>
              <div className="space-y-2 text-sm">
                {myRequests.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 pb-2">
                    <span className="text-slate-700 line-clamp-2">{r.reason}</span>
                    <span
                      className={`shrink-0 font-semibold ${
                        r.status === "pending" ? "text-amber-600" : r.status === "rejected" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-6 mb-5 bg-white border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-3">Timetable change request</h2>
            <p className="text-sm text-slate-500 mb-4">You cannot edit the master timetable; submit a request for admin.</p>
            {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}
            <form onSubmit={submitRequest} className="space-y-3 max-w-xl">
              <input
                placeholder="Subject hint (optional — match subject name for admin suggestions)"
                value={subjectHint}
                onChange={(e) => setSubjectHint(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred day</label>
                  <select
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  >
                    {DAY_OPTIONS.map((o) => (
                      <option key={o.v || "x"} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred start (optional)</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <textarea
                required
                placeholder="Describe the issue / preferred change"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold">
                Submit request
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-3">Notifications</h2>
            {notes.map((n) => (
              <div key={n.id} className="py-2 border-b border-slate-100 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-slate-600">{n.body}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-slate-500 text-sm">No notifications.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
