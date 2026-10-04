import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import {
  Calendar,
  DoorOpen,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  Lightbulb,
  Users,
  BookOpen,
} from "lucide-react";
import { apiJson } from "../../../lib/api";

type AdminDash = {
  stats: {
    timetableEntries: number;
    rooms: number;
    bookings: number;
    conflictRelatedActions: number;
    users: number;
    subjects: number;
  };
  pendingBookings: {
    id: number;
    event_title: string;
    organiser_name: string;
    room_name: string;
    event_date: string;
    start_time: string;
  }[];
  pendingRegistrations: { id: number; email: string; full_name: string; role_name: string }[];
  pendingFacultyRequests: {
    id: number;
    reason: string;
    created_at: string;
    subject_hint: string | null;
    preferred_day: number | null;
    preferred_start_time: string | null;
  }[];
  recentActivity: {
    action: string;
    created_at: string;
    full_name: string | null;
  }[];
};

function formatDt(date: string, time: string) {
  const t = String(time).slice(0, 5);
  return `${date} · ${t}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDash | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [facultySug, setFacultySug] = useState<
    Record<
      number,
      | "loading"
      | {
          ok: boolean;
          basedOnEntryId?: number;
          message?: string;
          conflicts: { message: string }[];
          suggestions: {
            roomName: string;
            dayLabel: string;
            startTime: string;
            endTime: string;
            reason: string;
            roomId: number;
            dayOfWeek: number;
          }[];
        }
    >
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await apiJson<AdminDash>("/dashboard/admin");
      setData(d);
    } catch {
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, status: "approved" | "rejected") => {
    try {
      await apiJson(`/bookings/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setActionMsg(`Booking #${id} ${status}.`);
      setTimeout(() => setActionMsg(""), 3500);
      load();
    } catch {
      setActionMsg("Action failed.");
    }
  };

  const approveUser = async (id: number) => {
    try {
      await apiJson(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ registrationStatus: "active" }),
      });
      load();
    } catch {
      setActionMsg("Could not approve user.");
    }
  };

  const resolveFacultyRequest = async (id: number, status: "resolved" | "rejected") => {
    try {
      await apiJson(`/requests/timetable-change/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminResponse: "Reviewed from admin dashboard." }),
      });
      setFacultySug((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
      load();
    } catch {
      setActionMsg("Could not update request.");
    }
  };

  const loadFacultySuggestions = async (id: number) => {
    setFacultySug((s) => ({ ...s, [id]: "loading" }));
    try {
      const data = await apiJson<{
        ok: boolean;
        basedOnEntryId?: number;
        message?: string;
        conflicts: { message: string }[];
        suggestions: {
          roomName: string;
          dayLabel: string;
          startTime: string;
          endTime: string;
          reason: string;
          roomId: number;
          dayOfWeek: number;
        }[];
      }>(`/requests/timetable-change/${id}/suggestions`);
      setFacultySug((s) => ({ ...s, [id]: data }));
    } catch {
      setActionMsg("Could not load timetable suggestions.");
      setFacultySug((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  };

  const stats = data
    ? [
        { label: "Timetable entries", value: String(data.stats.timetableEntries), icon: Calendar, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
        { label: "Rooms", value: String(data.stats.rooms), icon: DoorOpen, color: "#0891b2", bg: "rgba(8,145,178,0.08)" },
        { label: "Bookings (all)", value: String(data.stats.bookings), icon: FileCheck, color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
        {
          label: "Conflict-related logs",
          value: String(data.stats.conflictRelatedActions),
          icon: AlertTriangle,
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.08)",
        },
        { label: "Users", value: String(data.stats.users ?? 0), icon: Users, color: "#0ea5e9", bg: "rgba(14,165,233,0.08)" },
        { label: "Subjects", value: String(data.stats.subjects ?? 0), icon: BookOpen, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
      ]
    : [];

  const pending = data?.pendingBookings ?? [];
  const activityDot: Record<string, string> = { success: "#22c55e", warning: "#f59e0b", info: "#6366f1" };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar userName="" role="admin" pageTitle="Dashboard" />

        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e", letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>
              System overview from the database (live).
            </p>
          </div>

          {loading && <p style={{ color: "#64748b" }}>Loading…</p>}
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}

          {actionMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl mb-5" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <Check size={16} color="#16a34a" />
              <p style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500 }}>{actionMsg}</p>
            </div>
          )}

          {!loading && data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl p-5 transition-all duration-200"
                      style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: stat.bg }}>
                        <Icon size={21} color={stat.color} />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{stat.label}</p>
                      <p style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f0a2e", lineHeight: 1 }}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e", marginBottom: "1.25rem" }}>Recent Activity</h2>
                  <div>
                    {data.recentActivity.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No activity yet.</p>}
                    {data.recentActivity.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-3"
                        style={{ borderBottom: i < data.recentActivity.length - 1 ? "1px solid #f8f9ff" : "none" }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: activityDot.info, marginTop: 6, flexShrink: 0 }} />
                        <div className="flex-1">
                          <p style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: 500 }}>{item.action}</p>
                          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>
                            {item.full_name ?? "System"} · {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-6" style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e", marginBottom: "1.25rem" }}>Quick Actions</h2>
                  <div className="space-y-3">
                    <ActionBtn primary onClick={() => navigate("/admin/timetable")}>
                      <Calendar size={16} /> Timetable Management
                    </ActionBtn>
                    <ActionBtn onClick={() => navigate("/admin/rooms")}>
                      <DoorOpen size={16} /> Manage Rooms
                    </ActionBtn>
                    <ActionBtn onClick={() => navigate("/admin/bookings")}>
                      <FileCheck size={16} /> Review Bookings
                    </ActionBtn>
                    <ActionBtn onClick={() => navigate("/admin/upload")}>
                      <ArrowRight size={16} /> Upload Data
                    </ActionBtn>
                  </div>
                </div>
              </div>

              {data.pendingRegistrations.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#ffffff", border: "1px solid #f1f5f9" }}>
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid #f8f9ff" }}>
                    <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e" }}>Pending registrations</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {data.pendingRegistrations.map((u) => (
                      <div key={u.id} className="px-6 py-3 flex justify-between items-center">
                        <div>
                          <p style={{ fontWeight: 600, color: "#1e293b" }}>{u.full_name}</p>
                          <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                            {u.email} · {u.role_name}
                          </p>
                        </div>
                        <button
                          onClick={() => approveUser(u.id)}
                          className="px-3 py-1.5 rounded-lg text-white text-sm font-semibold"
                          style={{ background: "#16a34a", border: "none", cursor: "pointer" }}
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.pendingFacultyRequests.length > 0 && (
                <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#ffffff", border: "1px solid #f1f5f9" }}>
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e" }}>Faculty timetable requests</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {data.pendingFacultyRequests.map((r) => {
                      const sug = facultySug[r.id];
                      const pd = Number(r.preferred_day);
                      const prefDay = pd >= 1 && pd <= 6 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][pd - 1] : null;
                      return (
                        <div key={r.id} className="px-6 py-4 border-b border-slate-50 last:border-0">
                          <div className="flex flex-wrap gap-3 justify-between items-start">
                            <div className="max-w-xl space-y-1">
                              <p className="text-sm text-slate-700">{r.reason}</p>
                              <p className="text-xs text-slate-500">
                                {r.subject_hint && <>Hint: {r.subject_hint} · </>}
                                {prefDay && <>Pref: {prefDay}</>}
                                {r.preferred_start_time && (
                                  <> {String(r.preferred_start_time).slice(0, 5)}</>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => loadFacultySuggestions(r.id)}
                                className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold flex items-center gap-1"
                              >
                                <Lightbulb size={12} /> DB suggestions
                              </button>
                              <button
                                type="button"
                                onClick={() => resolveFacultyRequest(r.id, "resolved")}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold"
                              >
                                Resolve
                              </button>
                              <button
                                type="button"
                                onClick={() => resolveFacultyRequest(r.id, "rejected")}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          {sug === "loading" && (
                            <p className="text-xs text-slate-500 mt-3">Loading alternatives from timetable data…</p>
                          )}
                          {sug && sug !== "loading" && !sug.ok && (
                            <p className="text-xs text-amber-800 mt-3 bg-amber-50 p-2 rounded-lg">{sug.message}</p>
                          )}
                          {sug && sug !== "loading" && sug.ok && (
                            <div className="mt-3 rounded-xl p-3 bg-slate-50 border border-slate-100 text-xs">
                              {sug.basedOnEntryId != null && (
                                <p className="text-slate-600 mb-2 font-medium">
                                  Based on timetable entry #{sug.basedOnEntryId} — apply changes in Timetable Management.
                                </p>
                              )}
                              {sug.conflicts.length > 0 && (
                                <p className="text-red-600 mb-2">
                                  {sug.conflicts.map((c, i) => (
                                    <span key={i}>
                                      {c.message}
                                      {i < sug.conflicts.length - 1 ? " · " : ""}
                                    </span>
                                  ))}
                                </p>
                              )}
                              {sug.suggestions.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {sug.suggestions.map((s, i) => (
                                    <div
                                      key={i}
                                      className="p-2 rounded-lg bg-white border border-green-100 text-slate-800"
                                    >
                                      <p className="font-bold">{s.roomName}</p>
                                      <p className="text-slate-600">
                                        {s.dayLabel} {String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}
                                      </p>
                                      <p className="text-green-700 mt-1">{s.reason}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {sug.suggestions.length === 0 && sug.conflicts.length === 0 && (
                                <p className="text-slate-600">
                                  No conflicts for the proposed slot — verify in Timetable Management if a change is still
                                  needed.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f8f9ff" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e" }}>Pending Booking Requests</h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs"
                      style={{
                        background: "rgba(217,119,6,0.08)",
                        color: "#d97706",
                        border: "1px solid rgba(217,119,6,0.2)",
                        fontWeight: 600,
                      }}
                    >
                      {pending.length} Pending
                    </span>
                    <button
                      onClick={() => navigate("/admin/bookings")}
                      className="flex items-center gap-1 transition-all duration-150"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", color: "#6366f1", fontWeight: 600 }}
                    >
                      View all <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
                {pending.length === 0 ? (
                  <div className="py-10 text-center">
                    <Check size={28} color="#22c55e" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>No pending booking requests</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: "#f8f9ff" }}>
                          {["Event", "Organiser", "Room", "Date & Time", "Actions"].map((h) => (
                            <th
                              key={h}
                              className="text-left py-3 px-5"
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "#94a3b8",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((row, i) => (
                          <tr key={row.id} style={{ borderBottom: i < pending.length - 1 ? "1px solid #f8f9ff" : "none" }}>
                            <td className="py-3.5 px-5" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                              {row.event_title}
                            </td>
                            <td className="py-3.5 px-5" style={{ fontSize: "0.875rem", color: "#64748b" }}>
                              {row.organiser_name}
                            </td>
                            <td className="py-3.5 px-5" style={{ fontSize: "0.875rem", color: "#64748b" }}>
                              {row.room_name}
                            </td>
                            <td className="py-3.5 px-5" style={{ fontSize: "0.875rem", color: "#64748b" }}>
                              {formatDt(row.event_date, row.start_time)}
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => act(row.id, "approved")}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white transition-all duration-150"
                                  style={{ background: "#16a34a", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                                >
                                  <Check size={12} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => act(row.id, "rejected")}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-150"
                                  style={{
                                    background: "rgba(220,38,38,0.07)",
                                    border: "1px solid rgba(220,38,38,0.2)",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#dc2626",
                                  }}
                                >
                                  <X size={12} />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  return primary ? (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-white transition-all duration-150"
      style={{
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.875rem",
        boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
        textAlign: "left" as const,
      }}
    >
      {children}
    </button>
  ) : (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-150"
      style={{
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "#475569",
        textAlign: "left" as const,
      }}
    >
      {children}
    </button>
  );
}
