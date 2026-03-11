"""
Serializers for core app.
"""
from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source='user.full_name', read_only=True, default='System')

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'action', 'entity_type',
            'entity_id', 'description', 'details', 'ip_address',
            'created_at',
        ]


class DashboardStatsSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    active_students = serializers.IntegerField()
    total_programmes = serializers.IntegerField()
    total_units = serializers.IntegerField()
    transcripts_generated = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    approved_today = serializers.IntegerField()
    total_users = serializers.IntegerField()
