import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-semibold text-black dark:text-zinc-50">
        Medikiosk
      </h1>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="rounded-full bg-foreground px-5 py-3 text-background"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-black/[.08] px-5 py-3 dark:border-white/[.145]"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
