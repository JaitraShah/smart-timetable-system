import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { apiJson, ApiError } from "../../../lib/api";
import { Trash2, RefreshCw, BookMarked } from "lucide-react";

type Dept = { id: number; name: string; code: string };
type Term = { id: number; name: string; start_month: number; end_month: number };
type Sem = { id: number; name: string; academic_year: number; academic_term_id: number; term_name?: string };
type Div = { id: number; name: string; code: string; semester_id: number; department_id: number; semester_name?: string; department_name?: string };
type Sub = { id: number; name: string; code: string; department_id: number; default_duration_slots: number; requires_lab: number; department_name?: string };
type FS = {
  id: number;
  user_id: number;
  subject_id: number;
  division_id: number;
  faculty_name: string;
  subject_name: string;
  subject_code: string;
  division_name: string;
};
type Fac = { id: number; full_name: string; email: string };

export default function AcademicData() {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [semesters, setSemesters] = useState<Sem[]>([]);
  const [divisions, setDivisions] = useState<Div[]>([]);
  const [subjects, setSubjects] = useState<Sub[]>([]);
  const [facultySubjects, setFacultySubjects] = useState<FS[]>([]);
  const [faculty, setFaculty] = useState<Fac[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [dForm, setDForm] = useState({ name: "", code: "" });
  const [tForm, setTForm] = useState({ name: "", startMonth: "1", endMonth: "5" });
  const [sForm, setSForm] = useState({ name: "", academicYear: String(new Date().getFullYear()), academicTermId: "" });
  const [divForm, setDivForm] = useState({ name: "", code: "", semesterId: "", departmentId: "" });
  const [subForm, setSubForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    defaultDurationSlots: "1",
    requiresLab: false,
  });
  const [fsForm, setFsForm] = useState({ userId: "", subjectId: "", divisionId: "" });

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const [d, t, sem, div, sub, fs, fac] = await Promise.all([
        apiJson<Dept[]>("/departments"),
        apiJson<Term[]>("/terms"),
        apiJson<Sem[]>("/semesters"),
        apiJson<Div[]>("/divisions"),
        apiJson<Sub[]>("/subjects"),
        apiJson<FS[]>("/faculty-subjects"),
        apiJson<Fac[]>("/users/faculty"),
      ]);
      setDepartments(d);
      setTerms(t);
      setSemesters(sem);
      setDivisions(div);
      setSubjects(sub);
      setFacultySubjects(fs);
      setFaculty(fac);
    } catch {
      setErr("Failed to load data. Is the API running and are you logged in as admin?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  };

  const handleErr = (e: unknown) => {
    const m = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Request failed";
    setErr(m);
    setTimeout(() => setErr(""), 6000);
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Academic catalog" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="text-violet-600" size={22} /> Academic data (MySQL)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Full CRUD for departments, terms, semesters, divisions, subjects, and faculty assignments. All changes persist in the database.
              </p>
            </div>
            <button
              type="button"
              onClick={() => load()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600"
            >
              <RefreshCw size={16} /> Reload
            </button>
          </div>

          {msg && <p className="text-green-700 text-sm mb-3 bg-green-50 px-3 py-2 rounded-lg">{msg}</p>}
          {err && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          {loading && <p className="text-slate-500">Loading…</p>}

          {!loading && (
            <div className="space-y-10">
              <Section title="Departments">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    placeholder="Name"
                    value={dForm.name}
                    onChange={(e) => setDForm({ ...dForm, name: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-40"
                  />
                  <input
                    placeholder="Code"
                    value={dForm.code}
                    onChange={(e) => setDForm({ ...dForm, code: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-28"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/departments", {
                          method: "POST",
                          body: JSON.stringify({ name: dForm.name, code: dForm.code }),
                        });
                        setDForm({ name: "", code: "" });
                        flash("Department added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Code</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.code}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            title="Delete"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Delete this department?")) return;
                              try {
                                await apiJson(`/departments/${r.id}`, { method: "DELETE" });
                                flash("Deleted.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Academic terms">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    placeholder="Name"
                    value={tForm.name}
                    onChange={(e) => setTForm({ ...tForm, name: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-48"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={tForm.startMonth}
                    onChange={(e) => setTForm({ ...tForm, startMonth: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-20"
                    title="Start month"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={tForm.endMonth}
                    onChange={(e) => setTForm({ ...tForm, endMonth: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-20"
                    title="End month"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/terms", {
                          method: "POST",
                          body: JSON.stringify({
                            name: tForm.name,
                            startMonth: Number(tForm.startMonth),
                            endMonth: Number(tForm.endMonth),
                          }),
                        });
                        setTForm({ name: "", startMonth: "1", endMonth: "5" });
                        flash("Term added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Start mo</th>
                      <th className="text-left p-2">End mo</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.start_month}</td>
                        <td className="p-2">{r.end_month}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Delete term?")) return;
                              try {
                                await apiJson(`/terms/${r.id}`, { method: "DELETE" });
                                flash("Deleted.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Semesters">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    placeholder="Name"
                    value={sForm.name}
                    onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-36"
                  />
                  <input
                    type="number"
                    value={sForm.academicYear}
                    onChange={(e) => setSForm({ ...sForm, academicYear: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-24"
                  />
                  <select
                    value={sForm.academicTermId}
                    onChange={(e) => setSForm({ ...sForm, academicTermId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Term</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/semesters", {
                          method: "POST",
                          body: JSON.stringify({
                            name: sForm.name,
                            academicYear: Number(sForm.academicYear),
                            academicTermId: Number(sForm.academicTermId),
                          }),
                        });
                        flash("Semester added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Term</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {semesters.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.academic_year}</td>
                        <td className="p-2">{r.term_name ?? r.academic_term_id}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Delete semester?")) return;
                              try {
                                await apiJson(`/semesters/${r.id}`, { method: "DELETE" });
                                flash("Deleted.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Divisions">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    placeholder="Name"
                    value={divForm.name}
                    onChange={(e) => setDivForm({ ...divForm, name: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-32"
                  />
                  <input
                    placeholder="Code"
                    value={divForm.code}
                    onChange={(e) => setDivForm({ ...divForm, code: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-24"
                  />
                  <select
                    value={divForm.semesterId}
                    onChange={(e) => setDivForm({ ...divForm, semesterId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={divForm.departmentId}
                    onChange={(e) => setDivForm({ ...divForm, departmentId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/divisions", {
                          method: "POST",
                          body: JSON.stringify({
                            name: divForm.name,
                            code: divForm.code,
                            semesterId: Number(divForm.semesterId),
                            departmentId: Number(divForm.departmentId),
                          }),
                        });
                        flash("Division added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Semester</th>
                      <th className="text-left p-2">Dept</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {divisions.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.code}</td>
                        <td className="p-2">{r.semester_name}</td>
                        <td className="p-2">{r.department_name}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Delete division?")) return;
                              try {
                                await apiJson(`/divisions/${r.id}`, { method: "DELETE" });
                                flash("Deleted.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Subjects">
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                  <input
                    placeholder="Name"
                    value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-36"
                  />
                  <input
                    placeholder="Code"
                    value={subForm.code}
                    onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm w-24"
                  />
                  <select
                    value={subForm.departmentId}
                    onChange={(e) => setSubForm({ ...subForm, departmentId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                  <select
                    value={subForm.defaultDurationSlots}
                    onChange={(e) => setSubForm({ ...subForm, defaultDurationSlots: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="1">1 slot (1h)</option>
                    <option value="2">2 slots (2h)</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={subForm.requiresLab}
                      onChange={(e) => setSubForm({ ...subForm, requiresLab: e.target.checked })}
                    />
                    Lab
                  </label>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/subjects", {
                          method: "POST",
                          body: JSON.stringify({
                            name: subForm.name,
                            code: subForm.code,
                            departmentId: Number(subForm.departmentId),
                            defaultDurationSlots: Number(subForm.defaultDurationSlots),
                            requiresLab: subForm.requiresLab,
                          }),
                        });
                        flash("Subject added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Dept</th>
                      <th className="text-left p-2">Slots</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.code}</td>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.department_name}</td>
                        <td className="p-2">{r.default_duration_slots}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Delete subject?")) return;
                              try {
                                await apiJson(`/subjects/${r.id}`, { method: "DELETE" });
                                flash("Deleted.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="Faculty ↔ subject ↔ division">
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={fsForm.userId}
                    onChange={(e) => setFsForm({ ...fsForm, userId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm min-w-[160px]"
                  >
                    <option value="">Faculty</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.full_name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={fsForm.subjectId}
                    onChange={(e) => setFsForm({ ...fsForm, subjectId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm min-w-[140px]"
                  >
                    <option value="">Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                  <select
                    value={fsForm.divisionId}
                    onChange={(e) => setFsForm({ ...fsForm, divisionId: e.target.value })}
                    className="border rounded-lg px-2 py-1.5 text-sm min-w-[120px]"
                  >
                    <option value="">Division</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        await apiJson("/faculty-subjects", {
                          method: "POST",
                          body: JSON.stringify({
                            userId: Number(fsForm.userId),
                            subjectId: Number(fsForm.subjectId),
                            divisionId: Number(fsForm.divisionId),
                          }),
                        });
                        flash("Link added.");
                        load();
                      } catch (e) {
                        handleErr(e);
                      }
                    }}
                  >
                    Add link
                  </button>
                </div>
                <table className="w-full text-sm border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Faculty</th>
                      <th className="text-left p-2">Subject</th>
                      <th className="text-left p-2">Division</th>
                      <th className="p-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {facultySubjects.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="p-2">{r.id}</td>
                        <td className="p-2">{r.faculty_name}</td>
                        <td className="p-2">
                          {r.subject_code} — {r.subject_name}
                        </td>
                        <td className="p-2">{r.division_name}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="text-red-600 p-1"
                            onClick={async () => {
                              if (!confirm("Remove this assignment?")) return;
                              try {
                                await apiJson(`/faculty-subjects/${r.id}`, { method: "DELETE" });
                                flash("Removed.");
                                load();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}
