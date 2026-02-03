"""
Custom permissions for accounts app.
"""
from rest_framework import permissions
from .models import UserRole


class IsAdminUser(permissions.BasePermission):
    """Permission check for admin users."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.ADMIN or request.user.is_superuser)
        )


class IsRegistrarUser(permissions.BasePermission):
    """Permission check for registrar users."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.ADMIN, UserRole.REGISTRAR] or
            request.user.is_superuser
        )


class IsStaffUser(permissions.BasePermission):
    """Permission check for staff users."""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.ADMIN, UserRole.REGISTRAR, UserRole.STAFF] or
            request.user.is_superuser
        )


class IsAdminOrSelf(permissions.BasePermission):
    """Permission for admin or accessing own resource."""

    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == UserRole.ADMIN or request.user.is_superuser:
            return True
        # User can access their own resource
        return obj == request.user or getattr(obj, 'user', None) == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permission for admin write access or read-only for others."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.ADMIN or request.user.is_superuser)
        )
