"use client";

import { useEffect, useState } from "react";
import { fetchAccessLog, type AccessLogEntry } from "@/lib/api";

export default function PatientAccessLogCard() {
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccessLog()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
        Who Has Viewed Your Records
      </h2>
      <div className="flex flex-col divide-y divide-[var(--border)] px-4">
        {loading && <p className="py-3 text-sm text-[var(--muted)]">Loading...</p>}
        {!loading && logs.length === 0 && (
          <p className="py-3 text-sm text-[var(--muted)]">
            No doctor has viewed your summary yet.
          </p>
        )}
        {!loading &&
          logs.map((log) => (
            <div key={log.id} className="flex justify-between gap-4 py-2.5 text-sm">
              <span>Dr. {log.doctor_name}</span>
              <span className="text-[var(--muted)]">
                {new Date(log.accessed_at).toLocaleString()}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}
