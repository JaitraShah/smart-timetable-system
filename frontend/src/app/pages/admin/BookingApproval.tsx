import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Check, X, Info, Lightbulb } from "lucide-react";
import { apiJson, ApiError } from "../../../lib/api";

type AltSuggestion = {
  roomId: number;
  roomName: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  reason: string;
  eventDate?: string;
};

type Booking = {
  id: number;
  room_id: number;
  event_title: string;
  organiser_name: string;
  room_name: string;
  event_date: string;
  start_time: string;
  duration_hours: string;
  status: string;
  description: string;
  conflict_summary: string | null;
  suggestions_json: unknown;
};

function parseSuggestions(raw: unknown): AltSuggestion[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as AltSuggestion[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AltSuggestion[];
    } catch {
      return [];
    }
  }
  return [];
}

export default function BookingApproval() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const rows = await apiJson<Booking[]>("/bookings");
    setBookings(rows);
  }, []);

  useEffect(() => {
    load().catch(() => setToast({ msg: "Failed to load", ok: false }));
  }, [load]);

  const act = async (id: number, status: "approved" | "rejected") => {
    await apiJson(`/bookings/${id}/decision`, { method: "PATCH", body: JSON.stringify({ status }) });
    setToast({ msg: `Booking ${status}.`, ok: true });
    load();
    setTimeout(() => setToast(null), 3500);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  };

  const pending = bookings.filter((b) => b.status === "pending");
  const other = bookings.filter((b) => b.status !== "pending");

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Booking Requests" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Booking Requests</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Approve or reject organiser requests</p>
          </div>

          {toast && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl mb-5"
              style={{
                background: toast.ok ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
              }}
            >
              {toast.ok ? <Check size={18} color="#16a34a" /> : <X size={18} color="#dc2626" />}
              <p style={{ color: toast.ok ? "#15803d" : "#b91c1c" }}>{toast.msg}</p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-xl mb-6" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <Info size={16} color="#6366f1" className="shrink-0 mt-0.5" />
            <p style={{ fontSize: "0.82rem", color: "#6366f1", lineHeight: 1.6 }}>
              Conflicts are detected at submission time; organisers may still submit with “submit anyway” for your review.
            </p>
          </div>

          <h2 className="font-bold text-slate-800 mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3 mb-8">
            {pending.map((b) => (
              <Card key={b.id} b={b} onAct={act} onRefresh={load} toast={showToast} />
            ))}
            {pending.length === 0 && <p className="text-slate-500 text-sm">No pending bookings.</p>}
          </div>

          <h2 className="font-bold text-slate-800 mb-3">History</h2>
          <div className="space-y-3">
            {other.map((b) => (
              <div key={b.id} className="rounded-xl p-4 bg-white border border-slate-100 text-sm">
                <p className="font-semibold">{b.event_title}</p>
                <p className="text-slate-500">
                  {b.room_name} · {b.event_date} {String(b.start_time).slice(0, 5)} · {b.status}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({
  b,
  onAct,
  onRefresh,
  toast,
}: {
  b: Booking;
  onAct: (id: number, s: "approved" | "rejected") => void;
  onRefresh: () => void;
  toast: (msg: string, ok: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const suggestions = parseSuggestions(b.suggestions_json);

  const applyAlt = async (s: AltSuggestion, force?: boolean) => {
    const st = s.startTime.length >= 8 ? s.startTime.slice(0, 8) : `${s.startTime.slice(0, 5)}:00`;
    setBusy(true);
    try {
      await apiJson(`/bookings/${b.id}/apply-alternative`, {
        method: "PATCH",
        body: JSON.stringify({
          roomId: s.roomId,
          startTime: st,
          ...(s.eventDate ? { eventDate: s.eventDate } : {}),
          force: force ?? false,
        }),
      });
      toast("Booking approved with new slot.", true);
      onRefresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && !force) {
        toast("That slot still conflicts — use Approve with override or pick another suggestion.", false);
      } else {
        toast(e instanceof Error ? e.message : "Failed", false);
      }
    } finally {
      setBusy(false);
    }
  };

  const forceApproveCurrent = async () => {
    setBusy(true);
    try {
      const st =
        String(b.start_time).length >= 8 ? String(b.start_time).slice(0, 8) : `${String(b.start_time).slice(0, 5)}:00`;
      await apiJson(`/bookings/${b.id}/apply-alternative`, {
        method: "PATCH",
        body: JSON.stringify({
          roomId: b.room_id,
          startTime: st,
          force: true,
          adminNote: "Approved with override (original slot kept despite reported conflicts).",
        }),
      });
      toast("Approved with override.", true);
      onRefresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-slate-100 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">{b.event_title}</p>
          <p className="text-sm text-slate-600 mt-1">{b.description}</p>
          <p className="text-sm text-slate-500 mt-2">
            {b.organiser_name} · {b.room_name} · {b.event_date} {String(b.start_time).slice(0, 5)} (
            {b.duration_hours}h)
          </p>
          {b.conflict_summary && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">Note: {b.conflict_summary}</p>
          )}
          {suggestions.length > 0 && (
            <div className="mt-4 rounded-xl p-3" style={{ background: "#fffdf7", border: "1px solid #fde68a" }}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} color="#d97706" />
                <p className="text-xs font-bold text-amber-900">Suggested alternatives (from DB)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={busy}
                    onClick={() => applyAlt(s)}
                    className="text-left p-2.5 rounded-lg text-xs border border-green-200 bg-white hover:bg-green-50 disabled:opacity-50"
                  >
                    <p className="font-bold text-slate-800">{s.roomName}</p>
                    <p className="text-slate-600">
                      {s.eventDate ? `${s.eventDate} · ` : ""}
                      {s.dayLabel} {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                    </p>
                    <p className="text-green-700 mt-1">{s.reason}</p>
                    <p className="text-green-600 font-semibold mt-1">Apply &amp; approve</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {(b.conflict_summary || suggestions.length > 0) && (
            <button
              type="button"
              disabled={busy}
              onClick={forceApproveCurrent}
              className="mt-3 text-xs font-semibold text-amber-900 underline disabled:opacity-50"
            >
              Approve original slot anyway (admin override)
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => onAct(b.id, "approved")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Check size={14} /> Approve as-is
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onAct(b.id, "rejected")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50"
          >
            <X size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
