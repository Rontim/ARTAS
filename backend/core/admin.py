"""
Admin configuration for core app.
"""
from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'entity_type',
                    'entity_id', 'description', 'created_at']
    list_filter = ['action', 'entity_type', 'created_at']
    search_fields = ['user__email', 'description', 'entity_type', 'entity_id']
    readonly_fields = [
        'user', 'action', 'entity_type', 'entity_id',
        'description', 'details', 'ip_address', 'created_at',
    ]
    ordering = ['-created_at']
