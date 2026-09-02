from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="patient-register"),
    path("login/", views.LoginView.as_view(), name="patient-login"),
    path("me/", views.MeView.as_view(), name="patient-me"),
    path("summary/", views.SummaryView.as_view(), name="patient-summary"),
]
