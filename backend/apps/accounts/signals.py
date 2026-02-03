"""
Signal handlers for accounts app.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User, AuditLog


# Signals can be expanded for audit logging, notifications, etc.
