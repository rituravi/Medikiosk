from django.db import models

from patients.models import Doctor, Patient

DOSHA_CHOICES = [
    ("VATA", "Vata"),
    ("PITTA", "Pitta"),
    ("KAPHA", "Kapha"),
    ("VATA_PITTA", "Vata-Pitta"),
    ("PITTA_KAPHA", "Pitta-Kapha"),
    ("VATA_KAPHA", "Vata-Kapha"),
    ("TRIDOSHA", "Tridosha (Sama)"),
]

# A single dosha, used for self-reported traits that each point toward one dosha.
SINGLE_DOSHA_CHOICES = [
    ("VATA", "Vata"),
    ("PITTA", "Pitta"),
    ("KAPHA", "Kapha"),
]

GRADE_CHOICES = [
    ("PRAVARA", "Pravara (excellent)"),
    ("MADHYAMA", "Madhyama (moderate)"),
    ("AVARA", "Avara (poor)"),
]

AGNI_CHOICES = [
    ("SAMA", "Sama Agni (balanced)"),
    ("VISHAMA", "Vishama Agni (irregular)"),
    ("TIKSHNA", "Tikshna Agni (sharp/excessive)"),
    ("MANDA", "Manda Agni (weak/slow)"),
]

RASA_CHOICES = [
    ("SWEET", "Sweet (Madhura)"),
    ("SOUR", "Sour (Amla)"),
    ("SALTY", "Salty (Lavana)"),
    ("PUNGENT", "Pungent (Katu)"),
    ("BITTER", "Bitter (Tikta)"),
    ("ASTRINGENT", "Astringent (Kashaya)"),
]


class PrakritiProfile(models.Model):
    """
    A patient's constitutional type (Prakriti) — assessed once, since it does
    not change over a lifetime. The patient records self-observed traits; a
    vaidya reviews them and finalizes the overall Prakriti type.
    """

    patient = models.OneToOneField(
        Patient, on_delete=models.CASCADE, related_name="prakriti_profile"
    )

    # Patient self-report: each observable trait points toward a dosha.
    body_frame = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    skin_type = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    hair_type = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    appetite_pattern = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    sleep_pattern = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    mental_temperament = models.CharField(max_length=10, choices=SINGLE_DOSHA_CHOICES, blank=True)
    self_report_notes = models.TextField(blank=True)
    self_report_updated_at = models.DateTimeField(null=True, blank=True)

    # Vaidya's clinical finalization.
    prakriti_type = models.CharField(max_length=15, choices=DOSHA_CHOICES, blank=True)
    clinical_notes = models.TextField(blank=True)
    finalized_by = models.ForeignKey(
        Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    finalized_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prakriti of {self.patient.full_name}"


class AyurvedaAssessment(models.Model):
    """
    A single Ayurvedic OPD visit's Dashavidha Pariksha (minus Prakriti, which
    is recorded once on PrakritiProfile) and Ahara-Vihara assessment.
    """

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("FINALIZED", "Finalized"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="ayurveda_assessments"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="DRAFT")

    # --- Ahara-Vihara (diet & lifestyle) — patient self-report ---
    diet_type = models.CharField(
        max_length=20,
        choices=[
            ("VEGETARIAN", "Vegetarian"),
            ("EGGETARIAN", "Eggetarian"),
            ("NON_VEGETARIAN", "Non-vegetarian"),
            ("VEGAN", "Vegan"),
        ],
        blank=True,
    )
    meal_pattern = models.CharField(
        max_length=20,
        choices=[
            ("REGULAR", "Regular meal timing"),
            ("IRREGULAR", "Irregular meal timing"),
            ("FREQUENT_SNACKING", "Frequent snacking"),
        ],
        blank=True,
    )
    water_intake = models.CharField(
        max_length=15,
        choices=[("LOW", "Low"), ("ADEQUATE", "Adequate"), ("EXCESSIVE", "Excessive")],
        blank=True,
    )
    taste_preferences = models.CharField(
        max_length=100,
        blank=True,
        help_text="Comma-separated list of preferred rasas, e.g. SWEET,SALTY",
    )
    sleep_duration_hours = models.FloatField(null=True, blank=True)
    sleep_quality = models.CharField(
        max_length=15,
        choices=[("SOUND", "Sound"), ("DISTURBED", "Disturbed"), ("INSOMNIA", "Insomnia")],
        blank=True,
    )
    bowel_habits = models.CharField(
        max_length=15,
        choices=[
            ("REGULAR", "Regular"),
            ("IRREGULAR", "Irregular"),
            ("CONSTIPATED", "Constipated"),
            ("LOOSE", "Loose"),
        ],
        blank=True,
    )
    physical_activity_level = models.CharField(
        max_length=15,
        choices=[
            ("SEDENTARY", "Sedentary"),
            ("MODERATE", "Moderate"),
            ("ACTIVE", "Active"),
            ("VERY_ACTIVE", "Very active"),
        ],
        blank=True,
    )
    addictions = models.TextField(blank=True)
    occupation_stress_level = models.CharField(
        max_length=10,
        choices=[("LOW", "Low"), ("MODERATE", "Moderate"), ("HIGH", "High")],
        blank=True,
    )
    ahara_vihara_notes = models.TextField(blank=True)

    # --- Dashavidha Pariksha (minus Prakriti, minus Vaya which is derived) ---
    # Vikriti — current pathological/imbalanced state.
    vikriti_type = models.CharField(max_length=15, choices=DOSHA_CHOICES, blank=True)
    vikriti_notes = models.TextField(blank=True)

    # Sara — excellence of the bodily tissues (dhatus).
    sara_grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    sara_notes = models.TextField(blank=True)

    # Samhanana — compactness/build of the body.
    samhanana_grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    samhanana_notes = models.TextField(blank=True)

    # Pramana — bodily measurements and proportion.
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    pramana_assessment = models.CharField(
        max_length=15,
        choices=[("ADEQUATE", "Adequate proportion"), ("INADEQUATE", "Inadequate proportion")],
        blank=True,
    )
    pramana_notes = models.TextField(blank=True)

    # Satmya — suitability/adaptability (to tastes, climate, etc).
    satmya_grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    satmya_notes = models.TextField(blank=True)

    # Sattva — mental/psychological strength.
    sattva_grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    sattva_notes = models.TextField(blank=True)

    # Ahara Shakti — digestive capacity: quantity tolerated + metabolic strength.
    abhyavaharana_shakti = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    agni_type = models.CharField(max_length=10, choices=AGNI_CHOICES, blank=True)
    ahara_shakti_notes = models.TextField(blank=True)

    # Vyayama Shakti — exercise capacity/tolerance.
    vyayama_shakti_grade = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True)
    vyayama_shakti_notes = models.TextField(blank=True)

    finalized_by = models.ForeignKey(
        Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    finalized_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ayurveda assessment of {self.patient.full_name} on {self.created_at:%Y-%m-%d}"

    def vaya(self):
        """Vaya (age-classification) is derived from date of birth, not stored."""
        from datetime import date

        dob = self.patient.date_of_birth
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age < 16:
            return "BALA"
        if age < 60:
            return "MADHYA"
        return "VRIDDHA"
