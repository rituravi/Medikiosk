"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  deleteDocument,
  fetchDocuments,
  fetchMe,
  uploadDocument,
  type DocumentType,
  type MedicalDocument,
} from "@/lib/api";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab Report",
  DISCHARGE_SUMMARY: "Discharge Summary",
  OTHER: "Other",
};

export default function DocumentsPage() {
  const [patientName, setPatientName] = useState<string | undefined>();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState<DocumentType>("PRESCRIPTION");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadDocuments() {
    setLoading(true);
    fetchDocuments()
      .then(setDocuments)
      .catch(() => setError("Please log in to view your documents."))
      .finally(() => setLoading(false));
  }

  useEffect(loadDocuments, []);
  useEffect(() => {
    fetchMe()
      .then((p) => setPatientName(p.full_name))
      .catch(() => {});
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadDocument({ document_type: documentType, title, notes, file });
      setTitle("");
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <AppShell patientName={patientName}>
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Records</p>
        <h1 className="text-2xl font-semibold">Medical Documents</h1>
      </header>

      <form
        onSubmit={handleUpload}
        className="card flex flex-col gap-4 p-5"
      >
        <h2 className="text-sm font-semibold">Upload a document</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Document type</span>
          <select
            className="input"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            required
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blood test - Jan 2026"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Notes (optional)</span>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">File (image or PDF)</span>
          <input
            required
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="input"
          />
        </label>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button type="submit" disabled={uploading} className="btn-primary self-start">
          {uploading ? "Uploading & digitizing..." : "Upload"}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--muted)]">
          Your documents ({documents.length})
        </h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
    </AppShell>
  );
}

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: MedicalDocument;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="badge" style={{ background: "var(--background)", color: "var(--primary)" }}>
            {DOCUMENT_TYPE_LABELS[doc.document_type]}
          </span>
          <p className="mt-1 font-medium">{doc.title}</p>
          <p className="text-xs text-[var(--muted)]">
            {new Date(doc.uploaded_at).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <a href={doc.file_url} target="_blank" rel="noreferrer" className="underline">
            View file
          </a>
          <button onClick={() => onDelete(doc.id)} className="text-[var(--danger)] underline">
            Delete
          </button>
        </div>
      </div>

      {doc.notes && <p className="text-sm text-[var(--muted)]">{doc.notes}</p>}

      <div className="text-xs">
        <span
          className="badge"
          style={
            doc.ocr_status === "DONE"
              ? { background: "#dcfce7", color: "#15803d" }
              : doc.ocr_status === "FAILED"
                ? { background: "#fee2e2", color: "#b91c1c" }
                : { background: "var(--background)", color: "var(--muted)" }
          }
        >
          OCR: {doc.ocr_status}
        </span>
      </div>

      {doc.ocr_status === "DONE" && doc.extracted_text && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs underline"
          >
            {expanded ? "Hide extracted text" : "Show extracted text"}
          </button>
          {expanded && (
            <pre className="mt-2 whitespace-pre-wrap rounded p-3 text-xs" style={{ background: "var(--background)" }}>
              {doc.extracted_text}
            </pre>
          )}
        </div>
      )}

      {doc.ocr_status === "FAILED" && doc.ocr_error && (
        <p className="text-xs text-[var(--danger)]">Error: {doc.ocr_error}</p>
      )}
    </div>
  );
}
