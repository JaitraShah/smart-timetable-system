import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Calendar, DoorOpen, FileCheck,
  Upload, FileText, Bell, LogOut, ChevronRight, User, Users, BookMarked,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "organiser" | "faculty" | "student";
  userName?: string;
}

const roleConfig = {
  admin:    { label: "Administrator",    accent: "#6366f1", bg: "rgba(99,102,241,0.08)",  initial: "A" },
  organiser:{ label: "Event Organiser",  accent: "#a855f7", bg: "rgba(168,85,247,0.08)", initial: "O" },
  faculty:  { label: "Faculty",          accent: "#0891b2", bg: "rgba(8,145,178,0.08)",  initial: "F" },
  student:  { label: "Student",          accent: "#7c3aed", bg: "rgba(124,58,237,0.08)", initial: "S" },
};

const adminItems    = [
  { path: "/admin",           icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users",     icon: Users,           label: "Users" },
  { path: "/admin/academic",  icon: BookMarked,      label: "Academic data" },
  { path: "/admin/timetable", icon: Calendar,        label: "Timetable" },
  { path: "/admin/rooms",     icon: DoorOpen,        label: "Rooms" },
  { path: "/admin/bookings",  icon: FileCheck,       label: "Booking Requests" },
  { path: "/admin/upload",    icon: Upload,          label: "Upload Data" },
  { path: "/admin/reports",   icon: FileText,        label: "Reports" },
  { path: "/profile",         icon: User,            label: "Profile" },
];
const organiserItems = [
  { path: "/organiser",                 icon: LayoutDashboard, label: "Dashboard" },
  { path: "/organiser/booking-request", icon: FileCheck,       label: "New Booking" },
  { path: "/notifications",             icon: Bell,            label: "Notifications" },
  { path: "/profile",                   icon: User,            label: "Profile" },
];
const facultyItems   = [
  { path: "/faculty",      icon: LayoutDashboard, label: "Dashboard" },
  { path: "/timetable",    icon: Calendar,        label: "My Timetable" },
  { path: "/notifications",icon: Bell,            label: "Notifications" },
  { path: "/profile",      icon: User,            label: "Profile" },
];
const studentItems   = [
  { path: "/student",      icon: LayoutDashboard, label: "Dashboard" },
  { path: "/timetable",    icon: Calendar,        label: "My Timetable" },
  { path: "/notifications",icon: Bell,            label: "Notifications" },
  { path: "/profile",      icon: User,            label: "Profile" },
];

const menuMap = { admin: adminItems, organiser: organiserItems, faculty: facultyItems, student: studentItems };

export function Sidebar({ role, userName }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const cfg = roleConfig[role];
  const items = menuMap[role];
  const displayName = userName ?? user?.fullName ?? cfg.label;

  return (
    <div
      className="w-64 h-screen flex flex-col flex-shrink-0"
      style={{
        background: "#ffffff",
        borderRight: "1px solid #f1f5f9",
        boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Brand ── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid #f1f5f9" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.02em" }}>N</span>
        </div>
        <div>
          <p style={{ fontWeight: 800, color: "#0f0a2e", fontSize: "0.95rem", letterSpacing: "-0.01em", lineHeight: 1.2 }}>NMIMS</p>
          <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>Smart Timetable</p>
        </div>
      </div>

      {/* ── Role pill ── */}
      <div className="px-5 py-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: cfg.bg }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.accent }}
          >
            <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>{cfg.initial}</span>
          </div>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: cfg.accent }}>{cfg.label}</span>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#cbd5e1",
            padding: "8px 12px 6px",
          }}
        >
          Navigation
        </p>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group"
              style={{
                background:  isActive ? cfg.bg         : "transparent",
                color:       isActive ? cfg.accent     : "#64748b",
                fontWeight:  isActive ? 600 : 500,
                fontSize: "0.875rem",
                textDecoration: "none",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#f8f9ff";
                  (e.currentTarget as HTMLElement).style.color = "#374151";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                }
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 3,
                    borderRadius: "0 2px 2px 0",
                    background: cfg.accent,
                  }}
                />
              )}
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px" }}>
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg }}
          >
            <span style={{ color: cfg.accent, fontSize: "0.75rem", fontWeight: 700 }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "capitalize" }}>{role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: "0.875rem",
            fontWeight: 500,
            textAlign: "left",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#fff1f2";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}
