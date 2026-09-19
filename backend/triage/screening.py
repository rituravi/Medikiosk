import json
import os

import requests

GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

RED_FLAG_CATEGORIES = [
    "CHEST_PAIN_WITH_BREATHLESSNESS",
    "STROKE_SIGNS",
    "SEVERE_BREATHING_DIFFICULTY",
    "SEVERE_BLEEDING",
    "ANAPHYLAXIS",
    "ALTERED_CONSCIOUSNESS",
    "SEIZURE",
    "SEVERE_HEAD_OR_SPINAL_TRAUMA",
    "SUICIDAL_OR_SELF_HARM_INTENT",
    "SEVERE_ABDOMINAL_PAIN",
    "HIGH_FEVER_WITH_STIFF_NECK",
    "OTHER_TIME_CRITICAL",
]

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "is_emergency": {"type": "BOOLEAN"},
        "red_flags": {
            "type": "ARRAY",
            "items": {"type": "STRING", "enum": RED_FLAG_CATEGORIES},
        },
        "reasoning": {"type": "STRING"},
    },
    "required": ["is_emergency", "red_flags", "reasoning"],
}

PROMPT_TEMPLATE = """You are a triage-support assistant at a hospital OPD reception kiosk. \
You are NOT diagnosing the patient — you are only deciding whether their stated symptoms \
could plausibly indicate a time-critical emergency that should be seen by staff \
immediately, ahead of the routine queue, rather than waiting their turn.

Flag as an emergency (is_emergency = true) if the description plausibly suggests any of:
- Chest pain together with breathlessness/shortness of breath
- Stroke signs (sudden facial drooping, arm/leg weakness, slurred or confused speech,
  sudden severe headache with vision/balance changes)
- Severe difficulty breathing, gasping, or blue lips/face
- Severe or uncontrolled bleeding
- Signs of a severe allergic reaction (anaphylaxis): facial/throat swelling, breathing
  trouble after exposure to a known trigger
- Loss of consciousness, unresponsiveness, or severe sudden confusion
- An active or just-occurred seizure
- Severe head injury or major trauma
- Expressed intent to harm themselves or someone else
- Severe abdominal pain, especially sudden onset or with rigidity
- High fever with stiff neck or severe light sensitivity
- Any other symptom combination you believe is genuinely time-critical

Because missing a real emergency is far worse than a false alarm, lean toward flagging \
when in real doubt about a plausibly serious combination of symptoms — but do not flag \
everyday, mild, or chronic complaints (e.g. a mild cold, routine follow-up, minor aches) \
just to be cautious. Only select red_flags categories that are actually supported by the \
text. Write a one-to-two sentence, plain-language reasoning a triage nurse can read in \
two seconds. Respond only with the requested JSON.

Patient's stated symptoms / reason for visit:
\"\"\"{symptoms_text}\"\"\"
"""


class ScreeningError(Exception):
    pass


def screen_symptoms(symptoms_text: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ScreeningError("GEMINI_API_KEY is not configured on the server.")

    payload = {
        "contents": [
            {"parts": [{"text": PROMPT_TEMPLATE.format(symptoms_text=symptoms_text)}]}
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
        },
    }

    last_error: Exception | None = None
    response = None
    for _ in range(2):
        try:
            response = requests.post(
                GEMINI_URL,
                params={"key": api_key},
                json=payload,
                timeout=30,
            )
            break
        except requests.RequestException as exc:
            last_error = exc
    else:
        raise ScreeningError(f"Could not reach Gemini API: {last_error}") from last_error

    if not response.ok:
        raise ScreeningError(f"Gemini API error ({response.status_code}): {response.text}")

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise ScreeningError(f"Unexpected Gemini response shape: {data}") from exc

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ScreeningError(f"Gemini did not return valid JSON: {text}") from exc

    return {
        "is_emergency": bool(parsed.get("is_emergency", False)),
        "red_flags": [f for f in parsed.get("red_flags", []) if f in RED_FLAG_CATEGORIES],
        "reasoning": str(parsed.get("reasoning", "")),
    }
