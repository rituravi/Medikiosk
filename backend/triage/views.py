from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CheckIn, TriageStaff
from .permissions import IsTriageStaff
from .screening import ScreeningError, screen_symptoms
from .serializers import (
    CheckInSerializer,
    CreateTriageStaffSerializer,
    QueueCheckInSerializer,
    TriageStaffSerializer,
)


def _run_screening(check_in: CheckIn) -> None:
    try:
        result = screen_symptoms(check_in.symptoms_text)
    except ScreeningError as exc:
        check_in.ai_error = str(exc)
        check_in.save(update_fields=["ai_error"])
        return

    check_in.is_emergency = result["is_emergency"]
    check_in.red_flags = ",".join(result["red_flags"])
    check_in.ai_reasoning = result["reasoning"]
    if result["is_emergency"]:
        check_in.status = "PRIORITY"
    check_in.save(update_fields=["is_emergency", "red_flags", "ai_reasoning", "status"])


class CheckInCreateView(APIView):
    """A patient checks in for today's visit; their stated symptoms are
    immediately screened by AI for emergency red flags."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        symptoms_text = str(request.data.get("symptoms_text", "")).strip()
        if not symptoms_text:
            return Response(
                {"detail": "symptoms_text is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        check_in = CheckIn.objects.create(patient=patient, symptoms_text=symptoms_text)
        _run_screening(check_in)
        return Response(CheckInSerializer(check_in).data, status=status.HTTP_201_CREATED)


class MyCheckInsView(APIView):
    """A patient's own check-in history, most recent first."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        check_ins = CheckIn.objects.filter(patient=patient).order_by("-created_at")
        return Response(CheckInSerializer(check_ins, many=True).data)


class TriageQueueView(APIView):
    """The live queue for triage staff: emergencies first, then FIFO."""

    permission_classes = [IsTriageStaff]

    def get(self, request):
        queue = CheckIn.objects.exclude(status="COMPLETED").select_related(
            "patient", "acknowledged_by"
        )
        return Response(QueueCheckInSerializer(queue, many=True).data)


class TriageAcknowledgeView(APIView):
    """Triage staff acknowledges a queue entry (claims it)."""

    permission_classes = [IsTriageStaff]

    def post(self, request, check_in_id):
        check_in = get_object_or_404(CheckIn, pk=check_in_id)
        check_in.acknowledged_by = request.user.triage_staff
        check_in.acknowledged_at = timezone.now()
        if check_in.status == "WAITING":
            check_in.status = "IN_CONSULT"
        check_in.save(update_fields=["acknowledged_by", "acknowledged_at", "status"])
        return Response(QueueCheckInSerializer(check_in).data)


class TriageCompleteView(APIView):
    """Triage staff marks a queue entry as handled, removing it from the queue."""

    permission_classes = [IsTriageStaff]

    def post(self, request, check_in_id):
        check_in = get_object_or_404(CheckIn, pk=check_in_id)
        check_in.status = "COMPLETED"
        check_in.resolved_at = timezone.now()
        check_in.save(update_fields=["status", "resolved_at"])
        return Response(QueueCheckInSerializer(check_in).data)


class AdminTriageStaffView(APIView):
    """Admin creates and lists Triage Staff accounts."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = CreateTriageStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()
        return Response(TriageStaffSerializer(staff).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        staff = TriageStaff.objects.select_related("user").order_by("-created_at")
        return Response(TriageStaffSerializer(staff, many=True).data)
