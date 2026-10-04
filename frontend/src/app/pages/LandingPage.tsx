import { useNavigate } from "react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Shield, Calendar, Users, GraduationCap,
  Zap, Lightbulb, Lock, ArrowRight, ChevronRight,
  CheckCircle2, BookOpen, Layers, BarChart3,
} from "lucide-react";

const roles = [
  { id: "admin",     title: "Admin",           description: "Create timetables, manage rooms & approve bookings",  icon: Shield,        accent: "#6366f1" },
  { id: "faculty",   title: "Faculty",          description: "View assigned lectures, rooms and weekly schedule",   icon: Users,         accent: "#0891b2" },
  { id: "student",   title: "Students",         description: "Access personal class schedules and live updates",    icon: GraduationCap, accent: "#7c3aed" },
  { id: "organiser", title: "Event Organisers", description: "Request rooms and manage event bookings",             icon: Calendar,      accent: "#a855f7" },
];

const features = [
  { icon: Zap,       title: "Conflict Detection",   description: "Automatically detects and prevents scheduling conflicts — faculty overlap, room clash, and time collisions.", color: "#6366f1" },
  { icon: Lightbulb, title: "Smart Suggestions",    description: "Instantly suggests alternative rooms and time slots whenever a conflict is detected.", color: "#a855f7" },
  { icon: Lock,      title: "Role-Based Access",    description: "Every user gets an isolated dashboard — only the data and controls relevant to their role.", color: "#0891b2" },
  { icon: BarChart3, title: "Utilization Reports",  description: "Real-time reports on room usage, booking rates, and conflict prevention stats.", color: "#16a34a" },
];

const howItWorks = [
  { step: "01", icon: BookOpen, title: "Admin Creates Timetable",  description: "Admin selects semester, adds subjects, assigns faculty, allocates rooms and defines time slots through a guided workflow.", color: "#6366f1" },
  { step: "02", icon: Zap,       title: "System Detects Conflicts", description: "The system automatically checks for faculty overlaps, room clashes, and time collisions — then highlights issues visually.", color: "#a855f7" },
  { step: "03", icon: Lightbulb, title: "Suggestions Are Provided", description: "For every conflict, the system suggests the best alternative rooms and slots. Admin approves with one click.", color: "#0891b2" },
  { step: "04", icon: Layers,    title: "Roles Get Their View",     description: "Faculty see their assigned lectures. Students see their class schedule. Organisers manage bookings — all in isolation.", color: "#16a34a" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef  = useRef<HTMLDivElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    setMouse({ x, y });
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${e.clientX - rect.left - 160}px, ${e.clientY - rect.top - 160}px)`;
    }
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const blobX = (mouse.x - 0.5) * 30;
  const blobY = (mouse.y - 0.5) * 20;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9ff" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(248,249,255,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-lg text-white text-sm" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontWeight: 800, letterSpacing: "0.06em" }}>
            NMIMS
          </div>
          <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 500 }}>Smart Timetable System</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {["Features","Roles","How it Works"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(" ","-")}`}
              style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6366f1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"; }}
            >{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg text-sm transition-all duration-200"
            style={{ border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1", fontWeight: 600, background: "transparent", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            Login
          </button>
          <button onClick={() => navigate("/signup")}
            className="px-5 py-2 rounded-lg text-sm text-white transition-all duration-200"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            Get Started
          </button>
        </div>
      </header>

      {/* ════ HERO ════ */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ paddingTop: 100, paddingBottom: 112 }}>
        <div className="absolute pointer-events-none" style={{ top: "-10%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", filter: "blur(48px)", transition: "transform 0.1s ease-out", transform: `translate(${blobX}px, ${blobY}px)` }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)", filter: "blur(40px)", transition: "transform 0.12s ease-out", transform: `translate(${-blobX * 0.6}px, ${-blobY * 0.6}px)` }} />
        <div ref={glowRef} className="absolute pointer-events-none" style={{ width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", transition: "transform 0.06s linear" }} />

        <div className="relative container mx-auto px-6 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", fontSize: "0.8rem", fontWeight: 600, color: "#6366f1", letterSpacing: "0.04em" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#6366f1", display: "inline-block" }} />
            Academic Scheduling Platform · NMIMS
          </div>

          <h1 style={{ fontSize: "clamp(2.6rem, 5.5vw, 4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#0f0a2e", marginBottom: "1.25rem" }}>
            Intelligent Timetabling{" "}
            <span style={{ backgroundImage: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              for Every Role
            </span>
          </h1>

          <p style={{ fontSize: "1.2rem", fontWeight: 500, color: "#64748b", marginBottom: "0.875rem", lineHeight: 1.5 }}>
            Conflict-Free Scheduling, Automatically
          </p>
          <p className="mx-auto" style={{ maxWidth: 560, color: "#94a3b8", lineHeight: 1.8, fontSize: "0.975rem", marginBottom: "2.5rem" }}>
            A purpose-built academic scheduling platform that manages semester timetables and event room bookings with automatic conflict detection and smart resolution — for admins, faculty, students and event organisers.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate("/signup")}
              className="group flex items-center gap-2 px-8 py-3.5 rounded-xl text-white transition-all duration-200"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontWeight: 700, fontSize: "0.975rem", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.35)"; }}>
              Get Started Free
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button onClick={() => navigate("/login")}
              className="px-8 py-3.5 rounded-xl transition-all duration-200"
              style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 600, fontSize: "0.975rem", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}>
              Login to Portal
            </button>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {["Conflict Detection", "Role-Based Access", "Real-Time Updates", "Booking Management"].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#6366f1" />
                <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ ROLES ════ */}
      <section id="roles" className="py-20" style={{ background: "#ffffff" }}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", marginBottom: "0.75rem" }}>Roles</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f0a2e" }}>
              Built for Every Role in Your Institution
            </h2>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#94a3b8" }}>
              Role is system-assigned — each user sees only their own world
            </p>
          </div>

          <div style={{ height: 1, background: "#f1f5f9" }} />
          {roles.map((role, i) => {
            const Icon = role.icon;
            const isLast = i === roles.length - 1;
            return (
              <button key={role.id} onClick={() => navigate("/login")}
                className="group w-full text-left flex items-center gap-5 px-4 py-5 transition-all duration-200"
                style={{ background: "transparent", border: "none", borderBottom: isLast ? "none" : "1px solid #f1f5f9", cursor: "pointer", borderRadius: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f8f9ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: role.accent, flexShrink: 0 }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${role.accent}12`, border: `1px solid ${role.accent}28` }}>
                  <Icon size={17} color={role.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block" style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.975rem" }}>{role.title}</span>
                  <span className="block" style={{ fontSize: "0.845rem", color: "#94a3b8", marginTop: 2 }}>{role.description}</span>
                </div>
                <ChevronRight size={18} className="flex-shrink-0 transition-all duration-200 group-hover:translate-x-1" style={{ color: `${role.accent}60` }} />
              </button>
            );
          })}
          <div style={{ height: 1, background: "#f1f5f9" }} />
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section id="features" className="py-20" style={{ background: "#f8f9ff" }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", marginBottom: "0.75rem" }}>Platform</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f0a2e" }}>Key Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.title}
                  className="group p-7 rounded-2xl transition-all duration-300"
                  style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 36px rgba(0,0,0,0.09)`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${feature.color}25`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#f1f5f9"; }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${feature.color}10`, border: `1px solid ${feature.color}20` }}>
                    <Icon size={22} color={feature.color} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem", marginBottom: "0.5rem" }}>{feature.title}</h3>
                  <p style={{ fontSize: "0.845rem", color: "#94a3b8", lineHeight: 1.7 }}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section id="how-it-works" className="py-20" style={{ background: "#ffffff" }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", marginBottom: "0.75rem" }}>Process</p>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f0a2e" }}>How It Works</h2>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#94a3b8", maxWidth: 440, margin: "0.75rem auto 0" }}>
              From timetable creation to every role's personalised view — in four steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step}
                  className="relative flex gap-5 p-7 rounded-2xl transition-all duration-300"
                  style={{ background: "#ffffff", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${step.color}22`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#f1f5f9"; }}>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${step.color}10`, border: `1px solid ${step.color}20` }}>
                      <Icon size={22} color={step.color} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: step.color, letterSpacing: "0.08em" }}>STEP {step.step}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.975rem", marginBottom: "0.5rem" }}>{step.title}</h3>
                    <p style={{ fontSize: "0.845rem", color: "#94a3b8", lineHeight: 1.7 }}>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ CTA BANNER ════ */}
      <section className="py-16" style={{ background: "#f8f9ff" }}>
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="rounded-3xl p-12 text-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 20px 60px rgba(99,102,241,0.35)" }}>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 12 }}>
              Ready to Transform Your Scheduling?
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.75)", marginBottom: 32, lineHeight: 1.7 }}>
              Join NMIMS's intelligent scheduling platform and eliminate conflicts for good.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => navigate("/signup")}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl transition-all duration-200"
                style={{ background: "#ffffff", color: "#6366f1", fontWeight: 700, fontSize: "0.975rem", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}>
                Create Free Account <ArrowRight size={17} />
              </button>
              <button onClick={() => navigate("/login")}
                className="px-8 py-3.5 rounded-xl transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", fontWeight: 600, fontSize: "0.975rem", border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer", backdropFilter: "blur(8px)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: "1px solid #f1f5f9", background: "#ffffff", fontSize: "0.8rem", color: "#cbd5e1", letterSpacing: "0.02em" }}>
        © {new Date().getFullYear()} NMIMS Smart Timetable System · All rights reserved
      </footer>
    </div>
  );
}
