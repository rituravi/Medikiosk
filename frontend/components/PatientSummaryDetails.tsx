import type { PatientSummary } from "@/lib/api";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION: "Prescription",
  LAB_REPORT: "Lab Report",
  DISCHARGE_SUMMARY: "Discharge Summary",
  OTHER: "Other",
};

export default function PatientSummaryDetails({ data }: { data: PatientSummary }) {
  const { patient, timeline } = data;

  return (
    <>
      <header className="card p-4">
        <h2 className="text-lg font-semibold">Medical History Summary</h2>
        <p className="text-sm text-[var(--muted)]">
          Generated on {new Date().toLocaleString()}
        </p>
      </header>

      <section className="card grid grid-cols-2 gap-x-8 gap-y-1 p-4 text-sm">
        <SummaryField label="Name" value={patient.full_name} />
        <SummaryField label="Date of birth" value={patient.date_of_birth} />
        <SummaryField label="Gender" value={patient.gender} />
        <SummaryField label="Blood group" value={patient.blood_group} />
        <SummaryField label="Phone" value={patient.phone_number || "—"} />
        <SummaryField label="Address" value={patient.address || "—"} />
      </section>

      <section className="card grid grid-cols-2 gap-x-8 gap-y-1 p-4 text-sm">
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

      <section className="card flex flex-col gap-4 p-4">
        <h2 className="text-sm font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No history recorded yet.</p>
        ) : (
          <ol className="flex flex-col gap-4 border-l pl-4" style={{ borderColor: "var(--border)" }}>
            {timeline.map((entry, i) => (
              <li key={i} className="text-sm">
                <p className="text-xs font-medium text-[var(--muted)]">
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
                    {entry.notes && <p className="text-[var(--muted)]">{entry.notes}</p>}
                    {entry.extracted_text && (
                      <pre
                        className="mt-1 whitespace-pre-wrap rounded p-2 text-xs"
                        style={{ background: "var(--background)" }}
                      >
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
    </>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between gap-4 border-b border-dotted py-1"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
