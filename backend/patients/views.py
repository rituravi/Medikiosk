from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ayurveda.models import AyurvedaAssessment, PrakritiProfile
from ayurveda.serializers import PrakritiProfileSerializer
from documents.models import MedicalDocument
from documents.serializers import MedicalDocumentSerializer

from .models import AccessLog, Doctor, Patient
from .permissions import IsDoctor
from .serializers import (
    AccessLogSerializer,
    AdminPatientSerializer,
    CreateDoctorSerializer,
    DoctorPatientSerializer,
    DoctorSerializer,
    LoginSerializer,
    PatientSerializer,
    RegisterSerializer,
)
from .transcribe import TranscribeError, transcribe_audio
from .voice import VoiceParseError, parse_transcript


def build_patient_timeline(patient, request, descending=True):
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

    assessments = AyurvedaAssessment.objects.filter(patient=patient, status="FINALIZED")
    for assessment in assessments:
        timeline.append(
            {
                "date": assessment.finalized_at.isoformat(),
                "kind": "AYURVEDA_ASSESSMENT",
                "title": "Ayurvedic OPD Assessment (Dashavidha Pariksha)",
                "document_type": None,
                "file_url": None,
                "extracted_text": None,
                "notes": _summarize_ayurveda_assessment(assessment),
                "ocr_status": None,
            }
        )

    timeline.sort(key=lambda entry: entry["date"], reverse=descending)
    return timeline


def _summarize_ayurveda_assessment(assessment):
    parts = [f"Vaya: {assessment.vaya()}"]
    for label, value in [
        ("Vikriti", assessment.get_vikriti_type_display() if assessment.vikriti_type else None),
        ("Sara", assessment.get_sara_grade_display() if assessment.sara_grade else None),
        (
            "Samhanana",
            assessment.get_samhanana_grade_display() if assessment.samhanana_grade else None,
        ),
        ("Satmya", assessment.get_satmya_grade_display() if assessment.satmya_grade else None),
        ("Sattva", assessment.get_sattva_grade_display() if assessment.sattva_grade else None),
        (
            "Agni",
            assessment.get_agni_type_display() if assessment.agni_type else None,
        ),
        (
            "Vyayama Shakti",
            assessment.get_vyayama_shakti_grade_display()
            if assessment.vyayama_shakti_grade
            else None,
        ),
    ]:
        if value:
            parts.append(f"{label}: {value}")
    return " | ".join(parts)


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

        doctor = getattr(user, "doctor", None)
        if doctor is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "role": "doctor", "patient": None})

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

    def patch(self, request):
        """DPDPA right to correction: let a patient update their own profile."""
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        """DPDPA right to erasure: let a patient delete their own account."""
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        for doc in MedicalDocument.objects.filter(patient=patient):
            doc.file.delete(save=False)
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccessLogView(APIView):
    """DPDPA transparency: let a patient see who has viewed their summary."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        logs = AccessLog.objects.filter(patient=patient).select_related("doctor")
        return Response(AccessLogSerializer(logs, many=True).data)


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
        timeline = build_patient_timeline(patient, request, descending)
        prakriti, _ = PrakritiProfile.objects.get_or_create(patient=patient)

        return Response(
            {
                "patient": PatientSerializer(patient).data,
                "prakriti": PrakritiProfileSerializer(prakriti).data,
                "timeline": timeline,
            }
        )


class SetOtpView(APIView):
    """Let a patient set the access code a doctor must enter to view their summary."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        otp = str(request.data.get("otp", "")).strip()
        if not otp.isdigit() or not (4 <= len(otp) <= 6):
            return Response(
                {"detail": "OTP must be 4-6 digits."}, status=status.HTTP_400_BAD_REQUEST
            )

        patient.access_otp = make_password(otp)
        patient.save()
        return Response({"detail": "OTP updated."})


class AdminCreateDoctorView(APIView):
    """Create a doctor account."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = CreateDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = serializer.save()
        return Response(DoctorSerializer(doctor).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        doctors = Doctor.objects.select_related("user").order_by("-created_at")
        return Response(DoctorSerializer(doctors, many=True).data)


class DoctorPatientListView(APIView):
    """List all patients so a doctor can pick one."""

    permission_classes = [IsDoctor]

    def get(self, request):
        patients = Patient.objects.order_by("full_name")
        return Response(DoctorPatientSerializer(patients, many=True).data)


class DoctorPatientSummaryView(APIView):
    """Reveal a patient's summary to a doctor, gated by the patient's OTP."""

    permission_classes = [IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)

        if not patient.access_otp:
            return Response(
                {"detail": "This patient has not set an access OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = str(request.data.get("otp", "")).strip()
        if not check_password(otp, patient.access_otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_403_FORBIDDEN)

        AccessLog.objects.create(doctor=request.user.doctor, patient=patient)

        timeline = build_patient_timeline(patient, request, descending=True)
        prakriti, _ = PrakritiProfile.objects.get_or_create(patient=patient)
        return Response(
            {
                "patient": PatientSerializer(patient).data,
                "prakriti": PrakritiProfileSerializer(prakriti).data,
                "timeline": timeline,
            }
        )
