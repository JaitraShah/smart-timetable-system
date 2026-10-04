import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Plus, X, DoorOpen, CheckCircle2, Trash2 } from "lucide-react";
import { apiJson, ApiError } from "../../../lib/api";

type Room = {
  id: number;
  name: string;
  room_type: string;
  capacity: number;
  is_available: number;
};

const TYPE_OPTS = [
  { v: "classroom", label: "Classroom" },
  { v: "lab", label: "Lab" },
  { v: "event_room", label: "Event room" },
  { v: "multipurpose", label: "Multipurpose" },
];

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", roomType: "classroom", capacity: "40" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const r = await apiJson<Room[]>("/rooms");
    setRooms(r);
  }, []);

  useEffect(() => {
    load().catch(() => setMsg("Failed to load rooms"));
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    await apiJson("/rooms", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        roomType: form.roomType,
        capacity: Number(form.capacity),
        isAvailable: true,
        departmentId: null,
      }),
    });
    setMsg("Room added.");
    setShowForm(false);
    setForm({ name: "", roomType: "classroom", capacity: "40" });
    load();
  };

  const toggle = async (r: Room) => {
    setErr("");
    await apiJson(`/rooms/${r.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable: !Number(r.is_available) }),
    });
    load();
  };

  const remove = async (r: Room) => {
    if (!confirm(`Delete room "${r.name}"?`)) return;
    setErr("");
    try {
      await apiJson(`/rooms/${r.id}`, { method: "DELETE" });
      setMsg("Room deleted.");
      load();
    } catch (e) {
      setMsg("");
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const available = rooms.filter((r) => r.is_available).length;

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Room Management" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Room Management</h1>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Data from MySQL</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer" }}
            >
              <Plus size={18} /> Add Room
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Total" value={rooms.length} color="#6366f1" />
            <Stat label="Available flag" value={available} color="#16a34a" />
          </div>

          {msg && (
            <div className="flex items-center gap-2 p-4 rounded-xl mb-4" style={{ background: "rgba(22,163,74,0.07)" }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <span style={{ color: "#15803d" }}>{msg}</span>
            </div>
          )}
          {err && <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          {showForm && (
            <form
              onSubmit={submit}
              className="rounded-2xl p-6 mb-6 bg-white border border-slate-100 space-y-4 max-w-lg"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-900">New room</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
              />
              <select
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
              >
                {TYPE_OPTS.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                required
                type="number"
                placeholder="Capacity"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold">
                Save
              </button>
            </form>
          )}

          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Room</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Capacity</th>
                  <th className="text-left p-3">Available</th>
                  <th className="text-left p-3">Toggle</th>
                  <th className="text-left p-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <DoorOpen size={16} className="text-violet-500" />
                      {r.name}
                    </td>
                    <td className="p-3">{r.room_type}</td>
                    <td className="p-3">{r.capacity}</td>
                    <td className="p-3">{Number(r.is_available) ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => toggle(r)}
                        className="text-violet-600 font-semibold text-xs underline"
                      >
                        Toggle
                      </button>
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => remove(r)} className="text-red-600 p-1" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
