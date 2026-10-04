import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { apiJson } from "../../../lib/api";

export default function Reports() {
  const [stats, setStats] = useState<{
    timetableEntries: number;
    rooms: number;
    bookings: number;
    conflictRelatedActions: number;
    users: number;
    subjects: number;
  } | null>(null);

  useEffect(() => {
    apiJson<{ stats: typeof stats }>("/dashboard/admin").then((d) => setStats(d.stats));
  }, []);

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Reports" />
        <main className="flex-1 overflow-y-auto p-7">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">System reports</h1>
          <p className="text-slate-500 mb-8">Metrics are computed from the database.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats &&
              [
                ["Timetable entries", stats.timetableEntries],
                ["Rooms", stats.rooms],
                ["Bookings", stats.bookings],
                ["Conflict-related log rows", stats.conflictRelatedActions],
                ["Users", stats.users ?? 0],
                ["Subjects", stats.subjects ?? 0],
              ].map(([label, val]) => (
                <div key={String(label)} className="rounded-2xl p-6 bg-white border border-slate-100">
                  <p className="text-slate-500 text-sm mb-2">{label}</p>
                  <p className="text-3xl font-extrabold text-violet-600">{val}</p>
                </div>
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}
