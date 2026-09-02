from rest_framework.generics import ListCreateAPIView, RetrieveDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from .models import MedicalDocument
from .ocr import extract_text
from .serializers import MedicalDocumentSerializer


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
