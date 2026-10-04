import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { StatusBadge } from "../../components/StatusBadge";
import { Plus } from "lucide-react";
import { apiJson } from "../../../lib/api";

type Booking = {
  id: number;
  event_title: string;
  event_date: string;
  start_time: string;
  duration_hours: string;
  room_name: string;
  status: string;
};

export default function EventOrganiserDashboard() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  useEffect(() => {
    apiJson<{ upcoming: Booking[]; past: Booking[]; pendingCount: number; approvedCount: number }>(
      "/dashboard/organiser"
    )
      .then((d) => {
        setUpcoming(d.upcoming);
        setPast(d.past);
        setPendingCount(d.pendingCount);
        setApprovedCount(d.approvedCount);
      })
      .catch(() => {});
  }, []);

  const total = upcoming.length + past.length;

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="organiser" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="organiser" pageTitle="Dashboard" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Event Organiser Dashboard</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Your booking requests from the database</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="All bookings" value={total} color="#6366f1" />
            <Stat label="Pending" value={pendingCount} color="#d97706" />
            <Stat label="Approved" value={approvedCount} color="#16a34a" />
            <Stat label="Past rows" value={past.length} color="#64748b" />
          </div>

          <div
            className="rounded-2xl p-7 mb-6 flex items-center justify-between gap-6 flex-wrap"
            style={{
              background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.28)",
            }}
          >
            <div>
              <h2 style={{ fontWeight: 700, color: "#ffffff", fontSize: "1.15rem", marginBottom: 6 }}>Book a room</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
                Conflict check uses real timetable + bookings.
              </p>
            </div>
            <button
              onClick={() => navigate("/organiser/booking-request")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
              style={{ background: "#fff", color: "#6366f1", border: "none", cursor: "pointer" }}
            >
              <Plus size={18} /> New booking
            </button>
          </div>

          <h2 className="font-bold text-slate-900 mb-3">Upcoming</h2>
          <div className="space-y-3 mb-8">
            {upcoming.map((b) => (
              <Row key={b.id} b={b} />
            ))}
            {upcoming.length === 0 && <p className="text-slate-500 text-sm">No upcoming bookings.</p>}
          </div>

          <h2 className="font-bold text-slate-900 mb-3">Past</h2>
          <div className="space-y-3">
            {past.map((b) => (
              <Row key={b.id} b={b} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-slate-100">
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{value}</p>
    </div>
  );
}

function Row({ b }: { b: Booking }) {
  return (
    <div className="rounded-xl p-4 bg-white border border-slate-100 flex justify-between flex-wrap gap-2">
      <div>
        <p className="font-semibold">{b.event_title}</p>
        <p className="text-sm text-slate-500">
          {b.room_name} · {b.event_date} {String(b.start_time).slice(0, 5)} ({b.duration_hours}h)
        </p>
      </div>
      <StatusBadge status={b.status as "pending" | "approved" | "rejected"} />
    </div>
  );
}
