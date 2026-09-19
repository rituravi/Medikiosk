from rest_framework.generics import ListCreateAPIView, RetrieveDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from triage.models import CheckIn
from triage.screening import ScreeningError, screen_document_text

from .models import MedicalDocument
from .ocr import extract_text
from .serializers import MedicalDocumentSerializer

MIN_SCREENABLE_LENGTH = 20


class MedicalDocumentListCreateView(ListCreateAPIView):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return MedicalDocument.objects.filter(patient=self.request.user.patient)

    def perform_create(self, serializer):
        document = serializer.save(patient=self.request.user.patient)
        _run_ocr(document)


class MedicalDocumentDetailView(RetrieveDestroyAPIView):
    serializer_class = MedicalDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MedicalDocument.objects.filter(patient=self.request.user.patient)


def _run_ocr(document: MedicalDocument) -> None:
    document.ocr_status = "PROCESSING"
    document.save(update_fields=["ocr_status"])
    try:
        text = extract_text(document.file.path)
        document.extracted_text = text
        document.ocr_status = "DONE"
        document.ocr_error = ""
    except Exception as exc:  # noqa: BLE001
        document.ocr_status = "FAILED"
        document.ocr_error = str(exc)
    document.save(update_fields=["extracted_text", "ocr_status", "ocr_error"])

    if document.ocr_status == "DONE" and len(document.extracted_text.strip()) >= MIN_SCREENABLE_LENGTH:
        _run_emergency_screening(document)


def _run_emergency_screening(document: MedicalDocument) -> None:
    try:
        result = screen_document_text(
            document.extracted_text, document.get_document_type_display()
        )
    except ScreeningError:
        return

    if not result["is_emergency"]:
        return

    check_in = CheckIn.objects.create(
        patient=document.patient,
        symptoms_text=(
            f'Flagged from uploaded {document.get_document_type_display()} '
            f'"{document.title}"'
        ),
        status="PRIORITY",
        is_emergency=True,
        red_flags=",".join(result["red_flags"]),
        ai_reasoning=result["reasoning"],
    )
    document.is_emergency_flagged = True
    document.emergency_reasoning = result["reasoning"]
    document.triage_check_in = check_in
    document.save(update_fields=["is_emergency_flagged", "emergency_reasoning", "triage_check_in"])
