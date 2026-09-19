"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken, deletePatientAccount } from "@/lib/api";

export default function DeleteAccountCard() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deletePatientAccount();
      clearToken();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account.");
      setDeleting(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        Privacy &amp; Data
      </h2>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-[var(--muted)]">
          Read our{" "}
          <Link href="/privacy-policy" className="underline" style={{ color: "var(--primary)" }}>
            Privacy Policy
          </Link>{" "}
          to see what data we hold and how it&apos;s used. You can permanently delete
          your account and all associated documents at any time.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="btn-secondary self-start text-xs"
            style={{ color: "var(--danger)" }}
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              This permanently deletes your profile and all uploaded documents. Are you sure?
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-primary text-xs"
              style={{ background: "var(--danger)" }}
            >
              {deleting ? "Deleting..." : "Yes, delete everything"}
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs underline">
              Cancel
            </button>
          </div>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      </div>
    </section>
  );
}
