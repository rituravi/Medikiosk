from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from documents.models import MedicalDocument
from documents.serializers import MedicalDocumentSerializer

from .models import Patient
from .serializers import LoginSerializer, PatientSerializer, RegisterSerializer
from .voice import VoiceParseError, parse_transcript


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        token, _ = Token.objects.get_or_create(user=patient.user)
        return Response(
            {
                "token": token.key,
                "patient": PatientSerializer(patient).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        patient = getattr(user, "patient", None)
        return Response(
            {
                "token": token.key,
                "patient": PatientSerializer(patient).data if patient else None,
            }
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PatientSerializer(patient).data)


class ParseVoiceView(APIView):
    """Parse a spoken registration transcript into structured form fields."""

    permission_classes = [AllowAny]

    def post(self, request):
        transcript = request.data.get("transcript", "").strip()
        if not transcript:
            return Response(
                {"detail": "transcript is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fields = parse_transcript(transcript)
        except VoiceParseError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )

        return Response(fields)


class SummaryView(APIView):
    """Consolidated, date-sorted medical history for a doctor visit."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        descending = request.query_params.get("order", "desc") != "asc"

        timeline = [
            {
                "date": patient.created_at.isoformat(),
                "kind": "REGISTRATION",
                "title": "Clinical history recorded at registration",
                "document_type": None,
                "file_url": None,
                "extracted_text": None,
                "notes": None,
                "ocr_status": None,
            }
        ]

        documents = MedicalDocument.objects.filter(patient=patient)
        for doc in documents:
            serialized = MedicalDocumentSerializer(doc, context={"request": request}).data
            timeline.append(
                {
                    "date": doc.uploaded_at.isoformat(),
                    "kind": "DOCUMENT",
                    "title": doc.title,
                    "document_type": doc.document_type,
                    "file_url": serialized["file_url"],
                    "extracted_text": doc.extracted_text,
                    "notes": doc.notes,
                    "ocr_status": doc.ocr_status,
                }
            )

        timeline.sort(key=lambda entry: entry["date"], reverse=descending)

        return Response(
            {
                "patient": PatientSerializer(patient).data,
                "timeline": timeline,
            }
        )
