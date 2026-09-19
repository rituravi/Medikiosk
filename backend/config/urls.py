

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("hello.urls")),
    path("api/patients/", include("patients.urls")),
    path("api/documents/", include("documents.urls")),
    path("api/ayurveda/", include("ayurveda.urls")),
    path("api/triage/", include("triage.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
