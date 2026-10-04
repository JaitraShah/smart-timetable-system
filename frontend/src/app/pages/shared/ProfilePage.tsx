import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { apiJson } from "../../../lib/api";
import { useAuth, apiRoleToUiRole, type UiRole } from "../../../context/AuthContext";

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const uiRole: UiRole = user ? apiRoleToUiRole(user.role) : "student";

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await apiJson("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      await refreshMe();
      setMsg("Profile updated.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Update failed");
    }
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role={uiRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role={uiRole} pageTitle="Profile" />
        <main className="flex-1 overflow-y-auto p-7">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Your profile</h1>
          <p className="text-sm text-slate-500 mb-6">Update display name (stored in the database).</p>
          {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
          <form onSubmit={save} className="max-w-md space-y-4 rounded-2xl bg-white border border-slate-100 p-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
              <p className="text-slate-800 text-sm">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm"
                required
                minLength={2}
              />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold">
              Save
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
