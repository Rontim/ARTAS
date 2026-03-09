"""
Serializers for transcripts app.
"""
from rest_framework import serializers
from .models import Transcript, TranscriptRequest, TranscriptVerification


class TranscriptSerializer(serializers.ModelSerializer):
    """Serializer for Transcript model."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    generated_by_name = serializers.CharField(
        source='generated_by.full_name', read_only=True)

    class Meta:
        model = Transcript
        fields = [
            'id', 'transcript_id', 'verification_code',
            'student', 'student_name', 'student_reg_no',
            'transcript_type', 'status',
            'from_semester', 'to_semester',
            'generated_by', 'generated_by_name', 'generated_at',
            'issued_by', 'issued_at',
            'pdf_file', 'qr_code', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'transcript_id', 'verification_code',
            'generated_at', 'issued_at', 'pdf_file', 'qr_code',
            'created_at', 'updated_at'
        ]


class TranscriptGenerateSerializer(serializers.Serializer):
    """Serializer for generating a transcript."""
    student_id = serializers.UUIDField()
    transcript_type = serializers.ChoiceField(
        choices=[('official', 'Official'), ('unofficial',
                                            'Unofficial'), ('provisional', 'Provisional')],
        default='official'
    )
    from_semester_id = serializers.UUIDField(required=False, allow_null=True)
    to_semester_id = serializers.UUIDField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class BatchTranscriptGenerateSerializer(serializers.Serializer):
    """Serializer for batch transcript generation."""
    student_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1
    )
    transcript_type = serializers.ChoiceField(
        choices=[('official', 'Official'), ('unofficial',
                                            'Unofficial'), ('provisional', 'Provisional')],
        default='official'
    )


class TranscriptRequestSerializer(serializers.ModelSerializer):
    """Serializer for transcript requests."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)

    class Meta:
        model = TranscriptRequest
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'transcript_type', 'purpose', 'copies_requested',
            'status', 'processed_by', 'processed_at',
            'transcript', 'rejection_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'processed_by', 'processed_at',
            'transcript', 'created_at', 'updated_at'
        ]


class TranscriptVerificationSerializer(serializers.ModelSerializer):
    """Serializer for transcript verifications."""
    transcript_id = serializers.CharField(
        source='transcript.transcript_id', read_only=True)

    class Meta:
        model = TranscriptVerification
        fields = [
            'id', 'transcript', 'transcript_id',
            'verification_method', 'ip_address', 'is_valid',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class VerifyTranscriptSerializer(serializers.Serializer):
    """Serializer for verifying a transcript."""
    code = serializers.CharField(max_length=50)


class TranscriptVerificationResponseSerializer(serializers.Serializer):
    """Response serializer for transcript verification."""
    is_valid = serializers.BooleanField()
    message = serializers.CharField()
    transcript_info = serializers.DictField(required=False)
