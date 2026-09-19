from django.urls import path

from . import views

urlpatterns = [
    path("check-in/", views.CheckInCreateView.as_view(), name="triage-check-in"),
    path("check-in/mine/", views.MyCheckInsView.as_view(), name="triage-my-check-ins"),
    path("queue/", views.TriageQueueView.as_view(), name="triage-queue"),
    path(
        "queue/<int:check_in_id>/acknowledge/",
        views.TriageAcknowledgeView.as_view(),
        name="triage-acknowledge",
    ),
    path(
        "queue/<int:check_in_id>/complete/",
        views.TriageCompleteView.as_view(),
        name="triage-complete",
    ),
    path("admin/staff/", views.AdminTriageStaffView.as_view(), name="triage-admin-staff"),
]
