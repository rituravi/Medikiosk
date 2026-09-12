"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import PatientSummaryDetails from "@/components/PatientSummaryDetails";
import {
  doctorFetchPatientSummary,
  doctorFetchPatients,
  type DoctorPatient,
  type PatientSummary,
} from "@/lib/api";

export default function DoctorPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [otpTargetId, setOtpTargetId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [summary, setSummary] = useState<PatientSummary | null>(null);

  useEffect(() => {
    doctorFetchPatients()
      .then(setPatients)
      .catch(() => setError("You don't have access to this page."))
      .finally(() => setLoading(false));
  }, []);

  function openOtpPrompt(patientId: number) {
    setOtpTargetId(patientId);
    setOtp("");
    setOtpError(null);
    setSummary(null);
  }

  function closeOtpPrompt() {
    setOtpTargetId(null);
    setOtp("");
    setOtpError(null);
  }

  async function submitOtp(patientId: number) {
    setOtpError(null);
    setVerifying(true);
    try {
      const data = await doctorFetchPatientSummary(patientId, otp);
      setSummary(data);
      setOtpTargetId(null);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not verify OTP.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  if (summary) {
    return (
      <AdminShell title="Medikiosk Doctor">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Patient Summary</h1>
            <button onClick={() => setSummary(null)} className="btn-secondary">
              Back to patient list
            </button>
          </div>
          <PatientSummaryDetails data={summary} />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Medikiosk Doctor">
      <div className="flex flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">Doctor Portal</p>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Ask the patient for their access OTP to view their medical summary.
          </p>
        </header>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Date of Birth
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <Fragment key={patient.id}>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3">{patient.full_name}</td>
                      <td className="px-4 py-3">{patient.date_of_birth}</td>
                      <td className="px-4 py-3">{genderLabel(patient.gender)}</td>
                      <td className="px-4 py-3">{patient.phone_number || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openOtpPrompt(patient.id)}
                          className="btn-secondary text-xs"
                        >
                          View Summary
                        </button>
                      </td>
                    </tr>
                    {otpTargetId === patient.id && (
                      <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-[var(--muted)]">
                              Enter {patient.full_name}&apos;s OTP:
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="input"
                              placeholder="OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                            />
                            <button
                              onClick={() => submitOtp(patient.id)}
                              disabled={verifying || !otp}
                              className="btn-primary text-xs"
                            >
                              {verifying ? "Verifying..." : "Verify OTP"}
                            </button>
                            <button onClick={closeOtpPrompt} className="text-xs underline">
                              Cancel
                            </button>
                            {otpError && (
                              <p className="text-sm text-[var(--danger)]">{otpError}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                      No patients registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function genderLabel(g: string) {
  return { M: "Male", F: "Female", O: "Other" }[g] ?? g;
}
