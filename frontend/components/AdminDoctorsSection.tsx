"use client";

import { useEffect, useState } from "react";
import { adminCreateDoctor, adminFetchDoctors, type Doctor } from "@/lib/api";

export default function AdminDoctorsSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadDoctors() {
    setLoading(true);
    adminFetchDoctors()
      .then(setDoctors)
      .finally(() => setLoading(false));
  }

  useEffect(loadDoctors, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const doctor = await adminCreateDoctor({
        username,
        password,
        full_name: fullName,
        specialization,
      });
      setDoctors((prev) => [doctor, ...prev]);
      setUsername("");
      setPassword("");
      setFullName("");
      setSpecialization("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create doctor account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        Doctors
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
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Specialization</span>
          <input
            className="input"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          {submitting ? "Creating..." : "Add Doctor"}
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-sm text-[var(--danger)]">{error}</p>}

      <div className="overflow-x-auto border-t" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Username</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">Full Name</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                Specialization
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">{doctor.username}</td>
                  <td className="px-4 py-3">{doctor.full_name}</td>
                  <td className="px-4 py-3">{doctor.specialization || "—"}</td>
                </tr>
              ))}
            {!loading && doctors.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--muted)]">
                  No doctors added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
