import logging

import pytesseract
from PIL import Image
from pypdf import PdfReader

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"}


def extract_text(file_path: str) -> str:
    """Extract text from an uploaded medical document (image or PDF)."""
    lower = file_path.lower()

    if lower.endswith(".pdf"):
        return _extract_from_pdf(file_path)

    if any(lower.endswith(ext) for ext in IMAGE_EXTENSIONS):
        return _extract_from_image(file_path)

    raise ValueError(f"Unsupported file type for OCR: {file_path}")


def _extract_from_image(file_path: str) -> str:
    image = Image.open(file_path)
    return pytesseract.image_to_string(image).strip()


def _extract_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text_parts = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(text_parts).strip()

    if text:
        return text

    # Scanned PDF with no embedded text layer: fall back to rasterizing + OCR.
    from pdf2image import convert_from_path

    images = convert_from_path(file_path)
    ocr_parts = [pytesseract.image_to_string(image) for image in images]
    return "\n".join(ocr_parts).strip()
