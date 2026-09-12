from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Doctor, Patient


class PatientSerializer(serializers.ModelSerializer):
    otp_is_set = serializers.SerializerMethodField()

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
            "otp_is_set",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "otp_is_set"]

    def get_otp_is_set(self, obj):
        return bool(obj.access_otp)


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


class AdminPatientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "username",
            "email",
            "is_active",
            "full_name",
            "phone_number",
            "date_of_birth",
            "created_at",
        ]


class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Doctor
        fields = ["id", "username", "full_name", "specialization", "created_at"]


class CreateDoctorSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField()
    specialization = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
        return Doctor.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            specialization=validated_data.get("specialization", ""),
        )


class DoctorPatientSerializer(serializers.ModelSerializer):
    """Minimal patient info a doctor needs to pick the right patient."""

    class Meta:
        model = Patient
        fields = ["id", "full_name", "date_of_birth", "gender", "phone_number"]


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
