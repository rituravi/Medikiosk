"use client";

import { useEffect, useState } from "react";
import {
  adminCreateTriageStaff,
  adminFetchTriageStaff,
  type TriageStaffMember,
} from "@/lib/api";

export default function AdminTriageStaffSection() {
  const [staff, setStaff] = useState<TriageStaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadStaff() {
    setLoading(true);
    adminFetchTriageStaff()
      .then(setStaff)
      .finally(() => setLoading(false));
  }

  useEffect(loadStaff, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const member = await adminCreateTriageStaff({ username, password, full_name: fullName });
      setStaff((prev) => [member, ...prev]);
      setUsername("");
      setPassword("");
      setFullName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create triage staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        Triage Staff
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Username</span>
          <input
            required
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Password</span>
          <input
            required
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Full Name</span>
          <input
            required
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          {submitting ? "Creating..." : "Add Triage Staff"}
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-sm text-[var(--danger)]">{error}</p>}

      <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Username</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Full Name</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              staff.map((member) => (
                <tr key={member.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">{member.username}</td>
                  <td className="px-4 py-3">{member.full_name}</td>
                </tr>
              ))}
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-[var(--muted)]">
                  No triage staff added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
