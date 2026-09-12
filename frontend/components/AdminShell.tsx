"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";

export default function AdminShell({
  children,
  title = "Medikiosk Admin",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="flex items-center justify-between border-b px-8 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <CrossIcon />
          <span className="text-lg font-semibold">{title}</span>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Log out
        </button>
      </header>
      <main className="flex-1">{children}</main>
    </div>
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
