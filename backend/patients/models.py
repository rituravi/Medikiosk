from django.conf import settings
from django.db import models


class Patient(models.Model):
    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]

    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
        ("UNKNOWN", "Unknown"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient"
    )

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    # Clinical history captured at registration
    blood_group = models.CharField(
        max_length=10, choices=BLOOD_GROUP_CHOICES, default="UNKNOWN"
    )
    allergies = models.TextField(blank=True)
    chronic_conditions = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)
    past_surgeries = models.TextField(blank=True)
    family_history = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Hashed access code the patient sets themselves; a doctor must supply it
    # (in plaintext, checked against this hash) to view this patient's summary.
    access_otp = models.CharField(max_length=128, blank=True)

    # DPDPA consent trail: when the data principal (or their guardian, for a
    # minor) consented to registration, and whether that consent came from a
    # guardian on the patient's behalf.
    consent_given_at = models.DateTimeField(null=True, blank=True)
    guardian_consent = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name


class Doctor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor"
    )

    full_name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class AccessLog(models.Model):
    """Audit trail: records every time a doctor views a patient's summary."""

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="access_logs")
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="access_logs")
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-accessed_at"]

    def __str__(self):
        return f"{self.doctor.full_name} viewed {self.patient.full_name} at {self.accessed_at}"
