import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { apiJson } from "../../../lib/api";

type URow = {
  id: number;
  email: string;
  full_name: string;
  role_name: string;
  registration_status: string;
  division_id: number | null;
  department_id: number | null;
};

export default function UserManagement() {
  const [rows, setRows] = useState<URow[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await apiJson<URow[]>("/users");
      setRows(r);
    } catch {
      setErr("Failed to load users.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: number, registrationStatus: "pending" | "active" | "rejected") => {
    setMsg("");
    try {
      await apiJson(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ registrationStatus }),
      });
      setMsg(`User #${id} → ${registrationStatus}`);
      load();
    } catch {
      setErr("Status update failed.");
    }
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Users" />
        <main className="flex-1 overflow-y-auto p-7">
          <h1 className="text-xl font-bold text-slate-900 mb-1">User accounts</h1>
          <p className="text-sm text-slate-500 mb-4">Approve pending registrations and review roles (from database).</p>
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
          {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
          <div className="rounded-2xl border border-slate-100 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3">{u.id}</td>
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">{u.role_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          u.registration_status === "active"
                            ? "bg-green-100 text-green-800"
                            : u.registration_status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.registration_status}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.registration_status === "pending" && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setStatus(u.id, "active")}
                            className="px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(u.id, "rejected")}
                            className="px-2 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !err && <p className="p-6 text-slate-500">No users.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
