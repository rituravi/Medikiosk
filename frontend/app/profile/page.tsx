"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { fetchMe, updatePatient, type Patient } from "@/lib/api";

type EditableFields = Pick<
  Patient,
  | "full_name"
  | "phone_number"
  | "address"
  | "blood_group"
  | "allergies"
  | "chronic_conditions"
  | "current_medications"
  | "past_surgeries"
  | "family_history"
>;

export default function ProfilePage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<EditableFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchMe()
      .then((p) => {
        setPatient(p);
        setForm({
          full_name: p.full_name,
          phone_number: p.phone_number,
          address: p.address,
          blood_group: p.blood_group,
          allergies: p.allergies,
          chronic_conditions: p.chronic_conditions,
          current_medications: p.current_medications,
          past_surgeries: p.past_surgeries,
          family_history: p.family_history,
        });
      })
      .catch(() => setError("Please log in to edit your profile."))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updatePatient(form);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;

  if (error || !patient || !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <AppShell patientName={patient.full_name}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">Patient Portal</p>
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
        </header>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-4">
          <Field label="Full name">
            <input
              required
              className="input"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <input
              className="input"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <textarea
              className="input"
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Field>
          <Field label="Blood group">
            <select
              className="input"
              value={form.blood_group}
              onChange={(e) => update("blood_group", e.target.value)}
            >
              {["UNKNOWN", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Allergies">
            <textarea
              className="input"
              rows={2}
              value={form.allergies}
              onChange={(e) => update("allergies", e.target.value)}
            />
          </Field>
          <Field label="Chronic conditions">
            <textarea
              className="input"
              rows={2}
              value={form.chronic_conditions}
              onChange={(e) => update("chronic_conditions", e.target.value)}
            />
          </Field>
          <Field label="Current medications">
            <textarea
              className="input"
              rows={2}
              value={form.current_medications}
              onChange={(e) => update("current_medications", e.target.value)}
            />
          </Field>
          <Field label="Past surgeries">
            <textarea
              className="input"
              rows={2}
              value={form.past_surgeries}
              onChange={(e) => update("past_surgeries", e.target.value)}
            />
          </Field>
          <Field label="Family medical history">
            <textarea
              className="input"
              rows={2}
              value={form.family_history}
              onChange={(e) => update("family_history", e.target.value)}
            />
          </Field>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {success && (
            <p className="text-sm" style={{ color: "var(--primary)" }}>
              Profile updated.
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary self-start">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
