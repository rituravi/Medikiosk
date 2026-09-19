from django.contrib.auth.models import User
from rest_framework import serializers

from .models import CheckIn, TriageStaff


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = [
            "id",
            "symptoms_text",
            "status",
            "is_emergency",
            "red_flags",
            "created_at",
        ]
        read_only_fields = ["id", "status", "is_emergency", "red_flags", "created_at"]


class QueueCheckInSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_phone = serializers.CharField(source="patient.phone_number", read_only=True)
    acknowledged_by_name = serializers.CharField(
        source="acknowledged_by.full_name", read_only=True
    )

    class Meta:
        model = CheckIn
        fields = [
            "id",
            "patient_name",
            "patient_phone",
            "symptoms_text",
            "status",
            "is_emergency",
            "red_flags",
            "ai_reasoning",
            "acknowledged_by_name",
            "acknowledged_at",
            "resolved_at",
            "created_at",
        ]


class TriageStaffSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TriageStaff
        fields = ["id", "username", "full_name", "created_at"]


class CreateTriageStaffSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return TriageStaff.objects.create(user=user, full_name=validated_data["full_name"])
