"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  acknowledgeCheckIn,
  completeCheckIn,
  fetchTriageQueue,
  type QueueCheckIn,
} from "@/lib/api";

export default function TriagePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    fetchTriageQueue()
      .then(setQueue)
      .catch(() => setError("You don't have access to this page."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleAcknowledge(id: number) {
    setBusyId(id);
    try {
      await acknowledgeCheckIn(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(id: number) {
    setBusyId(id);
    try {
      await completeCheckIn(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;

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

  const priorityQueue = queue.filter((q) => q.is_emergency);
  const routineQueue = queue.filter((q) => !q.is_emergency);

  return (
    <AdminShell title="Medikiosk Triage">
      <div className="flex flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">Triage Desk</p>
          <h1 className="text-2xl font-semibold">Live Queue</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            AI-flagged priority cases are shown first. This list refreshes automatically.
          </p>
        </header>

        {priorityQueue.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold" style={{ color: "#b91c1c" }}>
              Priority — Needs Immediate Attention
            </h2>
            {priorityQueue.map((q) => (
              <QueueCard
                key={q.id}
                item={q}
                busy={busyId === q.id}
                onAcknowledge={() => handleAcknowledge(q.id)}
                onComplete={() => handleComplete(q.id)}
                emergency
              />
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--muted)]">Routine Queue</h2>
          {routineQueue.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No patients waiting.</p>
          )}
          {routineQueue.map((q) => (
            <QueueCard
              key={q.id}
              item={q}
              busy={busyId === q.id}
              onAcknowledge={() => handleAcknowledge(q.id)}
              onComplete={() => handleComplete(q.id)}
            />
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

function QueueCard({
  item,
  busy,
  onAcknowledge,
  onComplete,
  emergency,
}: {
  item: QueueCheckIn;
  busy: boolean;
  onAcknowledge: () => void;
  onComplete: () => void;
  emergency?: boolean;
}) {
  return (
    <div
      className="card p-4"
      style={
        emergency
          ? { background: "#fee2e2", border: "1px solid #fca5a5", color: "#7f1d1d" }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium" style={emergency ? { color: "#7f1d1d" } : undefined}>
            {item.patient_name} {item.patient_phone && `· ${item.patient_phone}`}
          </p>
          <p className="mt-1 text-sm" style={emergency ? { color: "#7f1d1d" } : undefined}>
            {item.symptoms_text}
          </p>
          {item.ai_reasoning && (
            <p
              className="mt-1 text-xs"
              style={{ color: emergency ? "#b91c1c" : "var(--muted)" }}
            >
              {item.ai_reasoning}
            </p>
          )}
          <p
            className="mt-1 text-xs"
            style={{ color: emergency ? "#b91c1c" : "var(--muted)" }}
          >
            Checked in {new Date(item.created_at).toLocaleTimeString()}
            {item.acknowledged_by_name && ` · Acknowledged by ${item.acknowledged_by_name}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {item.status === "WAITING" || item.status === "PRIORITY" ? (
            <button
              onClick={onAcknowledge}
              disabled={busy}
              className="btn-secondary text-xs"
              style={emergency ? { color: "#7f1d1d", borderColor: "#fca5a5" } : undefined}
            >
              Acknowledge
            </button>
          ) : null}
          <button onClick={onComplete} disabled={busy} className="btn-primary text-xs">
            Mark Seen
          </button>
        </div>
      </div>
    </div>
  );
}
