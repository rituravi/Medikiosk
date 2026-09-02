import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b px-8 py-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <CrossIcon />
          <span className="text-lg font-semibold">Medikiosk</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="btn-secondary">
            Patient Login
          </Link>
          <Link href="/register" className="btn-primary">
            Register
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="badge" style={{ background: "var(--background)", color: "var(--primary)", border: "1px solid var(--border)" }}>
          Hospital Management System
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight">
          One place for your medical history, prescriptions, and lab reports.
        </h1>
        <p className="max-w-xl text-[var(--muted)]">
          Register once to securely store your clinical history, digitize physical
          documents like prescriptions and discharge summaries, and hand doctors a
          ready-made summary at your next visit.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className="btn-primary">
            Register as a Patient
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      </main>

      <section className="grid grid-cols-1 gap-6 border-t px-8 py-12 md:grid-cols-3" style={{ borderColor: "var(--border)" }}>
        <Feature
          title="Digital Registration"
          description="Capture personal details and clinical history in one guided form."
        />
        <Feature
          title="Document Digitization"
          description="Upload prescriptions, lab reports, and discharge summaries — OCR extracts the text automatically."
        />
        <Feature
          title="Doctor-Ready Summary"
          description="A date-sorted, printable summary of your full medical history for any visit."
        />
      </section>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}

function CrossIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--primary)" />
      <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
