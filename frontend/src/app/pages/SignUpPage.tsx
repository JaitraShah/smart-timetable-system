import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiJson, ApiError } from "../../lib/api";

const ROLES = [
  { value: "student", label: "Student", desc: "Access class schedules & updates" },
  { value: "faculty", label: "Faculty", desc: "View timetable & submit requests" },
  { value: "event_organiser", label: "Event Organiser", desc: "Request & manage room bookings" },
];

type DivisionOpt = {
  id: number;
  name: string;
  code: string;
  semester_name: string;
  department_name: string;
};
type DeptOpt = { id: number; name: string; code: string };

export default function SignUpPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [divisions, setDivisions] = useState<DivisionOpt[]>([]);
  const [departments, setDepartments] = useState<DeptOpt[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "" as "" | "student" | "faculty" | "event_organiser",
    password: "",
    confirm: "",
    divisionId: "" as string | number,
    departmentId: "" as string | number,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, dep] = await Promise.all([
          apiJson<DivisionOpt[]>("/public/divisions", { skipAuth: true }),
          apiJson<DeptOpt[]>("/public/departments", { skipAuth: true }),
        ]);
        setDivisions(d);
        setDepartments(dep);
      } catch {
        setLoadErr("Could not load divisions/departments. Is the API running?");
      }
    })();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.role) e.role = "Please select your role";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (form.role === "student" && !form.divisionId) e.divisionId = "Select your class/division";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const body: Record<string, unknown> = {
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };
      if (form.role === "student") body.divisionId = Number(form.divisionId);
      if (form.role === "faculty" && form.departmentId) body.departmentId = Number(form.departmentId);
      await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      });
      setSubmitted(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? String(err.message)
          : err instanceof Error
            ? err.message
            : "Registration failed";
      setErrors({ email: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#f8f9ff" }}>
        <div className="relative w-full max-w-md">
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #e8eaf0",
              boxShadow: "0 8px 48px rgba(99,102,241,0.08)",
              padding: "48px 36px",
              textAlign: "center",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(22,163,74,0.08)" }}
            >
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f0a2e", marginBottom: 8 }}>
              Account Request Submitted
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
              Your registration is pending. An administrator must activate your account before you can sign in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                fontWeight: 700,
                fontSize: "0.975rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#f8f9ff" }}>
      <div
        className="absolute pointer-events-none"
        style={{
          top: "5%",
          left: "15%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(48px)",
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
              Create an Account
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                style={{ color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                Sign in
              </button>
            </p>
          </div>

          {loadErr && (
            <p style={{ fontSize: "0.85rem", color: "#dc2626", marginBottom: 12 }}>{loadErr}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(ev) => setForm({ ...form, name: ev.target.value })}
                placeholder="e.g. Rahul Sharma"
                disabled={submitting}
                style={{ ...inputStyle, borderColor: errors.name ? "#f87171" : "#e2e8f0" }}
              />
              {errors.name && <p style={errorStyle}>{errors.name}</p>}
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(ev) => setForm({ ...form, email: ev.target.value })}
                placeholder="your.email@nmims.edu"
                disabled={submitting}
                style={{ ...inputStyle, borderColor: errors.email ? "#f87171" : "#e2e8f0" }}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>

            <div>
              <label style={labelStyle}>I am registering as a…</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className="text-left p-3 rounded-xl transition-all duration-150"
                    style={{
                      border: form.role === r.value ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                      background: form.role === r.value ? "rgba(99,102,241,0.05)" : "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: form.role === r.value ? "#6366f1" : "#1e293b",
                        marginBottom: 3,
                      }}
                    >
                      {r.label}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.4 }}>{r.desc}</p>
                  </button>
                ))}
              </div>
              {errors.role && <p style={errorStyle}>{errors.role}</p>}
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 6 }}>
                Admin accounts are provisioned by the institution — not publicly registered.
              </p>
            </div>

            {form.role === "student" && (
              <div>
                <label style={labelStyle}>Division / Class</label>
                <select
                  value={form.divisionId}
                  onChange={(ev) => setForm({ ...form, divisionId: ev.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name} ({d.semester_name})
                    </option>
                  ))}
                </select>
                {errors.divisionId && <p style={errorStyle}>{errors.divisionId}</p>}
              </div>
            )}

            {form.role === "faculty" && (
              <div>
                <label style={labelStyle}>Department (optional)</label>
                <select
                  value={form.departmentId}
                  onChange={(ev) => setForm({ ...form, departmentId: ev.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(ev) => setForm({ ...form, password: ev.target.value })}
                  placeholder="Min. 8 characters"
                  disabled={submitting}
                  style={{ ...inputStyle, borderColor: errors.password ? "#f87171" : "#e2e8f0", paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(ev) => setForm({ ...form, confirm: ev.target.value })}
                placeholder="Re-enter your password"
                disabled={submitting}
                style={{ ...inputStyle, borderColor: errors.confirm ? "#f87171" : "#e2e8f0" }}
              />
              {errors.confirm && <p style={errorStyle}>{errors.confirm}</p>}
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
                marginTop: "8px",
                opacity: submitting ? 0.85 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Create Account"}
            </button>
          </form>
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
  boxSizing: "border-box" as const,
};
const errorStyle: React.CSSProperties = { fontSize: "0.78rem", color: "#ef4444", marginTop: 4 };
