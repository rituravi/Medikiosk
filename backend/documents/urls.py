from django.urls import path

from . import views

urlpatterns = [
    path("", views.MedicalDocumentListCreateView.as_view(), name="document-list-create"),
    path("<int:pk>/", views.MedicalDocumentDetailView.as_view(), name="document-detail"),
]
