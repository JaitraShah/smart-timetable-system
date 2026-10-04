import { useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { apiJson } from "../../../lib/api";

type N = {
  id: number;
  title: string;
  body: string;
  is_read: number;
  created_at: string;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);

  const load = useCallback(async () => {
    const rows = await apiJson<N[]>("/notifications");
    setItems(rows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (id: number) => {
    await apiJson(`/notifications/${id}/read`, { method: "PATCH", body: "{}" });
    load();
  };

  const markAll = async () => {
    await apiJson("/notifications/read-all", { method: "POST", body: "{}" });
    load();
  };

  const unread = items.filter((n) => Number(n.is_read) === 0).length;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9ff" }}>
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-7 py-5">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Bell className="text-violet-600" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                <p className="text-sm text-slate-500">{unread} unread</p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-sm font-semibold text-violet-600 bg-transparent border-none cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-7 py-7 space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl p-4 border ${n.is_read ? "bg-white border-slate-100" : "bg-violet-50 border-violet-200"}`}
          >
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-600 mt-1">{n.body}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {Number(n.is_read) === 0 && (
                <button
                  type="button"
                  onClick={() => mark(n.id)}
                  className="text-xs font-semibold text-violet-600 shrink-0 h-fit bg-transparent border-none cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 text-center py-12">No notifications.</p>}
      </div>
    </div>
  );
}
