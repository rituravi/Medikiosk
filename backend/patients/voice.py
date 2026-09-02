import os

import requests

GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

FIELDS = [
    "full_name",
    "date_of_birth",
    "gender",
    "phone_number",
    "address",
    "blood_group",
    "allergies",
    "chronic_conditions",
    "current_medications",
    "past_surgeries",
    "family_history",
]

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "full_name": {"type": "STRING"},
        "date_of_birth": {
            "type": "STRING",
            "description": "ISO 8601 date, YYYY-MM-DD. Empty string if not mentioned.",
        },
        "gender": {"type": "STRING", "enum": ["M", "F", "O", "UNKNOWN"]},
        "phone_number": {"type": "STRING"},
        "address": {"type": "STRING"},
        "blood_group": {
            "type": "STRING",
            "enum": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"],
        },
        "allergies": {"type": "STRING"},
        "chronic_conditions": {"type": "STRING"},
        "current_medications": {"type": "STRING"},
        "past_surgeries": {"type": "STRING"},
        "family_history": {"type": "STRING"},
    },
}

PROMPT_TEMPLATE = """You are filling out a patient registration form from a spoken \
transcript. The transcript may be in English, Hindi, or a mix of both (Hinglish). \
Extract only what is explicitly said; leave a field as an empty string (or "UNKNOWN" \
for blood_group) if it isn't mentioned. Do not guess or invent values. Convert any \
spoken date of birth into YYYY-MM-DD format. Map gender to "M", "F", or "O". \
Translate all extracted values into English for the output fields, regardless of the \
language of the transcript.

Transcript:
\"\"\"{transcript}\"\"\"
"""


class VoiceParseError(Exception):
    pass


def parse_transcript(transcript: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise VoiceParseError("GEMINI_API_KEY is not configured on the server.")

    payload = {
        "contents": [
            {"parts": [{"text": PROMPT_TEMPLATE.format(transcript=transcript)}]}
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
        },
    }

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = requests.post(
                GEMINI_URL,
                params={"key": api_key},
                json=payload,
                timeout=45,
            )
            break
        except requests.RequestException as exc:
            last_error = exc
    else:
        raise VoiceParseError(f"Could not reach Gemini API: {last_error}") from last_error

    if not response.ok:
        raise VoiceParseError(f"Gemini API error ({response.status_code}): {response.text}")

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise VoiceParseError(f"Unexpected Gemini response shape: {data}") from exc

    import json

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise VoiceParseError(f"Gemini did not return valid JSON: {text}") from exc

    result = {field: parsed.get(field, "") for field in FIELDS}
    if result.get("gender") == "UNKNOWN":
        result["gender"] = ""
    return result
