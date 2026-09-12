"use client";

import { useState } from "react";
import { setPatientOtp } from "@/lib/api";

export default function PatientOtpCard({
  otpIsSet,
  onUpdated,
}: {
  otpIsSet: boolean;
  onUpdated: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await setPatientOtp(otp);
      setSuccess("OTP saved. Share it with your doctor to let them view your summary.");
      setOtp("");
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        Doctor Access OTP
      </h2>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-[var(--muted)]">
          {otpIsSet
            ? "An access OTP is set. Share it with your doctor so they can view your medical summary. You can change it anytime."
            : "Set a 4-6 digit OTP and share it with your doctor so they can view your medical summary."}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="e.g. 4821"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button type="submit" disabled={submitting || !otp} className="btn-primary text-xs">
            {submitting ? "Saving..." : otpIsSet ? "Update OTP" : "Set OTP"}
          </button>
        </form>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {success && <p className="text-sm" style={{ color: "var(--primary)" }}>{success}</p>}
      </div>
    </section>
  );
}
