from rest_framework import serializers

from .models import AyurvedaAssessment, PrakritiProfile


class PrakritiProfileSerializer(serializers.ModelSerializer):
    is_finalized = serializers.SerializerMethodField()
    finalized_by_name = serializers.CharField(source="finalized_by.full_name", read_only=True)

    class Meta:
        model = PrakritiProfile
        fields = [
            "id",
            "body_frame",
            "skin_type",
            "hair_type",
            "appetite_pattern",
            "sleep_pattern",
            "mental_temperament",
            "self_report_notes",
            "self_report_updated_at",
            "prakriti_type",
            "clinical_notes",
            "finalized_by_name",
            "finalized_at",
            "is_finalized",
        ]
        read_only_fields = [
            "id",
            "self_report_updated_at",
            "prakriti_type",
            "clinical_notes",
            "finalized_by_name",
            "finalized_at",
            "is_finalized",
        ]

    def get_is_finalized(self, obj):
        return obj.finalized_at is not None


PRAKRITI_SELF_REPORT_FIELDS = [
    "body_frame",
    "skin_type",
    "hair_type",
    "appetite_pattern",
    "sleep_pattern",
    "mental_temperament",
    "self_report_notes",
]

AHARA_VIHARA_FIELDS = [
    "diet_type",
    "meal_pattern",
    "water_intake",
    "taste_preferences",
    "sleep_duration_hours",
    "sleep_quality",
    "bowel_habits",
    "physical_activity_level",
    "addictions",
    "occupation_stress_level",
    "ahara_vihara_notes",
]

DASHAVIDHA_CLINICAL_FIELDS = [
    "vikriti_type",
    "vikriti_notes",
    "sara_grade",
    "sara_notes",
    "samhanana_grade",
    "samhanana_notes",
    "height_cm",
    "weight_kg",
    "pramana_assessment",
    "pramana_notes",
    "satmya_grade",
    "satmya_notes",
    "sattva_grade",
    "sattva_notes",
    "abhyavaharana_shakti",
    "agni_type",
    "ahara_shakti_notes",
    "vyayama_shakti_grade",
    "vyayama_shakti_notes",
]


class AyurvedaAssessmentSerializer(serializers.ModelSerializer):
    vaya = serializers.SerializerMethodField()

    class Meta:
        model = AyurvedaAssessment
        fields = (
            ["id", "patient", "status", "created_at", "updated_at"]
            + AHARA_VIHARA_FIELDS
            + DASHAVIDHA_CLINICAL_FIELDS
            + ["finalized_at", "vaya"]
        )
        read_only_fields = [
            "id",
            "patient",
            "status",
            "created_at",
            "updated_at",
            "finalized_at",
            "vaya",
        ] + DASHAVIDHA_CLINICAL_FIELDS

    def get_vaya(self, obj):
        return obj.vaya()


class AyurvedaAssessmentClinicalSerializer(serializers.ModelSerializer):
    """Used by a vaidya to finalize the clinical (Dashavidha) fields."""

    vaya = serializers.SerializerMethodField()

    class Meta:
        model = AyurvedaAssessment
        fields = (
            ["id", "patient", "status", "created_at", "updated_at"]
            + AHARA_VIHARA_FIELDS
            + DASHAVIDHA_CLINICAL_FIELDS
            + ["finalized_at", "vaya"]
        )
        read_only_fields = [
            "id",
            "patient",
            "status",
            "created_at",
            "updated_at",
            "finalized_at",
            "vaya",
        ] + AHARA_VIHARA_FIELDS

    def get_vaya(self, obj):
        return obj.vaya()
