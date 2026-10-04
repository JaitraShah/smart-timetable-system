import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../lib/api";

interface NavbarProps {
  userName?: string;
  role: string;
  pageTitle?: string;
}

const roleAccent: Record<string, string> = {
  admin:    "#6366f1",
  organiser:"#a855f7",
  faculty:  "#0891b2",
  student:  "#7c3aed",
};

export function Navbar({ userName: userNameProp, role, pageTitle }: NavbarProps) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiJson<{ count: number }>("/notifications/unread-count")
      .then((r) => setUnread(Number(r.count ?? 0)))
      .catch(() => setUnread(0));
  }, [user, pageTitle]);

  const userName = userNameProp ?? user?.fullName ?? "User";
  const accent = roleAccent[role] ?? "#6366f1";
  const initials = userName
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const title = pageTitle ?? (role.charAt(0).toUpperCase() + role.slice(1) + " Portal");

  return (
    <div
      className="flex items-center justify-between px-7 flex-shrink-0"
      style={{
        height: 64,
        background: "#ffffff",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        zIndex: 10,
      }}
    >
      {/* Left — page title */}
      <div>
        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#0f0a2e",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <Link
          to="/notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
          style={{
            background: "transparent",
            textDecoration: "none",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8f9ff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={19} color="#64748b" />
          {unread > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#ef4444", border: "1.5px solid #ffffff" }}
              title={`${unread} unread`}
            />
          )}
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "#f1f5f9" }} />

        {/* User chip */}
        <Link
          to="/profile"
          className="flex items-center gap-3 no-underline"
          style={{ color: "inherit" }}
          title="Profile"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accent}12`,
              border: `1.5px solid ${accent}20`,
            }}
          >
            <span style={{ color: accent, fontSize: "0.78rem", fontWeight: 700 }}>
              {initials}
            </span>
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{userName}</p>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "capitalize" }}>{role}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
