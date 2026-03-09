"""
Models for transcript management.
"""
from django.db import models
from core.models import BaseModel
from core.utils import generate_transcript_id, generate_verification_code


class TranscriptStatus(models.TextChoices):
    """Status of a transcript."""
    DRAFT = 'draft', 'Draft'
    GENERATED = 'generated', 'Generated'
    ISSUED = 'issued', 'Issued'
    REVOKED = 'revoked', 'Revoked'


class TranscriptType(models.TextChoices):
    """Type of transcript."""
    OFFICIAL = 'official', 'Official'
    UNOFFICIAL = 'unofficial', 'Unofficial'
    PROVISIONAL = 'provisional', 'Provisional'


class Transcript(BaseModel):
    """Generated transcript record."""

    # Unique identifiers
    transcript_id = models.CharField(
        max_length=50, unique=True, editable=False)
    verification_code = models.CharField(
        max_length=20, unique=True, editable=False)

    # Student reference
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.PROTECT,
        related_name='transcripts'
    )

    # Transcript details
    transcript_type = models.CharField(
        max_length=20,
        choices=TranscriptType.choices,
        default=TranscriptType.OFFICIAL
    )
    status = models.CharField(
        max_length=20,
        choices=TranscriptStatus.choices,
        default=TranscriptStatus.DRAFT
    )

    # Date range covered
    from_semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='transcripts_from',
        null=True,
        blank=True
    )
    to_semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='transcripts_to',
        null=True,
        blank=True
    )

    # Generation details
    generated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_transcripts'
    )
    generated_at = models.DateTimeField(null=True, blank=True)

    # Issue details
    issued_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_transcripts'
    )
    issued_at = models.DateTimeField(null=True, blank=True)

    # Document
    pdf_file = models.FileField(
        upload_to='transcripts/', null=True, blank=True)

    # Snapshot of data at generation time (for audit)
    data_snapshot = models.JSONField(default=dict)

    # QR Code
    qr_code = models.ImageField(
        upload_to='transcripts/qr/', null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'transcripts'
        verbose_name = 'Transcript'
        verbose_name_plural = 'Transcripts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transcript_id} - {self.student.reg_no}"

    def save(self, *args, **kwargs):
        if not self.transcript_id:
            self.transcript_id = generate_transcript_id(self.student.reg_no)
        if not self.verification_code:
            self.verification_code = generate_verification_code()
        super().save(*args, **kwargs)


class TranscriptRequest(BaseModel):
    """Request for a transcript."""

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='transcript_requests'
    )
    transcript_type = models.CharField(
        max_length=20,
        choices=TranscriptType.choices,
        default=TranscriptType.OFFICIAL
    )

    # Request details
    purpose = models.TextField(blank=True)
    copies_requested = models.PositiveIntegerField(default=1)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('completed', 'Completed'),
        ],
        default='pending'
    )

    # Processing
    processed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_requests'
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    # Linked transcript
    transcript = models.ForeignKey(
        Transcript,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requests'
    )

    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'transcript_requests'
        verbose_name = 'Transcript Request'
        verbose_name_plural = 'Transcript Requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Request by {self.student.reg_no} ({self.status})"


class TranscriptVerification(BaseModel):
    """Log of transcript verification attempts."""

    transcript = models.ForeignKey(
        Transcript,
        on_delete=models.CASCADE,
        related_name='verifications'
    )

    verification_method = models.CharField(max_length=50)  # 'qr', 'code', 'id'
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_valid = models.BooleanField(default=True)

    class Meta:
        db_table = 'transcript_verifications'
        verbose_name = 'Transcript Verification'
        verbose_name_plural = 'Transcript Verifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Verification of {self.transcript.transcript_id}"
