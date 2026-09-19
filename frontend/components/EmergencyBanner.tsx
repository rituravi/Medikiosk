"use client";

import { useEffect, useState } from "react";
import { fetchMyCheckIns, type CheckIn } from "@/lib/api";

export default function EmergencyBanner() {
  const [activeAlerts, setActiveAlerts] = useState<CheckIn[]>([]);

  useEffect(() => {
    function load() {
      fetchMyCheckIns()
        .then((checkIns) =>
          setActiveAlerts(
            checkIns.filter((c) => c.is_emergency && c.status !== "COMPLETED"),
          ),
        )
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  if (activeAlerts.length === 0) return null;

  return (
    <div
      className="px-8 py-3 text-center text-sm font-semibold print:hidden"
      style={{ background: "#fee2e2", color: "#7f1d1d", borderBottom: "1px solid #fca5a5" }}
    >
      Your symptoms or an uploaded document have been flagged as urgent. Please inform a
      staff member immediately — you do not need to wait in the routine queue.
    </div>
  );
}
