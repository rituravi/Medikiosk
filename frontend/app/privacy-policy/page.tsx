import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <Link href="/" className="text-sm underline" style={{ color: "var(--primary)" }}>
          &larr; Back to Medikiosk
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Privacy Policy</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Last updated: 19 September 2026 &middot; Sample policy for a prototype deployment
        </p>
      </div>

      <div className="card p-4 text-sm" style={{ color: "var(--muted)" }}>
        This is placeholder text for a prototype and has not been reviewed by a lawyer.
        Before real patient data is collected, this policy must be replaced with one
        drafted or reviewed by qualified legal counsel, naming the actual clinic/company
        as Data Fiduciary and a real Grievance Officer.
      </div>

      <Section title="1. Who we are">
        <p>
          Medikiosk (&quot;we&quot;, &quot;us&quot;) is the Data Fiduciary responsible for
          the personal data you provide through this application, as defined under the
          Digital Personal Data Protection Act, 2023 (&quot;DPDPA&quot;).
        </p>
      </Section>

      <Section title="2. What data we collect">
        <ul className="list-disc pl-5">
          <li>Identity and contact details: name, date of birth, gender, phone number, address.</li>
          <li>
            Clinical history: blood group, allergies, chronic conditions, current
            medications, past surgeries, family history.
          </li>
          <li>
            Documents you upload: prescriptions, lab reports, discharge summaries, and any
            text automatically extracted from them.
          </li>
          <li>Voice recordings, if you use the &quot;Fill by voice&quot; feature.</li>
          <li>An access OTP you set to control which doctors can view your summary.</li>
        </ul>
      </Section>

      <Section title="3. Why we collect it and your consent">
        <p>
          We process this data solely to register you as a patient, digitize your
          medical documents, and produce a consolidated summary you can share with a
          doctor. We collect it only after you give clear, specific consent at
          registration. If you are a minor, we additionally require your parent or
          guardian&apos;s consent. You may withdraw consent at any time by deleting your
          account (see Section 7); doing so does not affect the lawfulness of processing
          before withdrawal.
        </p>
      </Section>

      <Section title="4. Third parties who process your data">
        <p>To provide the features above, some of your data is sent to:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Google (Gemini API)</strong> &mdash; uploaded document images and
            spoken registration transcripts are sent to Google&apos;s servers to extract
            text and structured fields. This may involve transfer outside India.
          </li>
          <li>
            <strong>Sarvam AI</strong> &mdash; audio you record for &quot;Fill by
            voice&quot; is sent to Sarvam&apos;s speech-to-text API.
          </li>
        </ul>
        <p className="mt-2">
          We do not sell your data. We do not share it with any other third party except
          as required by law.
        </p>
      </Section>

      <Section title="5. How your data is protected">
        <ul className="list-disc pl-5">
          <li>Passwords and your access OTP are stored as irreversible cryptographic hashes, never in plain text.</li>
          <li>All traffic to this application is encrypted in transit (HTTPS) in production.</li>
          <li>A doctor can only view your full medical summary after you share your OTP with them, and every such access is logged and visible to you (see Section 8).</li>
          <li>Access to the administrative and doctor tools is restricted to authenticated staff/doctor accounts.</li>
        </ul>
      </Section>

      <Section title="6. How long we keep your data">
        <p>
          We retain your data for as long as your account is active, or as required by
          applicable law (including medical record-keeping requirements), whichever is
          longer. You can request deletion at any time as described below.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>As a Data Principal under the DPDPA, you have the right to:</p>
        <ul className="list-disc pl-5">
          <li>Access a summary of the personal data we hold about you (via your Dashboard).</li>
          <li>Correct or update inaccurate or incomplete data (via &quot;Edit Profile&quot;).</li>
          <li>Erase your data by deleting your account (available on your Dashboard), except where retention is legally required.</li>
          <li>Withdraw consent at any time, with the same ease with which it was given.</li>
          <li>Nominate another individual to exercise these rights on your behalf in the event of death or incapacity.</li>
          <li>Lodge a grievance with us, and if unresolved, with the Data Protection Board of India.</li>
        </ul>
      </Section>

      <Section title="8. Transparency: who has viewed your records">
        <p>
          Every time a doctor enters your OTP to view your medical summary, we log it.
          You can see the full history of who accessed your records and when from your
          Dashboard at any time.
        </p>
      </Section>

      <Section title="9. Data breach notification">
        <p>
          In the event of a personal data breach, we will notify the Data Protection
          Board of India and affected users as required under the DPDPA.
          <em> (Sample text: this prototype does not yet have an automated breach
          detection or notification system in place.)</em>
        </p>
      </Section>

      <Section title="10. Grievance Officer">
        <p>
          For any questions or complaints about how your data is handled, contact our
          Grievance Officer:
        </p>
        <p className="mt-2">
          <em>
            [Sample placeholder &mdash; replace with a real name, designation, and
            contact email/phone before production use.]
          </em>
          <br />
          Grievance Officer, Medikiosk
          <br />
          Email: privacy@example.com
        </p>
      </Section>

      <Section title="11. Children's data">
        <p>
          If a patient is under 18 years of age, we require verifiable consent from
          their parent or legal guardian at the time of registration, and do not use
          such a minor&apos;s data for tracking, behavioral monitoring, or targeted
          advertising.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-2 p-4 text-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-[var(--muted)]">{children}</div>
    </section>
  );
}
