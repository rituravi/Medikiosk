"use client";

import { useEffect, useRef, useState } from "react";
import { parseVoiceTranscript, type VoiceParsedFields } from "@/lib/api";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
];

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceFill({
  onParsed,
}: {
  onParsed: (fields: VoiceParsedFields) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("en-US");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  function startListening() {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

    setError(null);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript + " ";
      }
      if (finalText) {
        setTranscript((prev) => (prev + " " + finalText).trim());
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
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
          {supported && (
            <select
              className="input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={listening}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
          {supported ? (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={listening ? "btn-secondary" : "btn-primary"}
            >
              {listening ? "Stop recording" : "Start speaking"}
            </button>
          ) : (
            <span className="text-xs text-[var(--muted)]">
              Voice input isn&apos;t supported in this browser.
            </span>
          )}
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
