from django.contrib import admin

from .models import AccessLog, Doctor, Patient

admin.site.register(Patient)
admin.site.register(Doctor)
admin.site.register(AccessLog)
