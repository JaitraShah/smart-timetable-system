import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Info } from "lucide-react";
import { useAuth, dashboardPathForUiRole, apiRoleToUiRole } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";

const demoHints = [
  { email: "admin@nmims.edu", role: "Admin", color: "#6366f1", password: "admin123" },
  { email: "dr.sharma@nmims.edu", role: "Faculty", color: "#0891b2", password: "demo123" },
  { email: "rahul@nmims.edu", role: "Student", color: "#7c3aed", password: "demo123" },
  { email: "events@nmims.edu", role: "Event Organiser", color: "#a855f7", password: "demo123" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email address is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const u = await login(email.trim().toLowerCase(), password);
      navigate(dashboardPathForUiRole(apiRoleToUiRole(u.role)));
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Login failed";
      setErrors({ email: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#f8f9ff" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: "8%",
          right: "12%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "8%",
          left: "8%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 transition-all duration-200"
          style={{
            color: "#94a3b8",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#6366f1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e8eaf0",
            boxShadow: "0 8px 48px rgba(99,102,241,0.08), 0 2px 12px rgba(0,0,0,0.05)",
            padding: "40px 36px",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-block px-5 py-1.5 rounded-xl text-white mb-4"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              }}
            >
              NMIMS
            </div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#0f0a2e",
                marginBottom: "6px",
              }}
            >
              Welcome Back
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                style={{ color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                Sign up free
              </button>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@nmims.edu"
                disabled={submitting}
                style={{ ...inputStyle, borderColor: errors.email ? "#f87171" : "#e2e8f0" }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1.5px solid #6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1.5px solid ${errors.email ? "#f87171" : "#e2e8f0"}`;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={submitting}
                  style={{ ...inputStyle, borderColor: errors.password ? "#f87171" : "#e2e8f0", paddingRight: "42px" }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid #6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${errors.password ? "#f87171" : "#e2e8f0"}`;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                fontWeight: 700,
                fontSize: "0.975rem",
                border: "none",
                cursor: submitting ? "wait" : "pointer",
                boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
                opacity: submitting ? 0.85 : 1,
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.14)",
                color: "#6366f1",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Info size={14} />
              {showHints ? "Hide" : "View"} Demo Credentials
            </button>

            {showHints && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
                <div className="px-4 py-2.5" style={{ background: "#f8f9ff", borderBottom: "1px solid #f1f5f9" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Seed accounts — see README for MySQL setup
                  </p>
                </div>
                {demoHints.map((h) => (
                  <button
                    key={h.email}
                    type="button"
                    onClick={() => {
                      setEmail(h.email);
                      setPassword(h.password);
                      setShowHints(false);
                      setErrors({});
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-150"
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #f8f9ff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8f9ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{h.email}</p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: h.color,
                        background: `${h.color}12`,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        border: `1px solid ${h.color}25`,
                      }}
                    >
                      {h.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
  letterSpacing: "0.04em",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  color: "#1e293b",
  fontSize: "0.925rem",
  outline: "none",
  background: "#ffffff",
  transition: "all 0.18s",
  boxSizing: "border-box",
};
const errorStyle: React.CSSProperties = { fontSize: "0.78rem", color: "#ef4444", marginTop: 4 };
