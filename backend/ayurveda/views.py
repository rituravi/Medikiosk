from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from patients.models import Patient
from patients.permissions import IsDoctor

from .models import AyurvedaAssessment, PrakritiProfile
from .serializers import (
    AHARA_VIHARA_FIELDS,
    AyurvedaAssessmentClinicalSerializer,
    AyurvedaAssessmentSerializer,
    PrakritiProfileSerializer,
)


def _require_patient(request):
    return getattr(request.user, "patient", None)


def _verify_otp(patient, otp):
    return bool(patient.access_otp) and check_password(otp, patient.access_otp)


class PrakritiMeView(APIView):
    """A patient's own Prakriti profile: viewable always, self-report editable
    only until a vaidya has finalized it."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = _require_patient(request)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile, _ = PrakritiProfile.objects.get_or_create(patient=patient)
        return Response(PrakritiProfileSerializer(profile).data)

    def patch(self, request):
        patient = _require_patient(request)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile, _ = PrakritiProfile.objects.get_or_create(patient=patient)
        if profile.finalized_at is not None:
            return Response(
                {"detail": "Your Prakriti has already been finalized by a vaidya."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = PrakritiProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(self_report_updated_at=timezone.now())
        return Response(serializer.data)


class AyurvedaAssessmentMeListCreateView(APIView):
    """A patient's own Ayurveda assessments: past visits (list) and a new
    draft with their Ahara-Vihara self-report (create)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = _require_patient(request)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        assessments = AyurvedaAssessment.objects.filter(patient=patient)
        return Response(AyurvedaAssessmentSerializer(assessments, many=True).data)

    def post(self, request):
        patient = _require_patient(request)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = {k: v for k, v in request.data.items() if k in AHARA_VIHARA_FIELDS}
        serializer = AyurvedaAssessmentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        assessment = serializer.save(patient=patient)
        return Response(
            AyurvedaAssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED
        )


class AyurvedaAssessmentMeDetailView(APIView):
    """Let a patient edit their own Ahara-Vihara answers while still a draft."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, assessment_id):
        patient = _require_patient(request)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        assessment = get_object_or_404(AyurvedaAssessment, pk=assessment_id, patient=patient)
        if assessment.status != "DRAFT":
            return Response(
                {"detail": "This assessment has already been finalized by a vaidya."},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = {k: v for k, v in request.data.items() if k in AHARA_VIHARA_FIELDS}
        serializer = AyurvedaAssessmentSerializer(assessment, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DoctorPrakritiView(APIView):
    """A vaidya views a patient's Prakriti (self-report) and, when ready,
    finalizes the overall Prakriti type. Gated by the patient's OTP."""

    permission_classes = [IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        otp = str(request.data.get("otp", "")).strip()
        if not _verify_otp(patient, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = PrakritiProfile.objects.get_or_create(patient=patient)

        prakriti_type = request.data.get("prakriti_type")
        clinical_notes = request.data.get("clinical_notes")
        if prakriti_type is not None or clinical_notes is not None:
            if prakriti_type is not None:
                profile.prakriti_type = prakriti_type
            if clinical_notes is not None:
                profile.clinical_notes = clinical_notes
            profile.finalized_by = request.user.doctor
            profile.finalized_at = timezone.now()
            profile.save()

        return Response(PrakritiProfileSerializer(profile).data)


class DoctorAyurvedaAssessmentListView(APIView):
    """A vaidya lists a patient's assessment history. Gated by the patient's OTP."""

    permission_classes = [IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        otp = str(request.data.get("otp", "")).strip()
        if not _verify_otp(patient, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_403_FORBIDDEN)

        assessments = AyurvedaAssessment.objects.filter(patient=patient)
        return Response(AyurvedaAssessmentSerializer(assessments, many=True).data)


class DoctorAyurvedaAssessmentFinalizeView(APIView):
    """A vaidya records the Dashavidha clinical findings for a visit and
    finalizes it — either on an existing patient-started draft, or a brand
    new assessment if the patient hasn't started one. Gated by the OTP."""

    permission_classes = [IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        otp = str(request.data.get("otp", "")).strip()
        if not _verify_otp(patient, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_403_FORBIDDEN)

        assessment_id = request.data.get("assessment_id")
        if assessment_id:
            assessment = get_object_or_404(
                AyurvedaAssessment, pk=assessment_id, patient=patient
            )
        else:
            assessment = AyurvedaAssessment.objects.create(patient=patient)

        serializer = AyurvedaAssessmentClinicalSerializer(
            assessment, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(
            status="FINALIZED",
            finalized_by=request.user.doctor,
            finalized_at=timezone.now(),
        )
        return Response(serializer.data)
