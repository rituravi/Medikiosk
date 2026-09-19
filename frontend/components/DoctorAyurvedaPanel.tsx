"use client";

import { useEffect, useState } from "react";
import {
  doctorFetchAyurvedaAssessments,
  doctorFetchPrakriti,
  doctorFinalizeAyurvedaAssessment,
  doctorFinalizePrakriti,
  type AyurvedaAssessment,
  type AyurvedaAssessmentClinical,
  type DoctorPatient,
  type DoshaType,
  type PrakritiProfile,
} from "@/lib/api";

const DOSHA_OPTIONS: { value: DoshaType; label: string }[] = [
  { value: "", label: "Select..." },
  { value: "VATA", label: "Vata" },
  { value: "PITTA", label: "Pitta" },
  { value: "KAPHA", label: "Kapha" },
  { value: "VATA_PITTA", label: "Vata-Pitta" },
  { value: "PITTA_KAPHA", label: "Pitta-Kapha" },
  { value: "VATA_KAPHA", label: "Vata-Kapha" },
  { value: "TRIDOSHA", label: "Tridosha (Sama)" },
];

const GRADE_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "PRAVARA", label: "Pravara (excellent)" },
  { value: "MADHYAMA", label: "Madhyama (moderate)" },
  { value: "AVARA", label: "Avara (poor)" },
];

const AGNI_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "SAMA", label: "Sama Agni (balanced)" },
  { value: "VISHAMA", label: "Vishama Agni (irregular)" },
  { value: "TIKSHNA", label: "Tikshna Agni (sharp)" },
  { value: "MANDA", label: "Manda Agni (weak)" },
];

const emptyClinical: AyurvedaAssessmentClinical = {
  vikriti_type: "",
  vikriti_notes: "",
  sara_grade: "",
  sara_notes: "",
  samhanana_grade: "",
  samhanana_notes: "",
  height_cm: null,
  weight_kg: null,
  pramana_assessment: "",
  pramana_notes: "",
  satmya_grade: "",
  satmya_notes: "",
  sattva_grade: "",
  sattva_notes: "",
  abhyavaharana_shakti: "",
  agni_type: "",
  ahara_shakti_notes: "",
  vyayama_shakti_grade: "",
  vyayama_shakti_notes: "",
};

export default function DoctorAyurvedaPanel({
  patient,
  otp,
  onBack,
}: {
  patient: DoctorPatient;
  otp: string;
  onBack: () => void;
}) {
  const [prakriti, setPrakriti] = useState<PrakritiProfile | null>(null);
  const [assessments, setAssessments] = useState<AyurvedaAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prakritiType, setPrakritiType] = useState<DoshaType>("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [savingPrakriti, setSavingPrakriti] = useState(false);

  const [activeAssessmentId, setActiveAssessmentId] = useState<number | "new" | null>(null);
  const [clinicalForm, setClinicalForm] = useState<AyurvedaAssessmentClinical>(emptyClinical);
  const [savingAssessment, setSavingAssessment] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      doctorFetchPrakriti(patient.id, otp),
      doctorFetchAyurvedaAssessments(patient.id, otp),
    ])
      .then(([prak, assess]) => {
        setPrakriti(prak);
        setPrakritiType(prak.prakriti_type);
        setClinicalNotes(prak.clinical_notes);
        setAssessments(assess);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [patient.id, otp]);

  async function handleFinalizePrakriti() {
    setSavingPrakriti(true);
    setError(null);
    try {
      const updated = await doctorFinalizePrakriti(patient.id, otp, {
        prakriti_type: prakritiType,
        clinical_notes: clinicalNotes,
      });
      setPrakriti(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize Prakriti.");
    } finally {
      setSavingPrakriti(false);
    }
  }

  function openClinicalForm(assessment?: AyurvedaAssessment) {
    setActiveAssessmentId(assessment ? assessment.id : "new");
    setClinicalForm(assessment ? { ...emptyClinical, ...assessment } : emptyClinical);
  }

  async function handleFinalizeAssessment() {
    setSavingAssessment(true);
    setError(null);
    try {
      const payload =
        activeAssessmentId === "new"
          ? clinicalForm
          : { ...clinicalForm, assessment_id: activeAssessmentId as number };
      await doctorFinalizeAyurvedaAssessment(patient.id, otp, payload);
      setActiveAssessmentId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize assessment.");
    } finally {
      setSavingAssessment(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ayurveda Consult — {patient.full_name}</h1>
        <button onClick={onBack} className="btn-secondary">
          Back to patient list
        </button>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <section className="card overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
          Prakriti (Constitution)
        </h2>
        <div className="flex flex-col gap-3 p-4 text-sm">
          {prakriti?.self_report_updated_at ? (
            <div className="grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
              <p>Body frame: {prakriti.body_frame || "—"}</p>
              <p>Skin type: {prakriti.skin_type || "—"}</p>
              <p>Hair type: {prakriti.hair_type || "—"}</p>
              <p>Appetite: {prakriti.appetite_pattern || "—"}</p>
              <p>Sleep pattern: {prakriti.sleep_pattern || "—"}</p>
              <p>Mental temperament: {prakriti.mental_temperament || "—"}</p>
              {prakriti.self_report_notes && (
                <p className="col-span-2">Notes: {prakriti.self_report_notes}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              Patient has not submitted a self-report yet.
            </p>
          )}

          {prakriti?.is_finalized ? (
            <p className="text-sm">
              Finalized as <strong>{prakriti.prakriti_type}</strong> by Dr.{" "}
              {prakriti.finalized_by_name}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <select
                className="input"
                value={prakritiType}
                onChange={(e) => setPrakritiType(e.target.value as DoshaType)}
              >
                {DOSHA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <textarea
                className="input"
                rows={2}
                placeholder="Clinical notes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
              <button
                onClick={handleFinalizePrakriti}
                disabled={savingPrakriti || !prakritiType}
                className="btn-primary self-start text-xs"
              >
                {savingPrakriti ? "Saving..." : "Finalize Prakriti"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
          OPD Visit Assessments
        </h2>
        <div className="flex flex-col divide-y divide-[var(--border)] px-4">
          {assessments.map((a) => (
            <div key={a.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{new Date(a.created_at).toLocaleDateString()}</p>
                <span className="text-xs text-[var(--muted)]">{a.status}</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
                <p>Diet: {a.diet_type || "—"}</p>
                <p>Sleep: {a.sleep_quality || "—"}</p>
                <p>Activity: {a.physical_activity_level || "—"}</p>
                <p>Stress: {a.occupation_stress_level || "—"}</p>
              </div>
              {a.status === "DRAFT" && activeAssessmentId !== a.id && (
                <button
                  onClick={() => openClinicalForm(a)}
                  className="mt-2 btn-secondary text-xs"
                >
                  Record Dashavidha Findings
                </button>
              )}
              {activeAssessmentId === a.id && (
                <ClinicalForm
                  form={clinicalForm}
                  setForm={setClinicalForm}
                  onSave={handleFinalizeAssessment}
                  onCancel={() => setActiveAssessmentId(null)}
                  saving={savingAssessment}
                />
              )}
            </div>
          ))}
          {assessments.length === 0 && (
            <p className="py-4 text-sm text-[var(--muted)]">
              Patient has not started a visit assessment yet.
            </p>
          )}
        </div>
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          {activeAssessmentId === "new" ? (
            <ClinicalForm
              form={clinicalForm}
              setForm={setClinicalForm}
              onSave={handleFinalizeAssessment}
              onCancel={() => setActiveAssessmentId(null)}
              saving={savingAssessment}
            />
          ) : (
            <button onClick={() => openClinicalForm()} className="btn-secondary text-xs">
              Record New Visit (no patient self-report)
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function ClinicalForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: AyurvedaAssessmentClinical;
  setForm: (updater: (prev: AyurvedaAssessmentClinical) => AyurvedaAssessmentClinical) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
      <ClinicalField label="Vikriti (current imbalance)">
        <select
          className="input"
          value={form.vikriti_type}
          onChange={(e) => setForm((p) => ({ ...p, vikriti_type: e.target.value as DoshaType }))}
        >
          {DOSHA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </ClinicalField>
      <ClinicalField label="Sara (tissue quality)">
        <GradeSelect value={form.sara_grade} onChange={(v) => setForm((p) => ({ ...p, sara_grade: v }))} />
      </ClinicalField>
      <ClinicalField label="Samhanana (body compactness)">
        <GradeSelect
          value={form.samhanana_grade}
          onChange={(v) => setForm((p) => ({ ...p, samhanana_grade: v }))}
        />
      </ClinicalField>
      <div className="flex gap-3">
        <ClinicalField label="Height (cm)">
          <input
            type="number"
            className="input"
            value={form.height_cm ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, height_cm: e.target.value ? Number(e.target.value) : null }))
            }
          />
        </ClinicalField>
        <ClinicalField label="Weight (kg)">
          <input
            type="number"
            className="input"
            value={form.weight_kg ?? ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, weight_kg: e.target.value ? Number(e.target.value) : null }))
            }
          />
        </ClinicalField>
      </div>
      <ClinicalField label="Pramana (proportion)">
        <select
          className="input"
          value={form.pramana_assessment}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              pramana_assessment: e.target.value as AyurvedaAssessmentClinical["pramana_assessment"],
            }))
          }
        >
          <option value="">Select...</option>
          <option value="ADEQUATE">Adequate proportion</option>
          <option value="INADEQUATE">Inadequate proportion</option>
        </select>
      </ClinicalField>
      <ClinicalField label="Satmya (suitability/adaptability)">
        <GradeSelect value={form.satmya_grade} onChange={(v) => setForm((p) => ({ ...p, satmya_grade: v }))} />
      </ClinicalField>
      <ClinicalField label="Sattva (mental strength)">
        <GradeSelect value={form.sattva_grade} onChange={(v) => setForm((p) => ({ ...p, sattva_grade: v }))} />
      </ClinicalField>
      <ClinicalField label="Abhyavaharana Shakti (food quantity tolerated)">
        <GradeSelect
          value={form.abhyavaharana_shakti}
          onChange={(v) => setForm((p) => ({ ...p, abhyavaharana_shakti: v }))}
        />
      </ClinicalField>
      <ClinicalField label="Agni (digestive strength)">
        <select
          className="input"
          value={form.agni_type}
          onChange={(e) =>
            setForm((p) => ({ ...p, agni_type: e.target.value as AyurvedaAssessmentClinical["agni_type"] }))
          }
        >
          {AGNI_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </ClinicalField>
      <ClinicalField label="Vyayama Shakti (exercise capacity)">
        <GradeSelect
          value={form.vyayama_shakti_grade}
          onChange={(v) => setForm((p) => ({ ...p, vyayama_shakti_grade: v }))}
        />
      </ClinicalField>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : "Finalize Visit"}
        </button>
        <button onClick={onCancel} className="text-xs underline">
          Cancel
        </button>
      </div>
    </div>
  );
}

function GradeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "" | "PRAVARA" | "MADHYAMA" | "AVARA") => void;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value as "" | "PRAVARA" | "MADHYAMA" | "AVARA")}
    >
      {GRADE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ClinicalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
