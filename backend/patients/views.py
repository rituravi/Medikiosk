from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Patient
from .serializers import LoginSerializer, PatientSerializer, RegisterSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        token, _ = Token.objects.get_or_create(user=patient.user)
        return Response(
            {
                "token": token.key,
                "patient": PatientSerializer(patient).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        patient = getattr(user, "patient", None)
        return Response(
            {
                "token": token.key,
                "patient": PatientSerializer(patient).data if patient else None,
            }
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = getattr(request.user, "patient", None)
        if patient is None:
            return Response(
                {"detail": "No patient profile for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PatientSerializer(patient).data)
