import base64
import io
import logging
import mimetypes
import os

import requests
from pypdf import PdfReader

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif", ".webp"}

GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

TRANSCRIBE_PROMPT = """You are transcribing a medical document (e.g. a prescription, lab \
report, or discharge summary) from a photo or scan. It may include handwritten text. \
Transcribe every piece of text you can make out as accurately as possible, preserving \
line breaks and layout where it helps readability. Include medicine names, dosages, \
dates, and any handwritten notes. If a word is genuinely illegible, write [illegible] \
in its place rather than guessing. Output only the transcribed text, no commentary."""


class OcrError(Exception):
    pass


def extract_text(file_path: str) -> str:
    """Extract text from an uploaded medical document (image or PDF)."""
    lower = file_path.lower()

    if lower.endswith(".pdf"):
        return _extract_from_pdf(file_path)

    if any(lower.endswith(ext) for ext in IMAGE_EXTENSIONS):
        with open(file_path, "rb") as f:
            return _transcribe_image_bytes(f.read(), file_path)

    raise ValueError(f"Unsupported file type for OCR: {file_path}")


def _extract_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text_parts = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(text_parts).strip()

    if text:
        return text

    # Scanned PDF with no embedded text layer: rasterize pages and transcribe each.
    from pdf2image import convert_from_path

    images = convert_from_path(file_path)
    parts = []
    for image in images:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        parts.append(_transcribe_image_bytes(buffer.getvalue(), "page.png"))
    return "\n\n".join(parts).strip()


def _transcribe_image_bytes(image_bytes: bytes, file_path_hint: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise OcrError("GEMINI_API_KEY is not configured on the server.")

    mime_type = mimetypes.guess_type(file_path_hint)[0] or "image/png"
    encoded = base64.b64encode(image_bytes).decode("ascii")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": TRANSCRIBE_PROMPT},
                    {"inlineData": {"mimeType": mime_type, "data": encoded}},
                ]
            }
        ],
    }

    last_error: Exception | None = None
    response = None
    for _ in range(2):
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
        raise OcrError(f"Could not reach Gemini API: {last_error}") from last_error

    if not response.ok:
        raise OcrError(f"Gemini API error ({response.status_code}): {response.text}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as exc:
        raise OcrError(f"Unexpected Gemini response shape: {data}") from exc
