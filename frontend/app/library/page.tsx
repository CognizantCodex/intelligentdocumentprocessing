"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DocumentTable } from "@/components/document-table";
import { Guarded } from "@/components/guarded";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";

export default function LibraryPage() {
  const { credentials } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    if (!credentials) return;
    try {
      setError("");
      setMessage("");
      const response = await apiGet<DocumentSummary[]>("/api/documents", credentials);
      setDocuments(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load documents.");
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, [credentials]);

  async function rerun(id: string) {
    if (!credentials) return;
    try {
      setError("");
      const target = documents.find((document) => document.id === id);
      await apiPost(`/api/documents/${id}/run`, credentials);
      setMessage(`Re-ran processing for ${target?.filename ?? "document"}.`);
      await loadDocuments();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to rerun document.");
    }
  }

  async function remove(id: string) {
    if (!credentials) return;
    try {
      setError("");
      const target = documents.find((document) => document.id === id);
      await apiDelete(`/api/documents/${id}`, credentials);
      setMessage(`Deleted ${target?.filename ?? "document"}.`);
      await loadDocuments();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to delete document.");
    }
  }

  async function exportJson(id: string) {
    if (!credentials) return;
    try {
      setError("");
      const target = documents.find((document) => document.id === id);
      await apiGet(`/api/export/${id}?format=json`, credentials);
      setMessage(`Exported ${target?.filename ?? "document"} as JSON.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to export document.");
    }
  }

  return (
    <Guarded>
      <section className="panel p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="pill">Document Library</div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">Track every uploaded and demo document through the IDP lifecycle.</h2>
          </div>
          <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700" onClick={() => void loadDocuments()}>
            Refresh
          </button>
        </div>
        {error ? <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div> : null}
        {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        <div className="mt-6">
          <DocumentTable documents={documents} onRun={(id) => void rerun(id)} onDelete={(id) => void remove(id)} onExport={(id) => void exportJson(id)} />
        </div>
      </section>
    </Guarded>
  );
}
