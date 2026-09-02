"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { registerPatient, setToken } from "@/lib/api";

const initialForm = {
  username: "",
  password: "",
  email: "",
  full_name: "",
  date_of_birth: "",
  gender: "M" as "M" | "F" | "O",
  phone_number: "",
  address: "",
  blood_group: "UNKNOWN",
  allergies: "",
  chronic_conditions: "",
  current_medications: "",
  past_surgeries: "",
  family_history: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof initialForm>(
    key: K,
    value: (typeof initialForm)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await registerPatient(form);
      setToken(res.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ background: "var(--sidebar-bg)" }}
    >
    <div className="card w-full max-w-2xl p-8">
      <div className="mb-6 flex items-center gap-2">
        <CrossIcon />
        <span className="text-lg font-semibold">Medikiosk</span>
      </div>

      <h1 className="text-xl font-semibold">Patient Registration</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="underline" style={{ color: "var(--primary)" }}>
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Account
          </legend>
          <Field label="Username">
            <input
              required
              className="input"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              minLength={8}
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Personal Details
          </legend>
          <Field label="Full name">
            <input
              required
              className="input"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
            />
          </Field>
          <Field label="Date of birth">
            <input
              required
              type="date"
              className="input"
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select
              className="input"
              value={form.gender}
              onChange={(e) =>
                update("gender", e.target.value as "M" | "F" | "O")
              }
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
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
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Clinical History
          </legend>
          <Field label="Blood group">
            <select
              className="input"
              value={form.blood_group}
              onChange={(e) => update("blood_group", e.target.value)}
            >
              {["UNKNOWN", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ),
              )}
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
        </fieldset>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function CrossIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--primary)" />
      <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
