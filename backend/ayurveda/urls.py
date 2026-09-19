from django.urls import path

from . import views

urlpatterns = [
    path("me/prakriti/", views.PrakritiMeView.as_view(), name="ayurveda-prakriti-me"),
    path(
        "me/assessments/",
        views.AyurvedaAssessmentMeListCreateView.as_view(),
        name="ayurveda-assessment-me-list-create",
    ),
    path(
        "me/assessments/<int:assessment_id>/",
        views.AyurvedaAssessmentMeDetailView.as_view(),
        name="ayurveda-assessment-me-detail",
    ),
    path(
        "doctor/patients/<int:patient_id>/prakriti/",
        views.DoctorPrakritiView.as_view(),
        name="ayurveda-doctor-prakriti",
    ),
    path(
        "doctor/patients/<int:patient_id>/assessments/",
        views.DoctorAyurvedaAssessmentListView.as_view(),
        name="ayurveda-doctor-assessment-list",
    ),
    path(
        "doctor/patients/<int:patient_id>/assessments/finalize/",
        views.DoctorAyurvedaAssessmentFinalizeView.as_view(),
        name="ayurveda-doctor-assessment-finalize",
    ),
]
