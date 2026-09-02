"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSummary, type PatientSummary } from "@/lib/api";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab Report",
  DISCHARGE_SUMMARY: "Discharge Summary",
  OTHER: "Other",
};

export default function SummaryPage() {
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [data, setData] = useState<PatientSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSummary(order)
      .then(setData)
      .catch(() => setError("Please log in to view your medical summary."))
      .finally(() => setLoading(false));
  }, [order]);

  if (loading) return <p className="p-8">Loading...</p>;

  if (error || !data) {
    return <p className="p-8 text-red-600">{error}</p>;
  }

  const { patient, timeline } = data;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12 print:px-0 print:py-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span>Order</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-foreground px-4 py-2 text-background"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <header className="border-b border-black/[.1] pb-4 dark:border-white/[.15]">
        <h1 className="text-2xl font-semibold">Medical History Summary</h1>
        <p className="text-sm text-zinc-500">
          Generated on {new Date().toLocaleString()}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <SummaryField label="Name" value={patient.full_name} />
        <SummaryField label="Date of birth" value={patient.date_of_birth} />
        <SummaryField label="Gender" value={patient.gender} />
        <SummaryField label="Blood group" value={patient.blood_group} />
        <SummaryField label="Phone" value={patient.phone_number || "—"} />
        <SummaryField label="Address" value={patient.address || "—"} />
      </section>

      <section className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <SummaryField label="Allergies" value={patient.allergies || "None reported"} />
        <SummaryField
          label="Chronic conditions"
          value={patient.chronic_conditions || "None reported"}
        />
        <SummaryField
          label="Current medications"
          value={patient.current_medications || "None reported"}
        />
        <SummaryField
          label="Past surgeries"
          value={patient.past_surgeries || "None reported"}
        />
        <SummaryField
          label="Family history"
          value={patient.family_history || "None reported"}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-zinc-500">No history recorded yet.</p>
        ) : (
          <ol className="flex flex-col gap-4 border-l border-black/[.1] pl-4 dark:border-white/[.15]">
            {timeline.map((entry, i) => (
              <li key={i} className="text-sm">
                <p className="text-xs font-medium text-zinc-500">
                  {new Date(entry.date).toLocaleString()}
                </p>
                {entry.kind === "REGISTRATION" ? (
                  <p className="font-medium">{entry.title}</p>
                ) : (
                  <>
                    <p className="font-medium">
                      {entry.document_type
                        ? DOCUMENT_TYPE_LABELS[entry.document_type]
                        : "Document"}
                      : {entry.title}
                    </p>
                    {entry.notes && (
                      <p className="text-zinc-500">{entry.notes}</p>
                    )}
                    {entry.extracted_text && (
                      <pre className="mt-1 whitespace-pre-wrap rounded bg-black/[.04] p-2 text-xs dark:bg-white/[.06]">
                        {entry.extracted_text}
                      </pre>
                    )}
                    {entry.file_url && (
                      <a
                        href={entry.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline print:hidden"
                      >
                        View original file
                      </a>
                    )}
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-black/[.1] py-1 dark:border-white/[.15]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
