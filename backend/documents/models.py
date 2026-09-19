from django.db import models

from patients.models import Patient


def patient_document_path(instance, filename):
    return f"patient_documents/{instance.patient_id}/{filename}"


class MedicalDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("PRESCRIPTION", "Prescription"),
        ("LAB_REPORT", "Lab Report"),
        ("DISCHARGE_SUMMARY", "Discharge Summary"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("DONE", "Done"),
        ("FAILED", "Failed"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="documents"
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to=patient_document_path)
    notes = models.TextField(blank=True)

    extracted_text = models.TextField(blank=True)
    ocr_status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="PENDING"
    )
    ocr_error = models.TextField(blank=True)

    # Set if the extracted text was screened and appears to describe a current
    # emergency; a linked triage.CheckIn is created so it surfaces in the live
    # queue exactly like a patient-reported check-in would.
    is_emergency_flagged = models.BooleanField(default=False)
    emergency_reasoning = models.TextField(blank=True)
    triage_check_in = models.ForeignKey(
        "triage.CheckIn", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.patient.full_name}"
