from django.conf import settings
from django.db import models

from patients.models import Patient


class TriageStaff(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="triage_staff"
    )
    full_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class CheckIn(models.Model):
    """A patient's check-in for today's OPD visit: their stated symptoms,
    screened by AI for emergency red flags, and the resulting queue entry."""

    STATUS_CHOICES = [
        ("WAITING", "Waiting"),
        ("PRIORITY", "Priority"),
        ("IN_CONSULT", "In Consult"),
        ("COMPLETED", "Completed"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="check_ins")
    symptoms_text = models.TextField()

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="WAITING")
    is_emergency = models.BooleanField(default=False)
    red_flags = models.CharField(max_length=255, blank=True)
    ai_reasoning = models.TextField(blank=True)
    ai_error = models.TextField(blank=True)

    acknowledged_by = models.ForeignKey(
        TriageStaff, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_emergency", "created_at"]

    def __str__(self):
        return f"Check-in for {self.patient.full_name} at {self.created_at:%Y-%m-%d %H:%M}"
