"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  fetchMe,
  fetchMyCheckIns,
  submitCheckIn,
  transcribeAudio,
  type CheckIn,
  type Patient,
} from "@/lib/api";

export default function CheckInPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [symptoms, setSymptoms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckIn | null>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function loadAll() {
    setLoading(true);
    Promise.all([fetchMe(), fetchMyCheckIns()])
      .then(([p, h]) => {
        setPatient(p);
        setHistory(h);
      })
      .catch(() => setError("Please log in to check in."))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob, "en-US");
          setSymptoms((prev) => (prev ? `${prev} ${text}` : text).trim());
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not transcribe audio.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Could not access the microphone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please describe your symptoms or reason for visit.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const checkIn = await submitCheckIn(symptoms);
      setResult(checkIn);
      setSymptoms("");
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;

  if (error && !patient) {
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
    <AppShell patientName={patient?.full_name}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">OPD Check-In</p>
          <h1 className="text-2xl font-semibold">What brings you in today?</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Describe your current symptoms. If they suggest a medical emergency, staff
            will be alerted immediately instead of you waiting in the routine queue.
          </p>
        </header>

        {result && (
          <div
            className="card p-4 text-sm"
            style={
              result.is_emergency
                ? { background: "#fee2e2", border: "1px solid #fca5a5" }
                : { background: "var(--background)" }
            }
          >
            {result.is_emergency ? (
              <>
                <p className="font-semibold" style={{ color: "#b91c1c" }}>
                  Your symptoms have been flagged as urgent.
                </p>
                <p className="mt-1" style={{ color: "#b91c1c" }}>
                  Please inform a staff member immediately — you do not need to wait in
                  the routine queue.
                </p>
              </>
            ) : (
              <p>
                You&apos;re checked in and in the queue. Please have a seat — you&apos;ll
                be called when it&apos;s your turn.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Symptoms / reason for visit</span>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={recording ? "btn-secondary text-xs" : "btn-secondary text-xs"}
            >
              {recording ? "Stop recording" : transcribing ? "Transcribing..." : "Speak instead"}
            </button>
          </div>
          <textarea
            className="input"
            rows={4}
            placeholder="e.g. I've had a headache and mild fever since yesterday..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary self-start">
            {submitting ? "Checking in..." : "Check In"}
          </button>
        </form>

        {history.length > 0 && (
          <section className="card overflow-hidden">
            <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
              Your Check-In History
            </h2>
            <div className="flex flex-col divide-y divide-[var(--border)] px-4">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p>{h.symptoms_text}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="badge shrink-0"
                    style={
                      h.is_emergency
                        ? { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }
                        : { background: "var(--background)", border: "1px solid var(--border)" }
                    }
                  >
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
