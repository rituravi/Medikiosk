"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  deleteDocument,
  fetchDocuments,
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Medical Documents</h1>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <form
        onSubmit={handleUpload}
        className="flex flex-col gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
      >
        <h2 className="text-lg font-medium">Upload a document</h2>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="rounded-full bg-foreground px-5 py-3 text-background disabled:opacity-50"
        >
          {uploading ? "Uploading & digitizing..." : "Upload"}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Your documents</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
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
    <div className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{doc.title}</p>
          <p className="text-xs text-zinc-500">
            {DOCUMENT_TYPE_LABELS[doc.document_type]} ·{" "}
            {new Date(doc.uploaded_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <a href={doc.file_url} target="_blank" rel="noreferrer" className="underline">
            View file
          </a>
          <button onClick={() => onDelete(doc.id)} className="text-red-600 underline">
            Delete
          </button>
        </div>
      </div>

      {doc.notes && <p className="text-sm text-zinc-500">{doc.notes}</p>}

      <div className="text-xs">
        <span
          className={
            doc.ocr_status === "DONE"
              ? "text-green-600"
              : doc.ocr_status === "FAILED"
                ? "text-red-600"
                : "text-zinc-500"
          }
        >
          OCR status: {doc.ocr_status}
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
            <pre className="mt-2 whitespace-pre-wrap rounded bg-black/[.04] p-3 text-xs dark:bg-white/[.06]">
              {doc.extracted_text}
            </pre>
          )}
        </div>
      )}

      {doc.ocr_status === "FAILED" && doc.ocr_error && (
        <p className="text-xs text-red-600">Error: {doc.ocr_error}</p>
      )}
    </div>
  );
}
