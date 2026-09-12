from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="patient-register"),
    path("login/", views.LoginView.as_view(), name="patient-login"),
    path("me/", views.MeView.as_view(), name="patient-me"),
    path("summary/", views.SummaryView.as_view(), name="patient-summary"),
    path("parse-voice/", views.ParseVoiceView.as_view(), name="patient-parse-voice"),
    path("transcribe-voice/", views.TranscribeVoiceView.as_view(), name="patient-transcribe-voice"),
    path("admin/users/", views.AdminUserListView.as_view(), name="admin-user-list"),
    path(
        "admin/users/<int:patient_id>/reset-password/",
        views.AdminResetPasswordView.as_view(),
        name="admin-reset-password",
    ),
    path(
        "admin/users/<int:patient_id>/toggle-active/",
        views.AdminToggleActiveView.as_view(),
        name="admin-toggle-active",
    ),
]
