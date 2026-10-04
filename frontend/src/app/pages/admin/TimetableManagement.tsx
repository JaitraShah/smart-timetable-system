import { Fragment, useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Plus, X, AlertTriangle, CheckCircle2, Lightbulb, RefreshCw, Trash2 } from "lucide-react";
import { apiJson, ApiError } from "../../../lib/api";

const DAYS: { v: number; label: string }[] = [
  { v: 1, label: "Monday" },
  { v: 2, label: "Tuesday" },
  { v: 3, label: "Wednesday" },
  { v: 4, label: "Thursday" },
  { v: 5, label: "Friday" },
  { v: 6, label: "Saturday" },
];

const TIME_OPTIONS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const COLORS = [
  { color: "#6366f1", bg: "rgba(99,102,241,0.07)" },
  { color: "#0891b2", bg: "rgba(8,145,178,0.07)" },
  { color: "#a855f7", bg: "rgba(168,85,247,0.07)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.07)" },
  { color: "#16a34a", bg: "rgba(22,163,74,0.07)" },
  { color: "#7c3aed", bg: "rgba(124,58,237,0.07)" },
];

type Entry = {
  id: number;
  semester_id: number;
  room_id: number;
  faculty_user_id: number;
  division_id: number;
  day_of_week: number;
  start_time: string;
  duration_slots: number;
  subject_name: string;
  faculty_name: string;
  room_name: string;
  division_name: string;
  semester_name: string;
  entry_type: "lecture" | "lab";
  review_status: string;
};

type Suggestion = {
  roomId: number;
  roomName: string;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export default function TimetableManagement() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [semesters, setSemesters] = useState<{ id: number; name: string }[]>([]);
  const [semesterId, setSemesterId] = useState<number>(1);
  const [subjects, setSubjects] = useState<{ id: number; name: string; code: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: number; name: string; room_type: string }[]>([]);
  const [faculty, setFaculty] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [divisions, setDivisions] = useState<{ id: number; name: string; code: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflicts, setConflicts] = useState<{ code: string; message: string }[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [genBusy, setGenBusy] = useState(false);
  const [reviewOpenId, setReviewOpenId] = useState<number | null>(null);
  const [reviewSuggestions, setReviewSuggestions] = useState<Suggestion[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewConflicts, setReviewConflicts] = useState<{ message: string }[]>([]);

  const [form, setForm] = useState({
    subjectId: "",
    facultyUserId: "",
    roomId: "",
    divisionId: "",
    dayOfWeek: "",
    startTime: "",
    durationSlots: "1",
    entryType: "lecture" as "lecture" | "lab",
  });

  const loadMeta = useCallback(async () => {
    const [sem, sub, rm, fac, div] = await Promise.all([
      apiJson<{ id: number; name: string }[]>("/semesters"),
      apiJson<{ id: number; name: string; code: string }[]>("/subjects"),
      apiJson<{ id: number; name: string; room_type: string }[]>("/rooms"),
      apiJson<{ id: number; full_name: string; email: string }[]>("/users/faculty"),
      apiJson<{ id: number; name: string; code: string }[]>("/divisions"),
    ]);
    setSemesters(sem);
    setSubjects(sub);
    setRooms(rm);
    setFaculty(fac);
    setDivisions(div);
  }, []);

  const loadEntries = useCallback(async () => {
    const q = semesterId ? `?semesterId=${semesterId}` : "";
    const rows = await apiJson<Entry[]>(`/timetable${q}`);
    setEntries(rows);
  }, [semesterId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await loadMeta();
      await loadEntries();
    } catch {
      setErrorMsg("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [loadMeta, loadEntries]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setConflictOpen(false);
    setConflicts([]);
    setSuggestions([]);
    setErrorMsg("");
    const body = {
      semesterId,
      subjectId: Number(form.subjectId),
      facultyUserId: Number(form.facultyUserId),
      roomId: Number(form.roomId),
      divisionId: Number(form.divisionId),
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
      durationSlots: Number(form.durationSlots),
      entryType: form.entryType,
    };
    try {
      await apiJson("/timetable", { method: "POST", body: JSON.stringify(body) });
      setSuccessMsg("Timetable entry added.");
      setShowForm(false);
      setForm({
        subjectId: "",
        facultyUserId: "",
        roomId: "",
        divisionId: "",
        dayOfWeek: "",
        startTime: "",
        durationSlots: "1",
        entryType: "lecture",
      });
      loadEntries();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const d = e.data as { conflicts?: typeof conflicts; suggestions?: Suggestion[] };
        setConflicts(d.conflicts ?? []);
        setSuggestions(d.suggestions ?? []);
        setConflictOpen(true);
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
    }
  };

  const submitAnyway = async () => {
    const body = {
      semesterId,
      subjectId: Number(form.subjectId),
      facultyUserId: Number(form.facultyUserId),
      roomId: Number(form.roomId),
      divisionId: Number(form.divisionId),
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
      durationSlots: Number(form.durationSlots),
      entryType: form.entryType,
      submitAnyway: true,
    };
    try {
      await apiJson("/timetable", { method: "POST", body: JSON.stringify(body) });
      setSuccessMsg("Entry saved for admin review.");
      setConflictOpen(false);
      setShowForm(false);
      loadEntries();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed");
    }
  };

  const applySuggestion = (s: Suggestion) => {
    setForm((f) => ({
      ...f,
      roomId: String(s.roomId),
      dayOfWeek: String(s.dayOfWeek),
      startTime: s.startTime.slice(0, 5),
    }));
    setConflictOpen(false);
  };

  const runGenerate = async () => {
    const divId = Number(prompt("Division ID to generate for (see divisions table, e.g. 1):", "1"));
    if (!divId) return;
    setGenBusy(true);
    try {
      const r = await apiJson<{ created: number; skipped: { subjectId: number; reason: string }[] }>(
        "/timetable/generate",
        { method: "POST", body: JSON.stringify({ semesterId, divisionId: divId }) }
      );
      setSuccessMsg(`Generated ${r.created} entries. Skipped ${r.skipped.length}.`);
      loadEntries();
    } catch {
      setErrorMsg("Generation failed");
    } finally {
      setGenBusy(false);
    }
  };

  const removeEntry = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await apiJson(`/timetable/${id}`, { method: "DELETE" });
      loadEntries();
    } catch {
      setErrorMsg("Delete failed");
    }
  };

  const loadReviewSuggestions = async (e: Entry) => {
    setReviewOpenId(e.id);
    setReviewLoading(true);
    setReviewSuggestions([]);
    setReviewConflicts([]);
    const st = String(e.start_time).length === 5 ? `${e.start_time}:00` : String(e.start_time).slice(0, 8);
    try {
      const r = await apiJson<{ conflicts: { message: string }[]; suggestions: Suggestion[]; ok: boolean }>(
        "/timetable/check",
        {
          method: "POST",
          body: JSON.stringify({
            roomId: e.room_id,
            facultyUserId: e.faculty_user_id,
            divisionId: e.division_id,
            dayOfWeek: e.day_of_week,
            startTime: st,
            durationSlots: e.duration_slots,
            entryType: e.entry_type,
            excludeEntryId: e.id,
          }),
        }
      );
      setReviewConflicts(r.conflicts ?? []);
      setReviewSuggestions(r.suggestions ?? []);
    } catch {
      setErrorMsg("Could not load alternatives.");
      setReviewOpenId(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const applyReviewSuggestion = async (e: Entry, s: Suggestion) => {
    try {
      const st = s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime.slice(0, 8);
      await apiJson(`/timetable/${e.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          roomId: s.roomId,
          dayOfWeek: s.dayOfWeek,
          startTime: st,
          reviewStatus: "resolved",
        }),
      });
      setSuccessMsg("Entry moved and marked resolved.");
      setReviewOpenId(null);
      loadEntries();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  const forceResolveEntry = async (e: Entry) => {
    try {
      await apiJson(`/timetable/${e.id}`, {
        method: "PATCH",
        body: JSON.stringify({ reviewStatus: "resolved", ignoreConflicts: true }),
      });
      setSuccessMsg("Marked resolved (admin override).");
      setReviewOpenId(null);
      loadEntries();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  const clearReviewOnly = async (e: Entry) => {
    try {
      await apiJson(`/timetable/${e.id}`, {
        method: "PATCH",
        body: JSON.stringify({ reviewStatus: "resolved" }),
      });
      setSuccessMsg("Review flag cleared.");
      setReviewOpenId(null);
      loadEntries();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Update failed");
    }
  };

  const dayLabel = (d: number) => DAYS.find((x) => x.v === d)?.label ?? String(d);
  const slotLabel = (t: string) => String(t).slice(0, 5);

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar userName="" role="admin" pageTitle="Timetable Management" />

        <main className="flex-1 overflow-y-auto p-7">
          <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e", letterSpacing: "-0.02em" }}>
                Timetable Management
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Database-driven entries with conflict checks</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(Number(e.target.value))}
                className="rounded-xl px-3 py-2 border border-slate-200 text-sm"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => refresh()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600"
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <button
                type="button"
                onClick={runGenerate}
                disabled={genBusy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700"
              >
                <RefreshCw size={16} /> Generate missing
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setConflictOpen(false);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-all duration-150"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                }}
              >
                <Plus size={18} /> Add Entry
              </button>
            </div>
          </div>

          {loading && <p className="text-slate-500">Loading…</p>}
          {errorMsg && <p className="text-red-600 mb-3">{errorMsg}</p>}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-5" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <p style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500 }}>{successMsg}</p>
            </div>
          )}

          {showForm && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e" }}>Add New Timetable Entry</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setConflictOpen(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <X size={20} />
                </button>
              </div>

              {conflictOpen && (
                <div className="mb-5 rounded-xl overflow-hidden" style={{ border: "1.5px solid #f87171" }}>
                  <div className="flex items-center gap-3 px-5 py-4" style={{ background: "rgba(239,68,68,0.06)" }}>
                    <AlertTriangle size={18} color="#dc2626" />
                    <div>
                      <p style={{ fontWeight: 700, color: "#dc2626", fontSize: "0.9rem" }}>Scheduling Conflict</p>
                      {conflicts.map((c, i) => (
                        <p key={i} style={{ fontSize: "0.82rem", color: "#ef4444", marginTop: 2 }}>
                          {c.message}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "#fffdf7", borderTop: "1px solid #fde68a" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb size={16} color="#d97706" />
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#92400e" }}>Suggested alternatives (from DB)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="p-3.5 rounded-xl text-left transition-all duration-150"
                          style={{ background: "#ffffff", border: "1.5px solid rgba(22,163,74,0.3)", cursor: "pointer" }}
                        >
                          <p style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}>{s.roomName}</p>
                          <p style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {s.dayLabel} {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: 4 }}>{s.reason}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={submitAnyway}
                      className="text-sm font-semibold text-amber-800 underline"
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                      Submit anyway for admin review
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label style={labelStyle}>Subject</label>
                    <select
                      required
                      value={form.subjectId}
                      onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Faculty</label>
                    <select
                      required
                      value={form.facultyUserId}
                      onChange={(e) => setForm({ ...form, facultyUserId: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Room</label>
                    <select required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} style={inputStyle}>
                      <option value="">Select</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.room_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Division</label>
                    <select
                      required
                      value={form.divisionId}
                      onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Day</label>
                    <select
                      required
                      value={form.dayOfWeek}
                      onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select</option>
                      {DAYS.map((d) => (
                        <option key={d.v} value={d.v}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Start time</label>
                    <select
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Duration (hours)</label>
                    <select
                      value={form.durationSlots}
                      onChange={(e) => setForm({ ...form, durationSlots: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      value={form.entryType}
                      onChange={(e) => setForm({ ...form, entryType: e.target.value as "lecture" | "lab" })}
                      style={inputStyle}
                    >
                      <option value="lecture">Lecture</option>
                      <option value="lab">Lab</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer" }}
                >
                  <CheckCircle2 size={16} /> Add Entry
                </button>
              </form>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #f1f5f9" }}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f0a2e" }}>All entries (selected semester)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="p-3">Day</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Division</th>
                    <th className="p-3">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => {
                    const { color, bg } = COLORS[idx % COLORS.length];
                    return (
                      <Fragment key={e.id}>
                        <tr className="border-t border-slate-100">
                          <td className="p-3">{dayLabel(e.day_of_week)}</td>
                          <td className="p-3">
                            {slotLabel(e.start_time)} ({e.duration_slots}h)
                          </td>
                          <td className="p-3 font-medium">{e.subject_name}</td>
                          <td className="p-3 text-slate-600">{e.faculty_name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: bg, color }}>
                              {e.room_name}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{e.division_name}</td>
                          <td className="p-3 text-slate-600">
                            {e.review_status}
                            {e.review_status === "pending_review" && (
                              <button
                                type="button"
                                onClick={() => loadReviewSuggestions(e)}
                                className="ml-2 text-xs font-bold text-violet-600 underline"
                              >
                                Resolve
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <button type="button" onClick={() => removeEntry(e.id)} className="text-red-600 p-1" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                        {reviewOpenId === e.id && (
                          <tr className="bg-amber-50/80 border-t border-amber-100">
                            <td colSpan={8} className="p-4 text-sm">
                              {reviewLoading && <p className="text-slate-600">Loading alternatives…</p>}
                              {!reviewLoading && reviewConflicts.length > 0 && (
                                <p className="text-red-700 text-xs mb-2">
                                  {reviewConflicts.map((c, i) => (
                                    <span key={i}>
                                      {c.message}
                                      {i < reviewConflicts.length - 1 ? " · " : ""}
                                    </span>
                                  ))}
                                </p>
                              )}
                              {!reviewLoading && reviewSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-start">
                                  <Lightbulb size={16} className="text-amber-700 shrink-0 mt-0.5" />
                                  <div className="flex flex-wrap gap-2">
                                    {reviewSuggestions.map((s, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => applyReviewSuggestion(e, s)}
                                        className="text-left p-2 rounded-lg border border-green-300 bg-white text-xs max-w-[220px]"
                                      >
                                        <span className="font-bold text-slate-800">{s.roomName}</span>
                                        <br />
                                        {s.dayLabel} {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                                        <br />
                                        <span className="text-green-700">{s.reason}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!reviewLoading && reviewConflicts.length === 0 && reviewSuggestions.length === 0 && (
                                <p className="text-slate-600 text-xs mb-2">No remaining conflicts for this slot.</p>
                              )}
                              {!reviewLoading && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {reviewConflicts.length === 0 && reviewSuggestions.length === 0 && (
                                    <button
                                      type="button"
                                      onClick={() => clearReviewOnly(e)}
                                      className="text-xs font-semibold text-green-700 underline"
                                    >
                                      Mark resolved
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => forceResolveEntry(e)}
                                    className="text-xs font-semibold text-amber-900 underline"
                                  >
                                    Mark resolved anyway (override)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReviewOpenId(null)}
                                    className="text-xs text-slate-500 underline"
                                  >
                                    Close
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {entries.length === 0 && !loading && <p className="p-6 text-slate-500">No entries for this semester.</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "#475569",
  marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "0.9rem",
  background: "#fff",
  boxSizing: "border-box",
};
