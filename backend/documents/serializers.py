from rest_framework import serializers

from .models import MedicalDocument


class MedicalDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "document_type",
            "title",
            "file",
            "file_url",
            "notes",
            "extracted_text",
            "ocr_status",
            "ocr_error",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "extracted_text",
            "ocr_status",
            "ocr_error",
            "uploaded_at",
        ]
        extra_kwargs = {"file": {"write_only": True}}

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url
