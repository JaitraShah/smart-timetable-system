import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { Navbar } from "../../components/Navbar";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { apiFetch, apiJson, publicUploadUrl } from "../../../lib/api";

type Uploaded = {
  id: number;
  original_name: string;
  stored_name: string;
  size_bytes: number;
  created_at: string;
  uploader: string;
};

export default function DataUpload() {
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [csvText, setCsvText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const rows = await apiJson<Uploaded[]>("/uploads");
    setFiles(rows);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await apiFetch("/uploads", { method: "POST", body: fd });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(j.error ? `Upload failed: ${j.error}` : "Upload failed");
    } else {
      setMsg(`Uploaded: ${f.name}`);
      load();
    }
    setBusy(false);
    e.target.value = "";
  };

  const importCsv = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await apiJson<{ imported: number; errors: string[] }>("/timetable/import-csv", {
        method: "POST",
        body: JSON.stringify({ csv: csvText }),
      });
      setMsg(`Imported ${r.imported} rows. ${r.errors.length ? r.errors.slice(0, 3).join(" | ") : ""}`);
    } catch {
      setMsg("Import failed");
    }
    setBusy(false);
  };

  return (
    <div className="flex h-screen" style={{ background: "#f8f9ff" }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar role="admin" pageTitle="Upload Data" />
        <main className="flex-1 overflow-y-auto p-7">
          <div className="mb-7">
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f0a2e" }}>Upload Data</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>
              Store files on disk + metadata in DB. Optional CSV timetable import.
            </p>
          </div>

          {msg && (
            <div className="flex items-center gap-2 p-4 rounded-xl mb-4 bg-green-50 text-green-800 text-sm">
              <CheckCircle2 size={18} />
              {msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl p-6 bg-white border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Upload className="text-violet-600" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Upload file</h2>
                  <p className="text-xs text-slate-500">PDF, CSV, XLSX — stored under /uploads</p>
                </div>
              </div>
              <input type="file" disabled={busy} onChange={onFile} className="text-sm" />
            </div>

            <div className="rounded-2xl p-6 bg-white border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FileSpreadsheet className="text-cyan-600" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Timetable CSV import</h2>
                  <p className="text-xs text-slate-500">
                    Header: day_of_week,start_time,duration_slots,subject_code,room_name,faculty_email,division_code,semester_id[,entry_type]
                  </p>
                </div>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full border rounded-xl p-3 text-sm font-mono mb-3"
                placeholder={`1,09:00:00,1,CS201,CR-101,dr.sharma@nmims.edu,CS4A,1,lecture`}
              />
              <button
                type="button"
                disabled={busy}
                onClick={importCsv}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold"
              >
                Run import
              </button>
            </div>
          </div>

          <h2 className="font-bold text-slate-800 mb-3">Uploaded files</h2>
          <div className="rounded-xl border border-slate-100 bg-white divide-y divide-slate-100">
            {files.map((f) => (
              <div key={f.id} className="p-4 flex flex-wrap justify-between gap-2 text-sm items-center">
                <span className="font-medium">{f.original_name}</span>
                <span className="text-slate-500">
                  {f.uploader} · {new Date(f.created_at).toLocaleString()} · {(f.size_bytes / 1024).toFixed(1)} KB
                </span>
                <a
                  href={publicUploadUrl(f.stored_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 font-semibold text-xs"
                >
                  Open file
                </a>
              </div>
            ))}
            {files.length === 0 && <p className="p-4 text-slate-500 text-sm">No uploads yet.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}
