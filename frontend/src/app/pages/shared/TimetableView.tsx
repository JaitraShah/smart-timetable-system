import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, MapPin, User } from "lucide-react";
import { apiJson } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Row = {
  id: number;
  day_of_week: number;
  start_time: string;
  duration_slots: number;
  subject_name: string;
  faculty_name: string;
  room_name: string;
  division_name: string;
  semester_name: string;
  entry_type: string;
};

export default function TimetableView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [semesters, setSemesters] = useState<{ id: number; name: string }[]>([]);
  const [semId, setSemId] = useState<number | "all" | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      setSemId("all");
      return;
    }
    apiJson<{ id: number; name: string }[]>("/semesters")
      .then((s) => {
        setSemesters(s);
        setSemId(s[0]?.id ?? "all");
      })
      .catch(() => setSemId("all"));
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || semId === null) return;
    setLoadErr("");
    setLoading(true);
    const q = isAdmin && semId !== "all" ? `?semesterId=${semId}` : "";
    apiJson<Row[]>(`/timetable${q}`)
      .then(setRows)
      .catch(() => {
        setRows([]);
        setLoadErr("Could not load timetable.");
      })
      .finally(() => setLoading(false));
  }, [user, semId, isAdmin]);

  const subjects = new Set(rows.map((r) => r.subject_name)).size;
  const faculty = new Set(rows.map((r) => r.faculty_name)).size;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9ff" }}>
      <div style={{ background: "#ffffff", borderBottom: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div className="max-w-7xl mx-auto px-7 py-5">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-100">
              <Calendar size={22} color="#6366f1" />
            </div>
            <div className="flex-1">
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f0a2e" }}>My Timetable</h1>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 2 }}>Loaded from the server for your role</p>
            </div>
            {isAdmin && semesters.length > 0 && (
              <select
                value={semId === "all" ? "all" : String(semId)}
                onChange={(e) => setSemId(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">All semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-7 py-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="Slots" value={rows.length} />
          <Stat label="Subjects" value={subjects} />
          <Stat label="Faculty (visible)" value={faculty} />
          <Stat label="Total hours" value={rows.reduce((a, r) => a + r.duration_slots, 0)} />
        </div>

        {loadErr && <p className="text-red-600 text-sm mb-3">{loadErr}</p>}
        {loading && <p className="text-slate-500">Loading…</p>}
        {!loading && rows.length === 0 && <p className="text-slate-500">No timetable data.</p>}

        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-3">Day</th>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Faculty</th>
                <th className="text-left p-3">Room</th>
                <th className="text-left p-3">Division</th>
                <th className="text-left p-3">Semester</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3">{DAYS[r.day_of_week]}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock size={14} />
                      {String(r.start_time).slice(0, 5)} ({r.duration_slots}h)
                    </span>
                  </td>
                  <td className="p-3 font-medium">
                    {r.subject_name}{" "}
                    <span className="text-xs text-slate-400">({r.entry_type})</span>
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {r.faculty_name}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-violet-700 font-medium">
                      <MapPin size={14} />
                      {r.room_name}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{r.division_name}</td>
                  <td className="p-3 text-slate-500 text-xs">{r.semester_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-100">
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
