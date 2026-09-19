import Link from "next/link";

export default function AiDisclaimer() {
  return (
    <p className="mx-auto max-w-3xl px-8 pb-6 text-center text-xs text-[var(--muted)]">
      Please note that AI can make mistakes. Any AI-generated summaries or
      interpretations should be reviewed by qualified clinicians and are not a substitute
      for professional medical judgment. Uploaded documents and voice recordings are sent
      to third-party AI providers (Google Gemini, Sarvam AI) for text extraction — see our{" "}
      <Link href="/privacy-policy" className="underline">
        Privacy Policy
      </Link>{" "}
      for details.
    </p>
  );
}
