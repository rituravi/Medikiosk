"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { fetchDocuments, fetchMe, type MedicalDocument, type Patient } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMe(), fetchDocuments().catch(() => [])])
      .then(([p, docs]) => {
        setPatient(p);
        setDocuments(docs);
      })
      .catch(() => setError("Please log in to view your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  return (
    <AppShell patientName={patient.full_name}>
      <div className="flex flex-col gap-8 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">Patient Portal</p>
          <h1 className="text-2xl font-semibold">
            Welcome back, {patient.full_name.split(" ")[0]}
          </h1>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Patient ID" value={`#${String(patient.id).padStart(6, "0")}`} />
          <StatCard label="Age" value={age !== null ? `${age} yrs` : "—"} />
          <StatCard label="Blood Group" value={patient.blood_group} accent />
          <StatCard label="Documents on File" value={String(documents.length)} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Personal Details">
            <Row label="Date of birth" value={patient.date_of_birth} />
            <Row label="Gender" value={genderLabel(patient.gender)} />
            <Row label="Phone" value={patient.phone_number || "—"} />
            <Row label="Address" value={patient.address || "—"} />
          </Card>

          <Card title="Clinical History">
            <Row label="Allergies" value={patient.allergies || "None reported"} />
            <Row
              label="Chronic conditions"
              value={patient.chronic_conditions || "None reported"}
            />
            <Row
              label="Current medications"
              value={patient.current_medications || "None reported"}
            />
            <Row label="Past surgeries" value={patient.past_surgeries || "None reported"} />
            <Row label="Family history" value={patient.family_history || "None reported"} />
          </Card>
        </div>

        <Card title="Quick Actions" noDivide>
          <div className="flex flex-wrap gap-3 p-4">
            <Link href="/documents" className="btn-primary">
              Upload a document
            </Link>
            <Link href="/summary" className="btn-secondary">
              View summary for doctor
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p
        className="mt-1 text-xl font-semibold"
        style={accent ? { color: "var(--primary)" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  children,
  noDivide,
}: {
  title: string;
  children: React.ReactNode;
  noDivide?: boolean;
}) {
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        {title}
      </h2>
      <div className={noDivide ? "" : "flex flex-col divide-y divide-[var(--border)] px-4"}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function genderLabel(g: string) {
  return { M: "Male", F: "Female", O: "Other" }[g] ?? g;
}

function calculateAge(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
