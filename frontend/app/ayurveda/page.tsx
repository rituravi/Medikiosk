"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  createMyAyurvedaAssessment,
  fetchMe,
  fetchMyAyurvedaAssessments,
  fetchPrakriti,
  updateMyAyurvedaAssessment,
  updatePrakritiSelfReport,
  type AharaVihara,
  type AyurvedaAssessment,
  type Patient,
  type PrakritiProfile,
  type PrakritiSelfReport,
  type SingleDosha,
} from "@/lib/api";

const DOSHA_OPTIONS: { value: SingleDosha; label: string }[] = [
  { value: "", label: "Select..." },
  { value: "VATA", label: "Vata" },
  { value: "PITTA", label: "Pitta" },
  { value: "KAPHA", label: "Kapha" },
];

const PRAKRITI_TRAITS: {
  key: keyof PrakritiSelfReport;
  label: string;
  hint: string;
}[] = [
  { key: "body_frame", label: "Body frame", hint: "Thin/light = Vata, Medium/muscular = Pitta, Heavy/broad = Kapha" },
  { key: "skin_type", label: "Skin type", hint: "Dry/rough = Vata, Warm/sensitive = Pitta, Oily/smooth = Kapha" },
  { key: "hair_type", label: "Hair type", hint: "Dry/thin = Vata, Fine/early greying = Pitta, Thick/oily = Kapha" },
  { key: "appetite_pattern", label: "Appetite", hint: "Variable = Vata, Strong/sharp = Pitta, Slow/steady = Kapha" },
  { key: "sleep_pattern", label: "Sleep pattern", hint: "Light/disturbed = Vata, Moderate = Pitta, Deep/heavy = Kapha" },
  { key: "mental_temperament", label: "Mental temperament", hint: "Anxious/quick = Vata, Focused/intense = Pitta, Calm/steady = Kapha" },
];

const emptyAharaVihara: AharaVihara = {
  diet_type: "",
  meal_pattern: "",
  water_intake: "",
  taste_preferences: "",
  sleep_duration_hours: null,
  sleep_quality: "",
  bowel_habits: "",
  physical_activity_level: "",
  addictions: "",
  occupation_stress_level: "",
  ahara_vihara_notes: "",
};

const RASA_OPTIONS = ["SWEET", "SOUR", "SALTY", "PUNGENT", "BITTER", "ASTRINGENT"];

export default function AyurvedaPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prakriti, setPrakriti] = useState<PrakritiProfile | null>(null);
  const [assessments, setAssessments] = useState<AyurvedaAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prakritiForm, setPrakritiForm] = useState<PrakritiSelfReport | null>(null);
  const [savingPrakriti, setSavingPrakriti] = useState(false);
  const [prakritiSuccess, setPrakritiSuccess] = useState(false);

  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState<AharaVihara>(emptyAharaVihara);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([fetchMe(), fetchPrakriti(), fetchMyAyurvedaAssessments()])
      .then(([p, prak, assess]) => {
        setPatient(p);
        setPrakriti(prak);
        setPrakritiForm({
          body_frame: prak.body_frame,
          skin_type: prak.skin_type,
          hair_type: prak.hair_type,
          appetite_pattern: prak.appetite_pattern,
          sleep_pattern: prak.sleep_pattern,
          mental_temperament: prak.mental_temperament,
          self_report_notes: prak.self_report_notes,
        });
        setAssessments(assess);
      })
      .catch(() => setError("Please log in to view your Ayurvedic assessment."))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  async function handlePrakritiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prakritiForm) return;
    setSavingPrakriti(true);
    setPrakritiSuccess(false);
    try {
      const updated = await updatePrakritiSelfReport(prakritiForm);
      setPrakriti(updated);
      setPrakritiSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Prakriti self-report.");
    } finally {
      setSavingPrakriti(false);
    }
  }

  async function handleNewAssessmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingAssessment(true);
    try {
      const created = await createMyAyurvedaAssessment(newAssessment);
      setAssessments((prev) => [created, ...prev]);
      setShowNewAssessment(false);
      setNewAssessment(emptyAharaVihara);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save assessment.");
    } finally {
      setSubmittingAssessment(false);
    }
  }

  function toggleRasa(rasa: string) {
    const current = newAssessment.taste_preferences
      ? newAssessment.taste_preferences.split(",")
      : [];
    const next = current.includes(rasa)
      ? current.filter((r) => r !== rasa)
      : [...current, rasa];
    setNewAssessment((prev) => ({ ...prev, taste_preferences: next.join(",") }));
  }

  if (loading) return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;

  if (error || !patient || !prakriti || !prakritiForm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <AppShell patientName={patient.full_name}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">Ayurvedic OPD</p>
          <h1 className="text-2xl font-semibold">Dashavidha Pariksha &amp; Ahara-Vihara</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your constitution (Prakriti) is recorded once. Diet and lifestyle
            (Ahara-Vihara) are recorded fresh at each Ayurvedic OPD visit and reviewed by
            your vaidya.
          </p>
        </header>

        <section className="card overflow-hidden">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            My Constitution (Prakriti)
          </h2>
          <div className="flex flex-col gap-4 p-4">
            {prakriti.is_finalized ? (
              <div className="flex flex-col gap-2 text-sm">
                <p className="font-medium">
                  Finalized Prakriti: {doshaLabel(prakriti.prakriti_type)}
                </p>
                {prakriti.clinical_notes && (
                  <p className="text-[var(--muted)]">{prakriti.clinical_notes}</p>
                )}
                <p className="text-xs text-[var(--muted)]">
                  Confirmed by Dr. {prakriti.finalized_by_name} on{" "}
                  {prakriti.finalized_at && new Date(prakriti.finalized_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrakritiSubmit} className="flex flex-col gap-4">
                <p className="text-sm text-[var(--muted)]">
                  Answer based on your natural, lifelong tendencies (not how you feel
                  today). Your vaidya will confirm the final Prakriti at your next visit.
                </p>
                {PRAKRITI_TRAITS.map((trait) => (
                  <label key={trait.key} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">{trait.label}</span>
                    <span className="text-xs text-[var(--muted)]">{trait.hint}</span>
                    <select
                      className="input"
                      value={prakritiForm[trait.key] as string}
                      onChange={(e) =>
                        setPrakritiForm((prev) =>
                          prev ? { ...prev, [trait.key]: e.target.value as SingleDosha } : prev,
                        )
                      }
                    >
                      {DOSHA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Additional notes</span>
                  <textarea
                    className="input"
                    rows={2}
                    value={prakritiForm.self_report_notes}
                    onChange={(e) =>
                      setPrakritiForm((prev) =>
                        prev ? { ...prev, self_report_notes: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                {prakritiSuccess && (
                  <p className="text-sm" style={{ color: "var(--primary)" }}>
                    Saved. Your vaidya will review this at your next OPD visit.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingPrakriti}
                  className="btn-primary self-start"
                >
                  {savingPrakriti ? "Saving..." : "Save Prakriti self-report"}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">OPD Visit Assessments</h2>
            {!showNewAssessment && (
              <button onClick={() => setShowNewAssessment(true)} className="btn-secondary text-xs">
                Start New Visit Assessment
              </button>
            )}
          </div>

          {showNewAssessment && (
            <form
              onSubmit={handleNewAssessmentSubmit}
              className="flex flex-col gap-4 border-b border-[var(--border)] p-4"
            >
              <p className="text-sm text-[var(--muted)]">
                Fill in your current diet and lifestyle (Ahara-Vihara). Your vaidya will
                complete the clinical examination (Vikriti, Sara, Sattva, etc.) during your
                visit.
              </p>
              <Field label="Diet type">
                <select
                  className="input"
                  value={newAssessment.diet_type}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, diet_type: e.target.value as AharaVihara["diet_type"] }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="EGGETARIAN">Eggetarian</option>
                  <option value="NON_VEGETARIAN">Non-vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                </select>
              </Field>
              <Field label="Meal pattern">
                <select
                  className="input"
                  value={newAssessment.meal_pattern}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, meal_pattern: e.target.value as AharaVihara["meal_pattern"] }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="REGULAR">Regular meal timing</option>
                  <option value="IRREGULAR">Irregular meal timing</option>
                  <option value="FREQUENT_SNACKING">Frequent snacking</option>
                </select>
              </Field>
              <Field label="Water intake">
                <select
                  className="input"
                  value={newAssessment.water_intake}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, water_intake: e.target.value as AharaVihara["water_intake"] }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="LOW">Low</option>
                  <option value="ADEQUATE">Adequate</option>
                  <option value="EXCESSIVE">Excessive</option>
                </select>
              </Field>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Taste preferences (Rasa)</span>
                <div className="flex flex-wrap gap-3">
                  {RASA_OPTIONS.map((rasa) => (
                    <label key={rasa} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={newAssessment.taste_preferences.split(",").includes(rasa)}
                        onChange={() => toggleRasa(rasa)}
                      />
                      {rasa.charAt(0) + rasa.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Average sleep duration (hours)">
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  value={newAssessment.sleep_duration_hours ?? ""}
                  onChange={(e) =>
                    setNewAssessment((p) => ({
                      ...p,
                      sleep_duration_hours: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </Field>
              <Field label="Sleep quality">
                <select
                  className="input"
                  value={newAssessment.sleep_quality}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, sleep_quality: e.target.value as AharaVihara["sleep_quality"] }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="SOUND">Sound</option>
                  <option value="DISTURBED">Disturbed</option>
                  <option value="INSOMNIA">Insomnia</option>
                </select>
              </Field>
              <Field label="Bowel habits">
                <select
                  className="input"
                  value={newAssessment.bowel_habits}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, bowel_habits: e.target.value as AharaVihara["bowel_habits"] }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="REGULAR">Regular</option>
                  <option value="IRREGULAR">Irregular</option>
                  <option value="CONSTIPATED">Constipated</option>
                  <option value="LOOSE">Loose</option>
                </select>
              </Field>
              <Field label="Physical activity level">
                <select
                  className="input"
                  value={newAssessment.physical_activity_level}
                  onChange={(e) =>
                    setNewAssessment((p) => ({
                      ...p,
                      physical_activity_level: e.target.value as AharaVihara["physical_activity_level"],
                    }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="ACTIVE">Active</option>
                  <option value="VERY_ACTIVE">Very active</option>
                </select>
              </Field>
              <Field label="Occupation stress level">
                <select
                  className="input"
                  value={newAssessment.occupation_stress_level}
                  onChange={(e) =>
                    setNewAssessment((p) => ({
                      ...p,
                      occupation_stress_level: e.target.value as AharaVihara["occupation_stress_level"],
                    }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                </select>
              </Field>
              <Field label="Addictions / substance use">
                <textarea
                  className="input"
                  rows={2}
                  value={newAssessment.addictions}
                  onChange={(e) => setNewAssessment((p) => ({ ...p, addictions: e.target.value }))}
                />
              </Field>
              <Field label="Additional notes">
                <textarea
                  className="input"
                  rows={2}
                  value={newAssessment.ahara_vihara_notes}
                  onChange={(e) =>
                    setNewAssessment((p) => ({ ...p, ahara_vihara_notes: e.target.value }))
                  }
                />
              </Field>
              <div className="flex gap-3">
                <button type="submit" disabled={submittingAssessment} className="btn-primary">
                  {submittingAssessment ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAssessment(false)}
                  className="text-sm underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col divide-y divide-[var(--border)] px-4">
            {assessments.length === 0 && (
              <p className="py-4 text-sm text-[var(--muted)]">No visit assessments yet.</p>
            )}
            {assessments.map((a) => (
              <AssessmentRow key={a.id} assessment={a} onUpdated={loadAll} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AssessmentRow({
  assessment,
  onUpdated,
}: {
  assessment: AyurvedaAssessment;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AharaVihara>(assessment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateMyAyurvedaAssessment(assessment.id, form);
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">{new Date(assessment.created_at).toLocaleDateString()}</p>
        <span
          className="badge"
          style={{
            background: assessment.status === "FINALIZED" ? "var(--background)" : "#fef3c7",
            color: assessment.status === "FINALIZED" ? "var(--primary)" : "#92400e",
            border: "1px solid var(--border)",
          }}
        >
          {assessment.status === "FINALIZED" ? "Reviewed by vaidya" : "Awaiting vaidya review"}
        </span>
      </div>

      {assessment.status === "DRAFT" && !editing && (
        <button onClick={() => setEditing(true)} className="mt-2 text-xs underline">
          Edit
        </button>
      )}

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="input"
            rows={2}
            placeholder="Additional notes"
            value={form.ahara_vihara_notes}
            onChange={(e) => setForm((p) => ({ ...p, ahara_vihara_notes: e.target.value }))}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs underline">
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        </div>
      ) : (
        assessment.status === "FINALIZED" && (
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
            {assessment.vikriti_type && <p>Vikriti: {doshaLabel(assessment.vikriti_type)}</p>}
            {assessment.sara_grade && <p>Sara: {assessment.sara_grade}</p>}
            {assessment.samhanana_grade && <p>Samhanana: {assessment.samhanana_grade}</p>}
            {assessment.satmya_grade && <p>Satmya: {assessment.satmya_grade}</p>}
            {assessment.sattva_grade && <p>Sattva: {assessment.sattva_grade}</p>}
            {assessment.agni_type && <p>Agni: {assessment.agni_type}</p>}
            {assessment.vyayama_shakti_grade && (
              <p>Vyayama Shakti: {assessment.vyayama_shakti_grade}</p>
            )}
            <p>Vaya: {assessment.vaya}</p>
          </div>
        )
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function doshaLabel(value: string) {
  return value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join("-");
}
