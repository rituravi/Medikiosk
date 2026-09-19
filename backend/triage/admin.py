from django.contrib import admin

from .models import CheckIn, TriageStaff

admin.site.register(TriageStaff)
admin.site.register(CheckIn)
