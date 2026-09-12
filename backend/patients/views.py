from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from documents.models import MedicalDocument
from documents.serializers import MedicalDocumentSerializer

from .models import Patient
from .serializers import (
    AdminPatientSerializer,
    LoginSerializer,
    PatientSerializer,
    RegisterSerializer,
)
from .transcribe import TranscribeError, transcribe_audio
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

        if user.is_staff:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "role": "admin", "patient": None})

        patient = getattr(user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "This account has no patient profile."},
                status=status.HTTP_403_FORBIDDEN,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "role": "patient",
                "patient": PatientSerializer(patient).data,
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


class TranscribeVoiceView(APIView):
    """Transcribe recorded audio into text using Sarvam's speech-to-text API."""

    permission_classes = [AllowAny]

    def post(self, request):
        audio_file = request.FILES.get("audio")
        if audio_file is None:
            return Response(
                {"detail": "audio file is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        language = request.data.get("language", "en-US")

        try:
            transcript = transcribe_audio(audio_file.read(), audio_file.name, language)
        except TranscribeError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )

        return Response({"transcript": transcript})


class AdminUserListView(APIView):
    """List all patient accounts for admin management."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        patients = Patient.objects.select_related("user").order_by("-created_at")
        return Response(AdminPatientSerializer(patients, many=True).data)


class AdminResetPasswordView(APIView):
    """Reset a patient's password on their behalf."""

    permission_classes = [IsAdminUser]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        new_password = request.data.get("new_password", "")

        try:
            validate_password(new_password, user=patient.user)
        except DjangoValidationError as exc:
            return Response({"detail": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        patient.user.set_password(new_password)
        patient.user.save()
        Token.objects.filter(user=patient.user).delete()
        return Response({"detail": "Password reset."})


class AdminToggleActiveView(APIView):
    """Activate or deactivate a patient's account."""

    permission_classes = [IsAdminUser]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        patient.user.is_active = not patient.user.is_active
        patient.user.save()
        if not patient.user.is_active:
            Token.objects.filter(user=patient.user).delete()
        return Response({"is_active": patient.user.is_active})


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
