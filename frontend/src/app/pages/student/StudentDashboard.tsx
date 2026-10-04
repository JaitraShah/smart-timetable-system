import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { apiJson } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<
    { day_of_week: number; start_time: string; subject_name: string; room_name: string; faculty_name: string }[]
  >([]);
  const [notes, setNotes] = useState<{ id: number; title: string; body: string }[]>([]);

  useEffect(() => {
    apiJson<{ upcomingClasses: typeof classes; notifications: typeof notes }>("/dashboard/student")
      .then((d) => {
        setClasses(d.upcomingClasses);
        setNotes(d.notifications);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="student" pageTitle="Dashboard" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Student Dashboard</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Hello, {user?.fullName}</p>
          </div>

          <div className="rounded-2xl p-6 mb-5 bg-white border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Calendar className="text-violet-600" size={20} />
              </div>
              <h2 className="font-bold text-slate-900">Your class timetable (division)</h2>
            </div>
            <div className="space-y-3">
              {classes.map((c, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100">
                  <p className="font-semibold">{c.subject_name}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {c.faculty_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {DAYS[c.day_of_week]} {String(c.start_time).slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {c.room_name}
                    </span>
                  </div>
                </div>
              ))}
              {classes.length === 0 && <p className="text-slate-500 text-sm">No timetable rows for your division.</p>}
            </div>
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
