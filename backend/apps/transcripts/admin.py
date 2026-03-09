"""
Admin configuration for transcripts app.
"""
from django.contrib import admin
from .models import Transcript, TranscriptRequest, TranscriptVerification


@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ['transcript_id', 'student',
                    'transcript_type', 'status', 'generated_at', 'issued_at']
    list_filter = ['transcript_type', 'status', 'generated_at']
    search_fields = ['transcript_id', 'verification_code', 'student__reg_no']
    readonly_fields = ['transcript_id', 'verification_code',
                       'generated_at', 'issued_at', 'data_snapshot']
    ordering = ['-created_at']


@admin.register(TranscriptRequest)
class TranscriptRequestAdmin(admin.ModelAdmin):
    list_display = ['student', 'transcript_type',
                    'status', 'copies_requested', 'created_at']
    list_filter = ['transcript_type', 'status']
    search_fields = ['student__reg_no', 'student__first_name']
    ordering = ['-created_at']


@admin.register(TranscriptVerification)
class TranscriptVerificationAdmin(admin.ModelAdmin):
    list_display = ['transcript', 'verification_method',
                    'is_valid', 'ip_address', 'created_at']
    list_filter = ['verification_method', 'is_valid']
    search_fields = ['transcript__transcript_id']
    readonly_fields = ['transcript', 'verification_method',
                       'ip_address', 'user_agent', 'is_valid', 'created_at']
    ordering = ['-created_at']
