"use client";

import { useMemo, useState } from "react";

import { Guarded } from "@/components/guarded";
import { useAuth } from "@/components/auth-provider";
import { apiPost, apiUpload } from "@/lib/api";

type UploadResult = {
  id: string;
  filename: string;
};

export default function UploadPage() {
  const { credentials } = useAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [piiDetection, setPiiDetection] = useState(true);
  const [piiRedaction, setPiiRedaction] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [uploaded, setUploaded] = useState<UploadResult[]>([]);

  const fileCount = useMemo(() => files?.length ?? 0, [files]);

  async function handleUpload() {
    if (!credentials || !files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("retention_days", String(retentionDays));
    formData.append("pii_detection_enabled", String(piiDetection));
    formData.append("pii_redaction_enabled", String(piiRedaction));
    const response = await apiUpload<UploadResult[]>("/api/upload", credentials, formData);
    setUploaded(response);
    setMessage(`Uploaded ${response.length} document(s).`);
  }

  async function loadDemo() {
    if (!credentials) return;
    const response = await apiPost<{ loaded: number }>("/api/demo/load", credentials);
    setMessage(`Loaded ${response.loaded} demo documents.`);
  }

  return (
    <Guarded>
      <section className="panel p-8">
        <div className="pill">Upload + Ingest</div>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900">Turn incoming PDFs, images, and text files into routed workflow data.</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          The ingestion stage computes checksums, extracts text, falls back to OCR when needed, and stores canonical evidence chunks for downstream extraction.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-dashed border-blue-300 bg-blue-50/70 p-6">
            <input className="block w-full rounded-2xl border border-blue-200 bg-white px-4 py-6" type="file" multiple onChange={(event) => setFiles(event.target.files)} />
            <div className="mt-3 text-sm text-slate-600">{fileCount ? `${fileCount} file(s) ready to upload` : "Drag/drop is browser-native here; use bulk select for demo speed."}</div>
          </div>
          <div className="panel-dark p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Processing Controls</div>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm">
                <span>Retention days</span>
                <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" type="number" value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value))} />
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input checked={piiDetection} onChange={(event) => setPiiDetection(event.target.checked)} type="checkbox" />
                Enable PII detection
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input checked={piiRedaction} onChange={(event) => setPiiRedaction(event.target.checked)} type="checkbox" />
                Enable evidence redaction
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900" onClick={handleUpload}>
                Upload
              </button>
              <button className="rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white" onClick={loadDemo}>
                Load Demo Dataset
              </button>
            </div>
          </div>
        </div>
        {message ? <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {uploaded.length ? (
          <div className="mt-6 grid gap-3">
            {uploaded.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {item.filename}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </Guarded>
  );
}
