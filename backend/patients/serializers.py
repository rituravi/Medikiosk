from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "date_of_birth",
            "gender",
            "phone_number",
            "address",
            "blood_group",
            "allergies",
            "chronic_conditions",
            "current_medications",
            "past_surgeries",
            "family_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)

    full_name = serializers.CharField()
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=Patient.GENDER_CHOICES)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    blood_group = serializers.ChoiceField(
        choices=Patient.BLOOD_GROUP_CHOICES, required=False, default="UNKNOWN"
    )
    allergies = serializers.CharField(required=False, allow_blank=True)
    chronic_conditions = serializers.CharField(required=False, allow_blank=True)
    current_medications = serializers.CharField(required=False, allow_blank=True)
    past_surgeries = serializers.CharField(required=False, allow_blank=True)
    family_history = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
        )
        patient = Patient.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            date_of_birth=validated_data["date_of_birth"],
            gender=validated_data["gender"],
            phone_number=validated_data.get("phone_number", ""),
            address=validated_data.get("address", ""),
            blood_group=validated_data.get("blood_group", "UNKNOWN"),
            allergies=validated_data.get("allergies", ""),
            chronic_conditions=validated_data.get("chronic_conditions", ""),
            current_medications=validated_data.get("current_medications", ""),
            past_surgeries=validated_data.get("past_surgeries", ""),
            family_history=validated_data.get("family_history", ""),
        )
        return patient


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["username"], password=attrs["password"]
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs
