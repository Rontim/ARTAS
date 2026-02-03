"""
Signal handlers for grades app.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
# Signals can be added here for automatic grade computation on result save
