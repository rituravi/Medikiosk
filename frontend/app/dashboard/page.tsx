"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, fetchMe, type Patient } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setPatient)
      .catch(() => {
        setError("Please log in to view your dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return <p className="p-8">Loading...</p>;
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="rounded-full bg-foreground px-5 py-3 text-background"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Welcome, {patient.full_name}</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/documents" className="underline">
            My documents
          </Link>
          <Link href="/summary" className="underline">
            Summary for doctor
          </Link>
          <button onClick={handleLogout} className="underline">
            Log out
          </button>
        </div>
      </div>

      <Section title="Personal Details">
        <Row label="Date of birth" value={patient.date_of_birth} />
        <Row label="Gender" value={patient.gender} />
        <Row label="Phone" value={patient.phone_number || "—"} />
        <Row label="Address" value={patient.address || "—"} />
      </Section>

      <Section title="Clinical History">
        <Row label="Blood group" value={patient.blood_group} />
        <Row label="Allergies" value={patient.allergies || "—"} />
        <Row label="Chronic conditions" value={patient.chronic_conditions || "—"} />
        <Row label="Current medications" value={patient.current_medications || "—"} />
        <Row label="Past surgeries" value={patient.past_surgeries || "—"} />
        <Row label="Family history" value={patient.family_history || "—"} />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
