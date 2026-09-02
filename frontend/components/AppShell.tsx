"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AiDisclaimer from "@/components/AiDisclaimer";
import { clearToken } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/documents", label: "Medical Documents", icon: DocumentIcon },
  { href: "/summary", label: "Summary for Doctor", icon: ClipboardIcon },
];

export default function AppShell({
  children,
  patientName,
}: {
  children: React.ReactNode;
  patientName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className="flex w-64 shrink-0 flex-col justify-between px-4 py-6 print:hidden"
        style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-foreground)" }}
      >
        <div className="flex flex-col gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <CrossIcon />
            <span className="text-lg font-semibold text-white">Medikiosk</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    active
                      ? { background: "var(--sidebar-active)", color: "white" }
                      : { color: "var(--sidebar-foreground)" }
                  }
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          {patientName && (
            <div className="px-2 text-sm">
              <p className="text-white">{patientName}</p>
              <p className="text-xs opacity-70">Patient</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium opacity-80 hover:opacity-100"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
        <AiDisclaimer />
      </main>
    </div>
  );
}

function CrossIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--sidebar-active)" />
      <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h7l5 5v13H7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 11h6M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
