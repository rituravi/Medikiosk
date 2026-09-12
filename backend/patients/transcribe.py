import mimetypes
import os

import requests

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

LANGUAGE_CODE_MAP = {
    "en-US": "en-IN",
    "hi-IN": "hi-IN",
}


class TranscribeError(Exception):
    pass


def transcribe_audio(audio_bytes: bytes, filename: str, language: str) -> str:
    api_key = os.environ.get("SARVAM_API_KEY")
    if not api_key:
        raise TranscribeError("SARVAM_API_KEY is not configured on the server.")

    language_code = LANGUAGE_CODE_MAP.get(language, "en-IN")

    mime_type = mimetypes.guess_type(filename)[0] or "audio/webm"
    files = {"file": (filename, audio_bytes, mime_type)}
    data = {"model": "saaras:v3", "language_code": language_code}
    headers = {"api-subscription-key": api_key}

    last_error: Exception | None = None
    response = None
    for _ in range(2):
        try:
            response = requests.post(
                SARVAM_STT_URL,
                headers=headers,
                files=files,
                data=data,
                timeout=45,
            )
            break
        except requests.RequestException as exc:
            last_error = exc
    else:
        raise TranscribeError(f"Could not reach Sarvam API: {last_error}") from last_error

    if not response.ok:
        raise TranscribeError(f"Sarvam API error ({response.status_code}): {response.text}")

    result = response.json()
    transcript = result.get("transcript", "")
    if not isinstance(transcript, str):
        raise TranscribeError(f"Unexpected Sarvam response shape: {result}")

    return transcript.strip()
