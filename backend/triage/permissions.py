from rest_framework.permissions import BasePermission


class IsTriageStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "triage_staff")
        )
