"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PatientSummaryDetails from "@/components/PatientSummaryDetails";
import { fetchSummary, type PatientSummary } from "@/lib/api";

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

  const { patient } = data;

  return (
    <AppShell patientName={patient.full_name}>
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8 print:px-0 print:py-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <p className="text-sm text-[var(--muted)]">Records</p>
          <h1 className="text-2xl font-semibold">Summary for Doctor</h1>
        </div>
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
          <button onClick={() => window.print()} className="btn-primary">
            Print / Save PDF
          </button>
        </div>
      </div>

      <PatientSummaryDetails data={data} />
    </div>
    </AppShell>
  );
}
