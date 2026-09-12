"use client";

import { useRef, useState } from "react";
import { parseVoiceTranscript, transcribeAudio, type VoiceParsedFields } from "@/lib/api";

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
];

export default function VoiceFill({
  onParsed,
}: {
  onParsed: (fields: VoiceParsedFields) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en-US");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob, language);
          setTranscript((prev) => (prev ? `${prev} ${text}` : text).trim());
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

  async function handleFillForm() {
    if (!transcript.trim()) {
      setError("Say something first, or type it below.");
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const fields = await parseVoiceTranscript(transcript);
      onParsed(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse transcript.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Fill by voice</h2>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={recording}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing}
            className={recording ? "btn-secondary" : "btn-primary"}
          >
            {recording ? "Stop recording" : transcribing ? "Transcribing..." : "Start speaking"}
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Choose your language above, then speak naturally — e.g. &ldquo;My name is
        Sarah Johnson, born March 3rd 1988, allergic to peanuts...&rdquo; or
        &ldquo;मेरा नाम राज है, जन्म 15 जनवरी 1980, मुझे शुगर की बीमारी है...&rdquo; — then
        review and fill the form below. You can also type or edit the transcript directly.
      </p>

      <textarea
        className="input"
        rows={4}
        placeholder="Your spoken transcript will appear here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleFillForm}
          disabled={parsing}
          className="btn-secondary"
        >
          {parsing ? "Filling form..." : "Fill form from transcript"}
        </button>
        {transcript && (
          <button
            type="button"
            onClick={() => setTranscript("")}
            className="text-xs text-[var(--muted)] underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
