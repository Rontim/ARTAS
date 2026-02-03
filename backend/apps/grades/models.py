"""
Models for grades and results management.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import BaseModel
from decimal import Decimal


class GradingScale(BaseModel):
    """Configurable grading scale for the institution."""

    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'grading_scales'
        verbose_name = 'Grading Scale'
        verbose_name_plural = 'Grading Scales'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            GradingScale.objects.filter(
                is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class GradeDefinition(BaseModel):
    """Individual grade definitions within a grading scale."""

    grading_scale = models.ForeignKey(
        GradingScale,
        on_delete=models.CASCADE,
        related_name='grade_definitions'
    )
    grade = models.CharField(max_length=10)  # e.g., 'A', 'B+', 'DIST'
    min_marks = models.DecimalField(max_digits=5, decimal_places=2)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2)
    grade_points = models.DecimalField(
        max_digits=3, decimal_places=2)  # GPA points
    # DISTINCTION, CREDIT, PASS, FAIL
    classification = models.CharField(max_length=50)
    description = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'grade_definitions'
        verbose_name = 'Grade Definition'
        verbose_name_plural = 'Grade Definitions'
        ordering = ['grading_scale', '-min_marks']
        unique_together = ['grading_scale', 'grade']

    def __str__(self):
        return f"{self.grade} ({self.min_marks}-{self.max_marks})"


class ResultStatus(models.TextChoices):
    """Status of a student result."""
    PASS = 'pass', 'Pass'
    FAIL = 'fail', 'Fail'
    SUPPLEMENTARY = 'supplementary', 'Supplementary'
    INCOMPLETE = 'incomplete', 'Incomplete'
    EXEMPTED = 'exempted', 'Exempted'
    WITHDRAWN = 'withdrawn', 'Withdrawn'


class StudentResult(BaseModel):
    """Individual student results for a unit in a semester."""

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='results'
    )
    unit = models.ForeignKey(
        'academics.Unit',
        on_delete=models.PROTECT,
        related_name='results'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='results'
    )

    # Marks
    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Computed fields (populated by grading engine)
    grade = models.CharField(max_length=10, blank=True)
    grade_points = models.DecimalField(
        max_digits=3, decimal_places=2, default=0)

    # Credits
    credit_attempted = models.DecimalField(max_digits=4, decimal_places=2)
    credit_earned = models.DecimalField(
        max_digits=4, decimal_places=2, default=0)

    # Status
    status = models.CharField(
        max_length=20,
        choices=ResultStatus.choices,
        default=ResultStatus.PASS
    )

    # Audit
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_results'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Repeat tracking
    is_repeat = models.BooleanField(default=False)
    attempt_number = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'student_results'
        verbose_name = 'Student Result'
        verbose_name_plural = 'Student Results'
        unique_together = ['student', 'unit', 'semester', 'attempt_number']
        ordering = ['student', 'semester', 'unit']

    def __str__(self):
        return f"{self.student.reg_no} - {self.unit.code}: {self.marks} ({self.grade})"


class SemesterAggregate(BaseModel):
    """Semester-level aggregated results for a student."""

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='semester_aggregates'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='aggregates'
    )

    # Term aggregates
    total_marks = models.DecimalField(
        max_digits=8, decimal_places=2, default=0)
    units_taken = models.PositiveIntegerField(default=0)
    term_average = models.DecimalField(
        max_digits=5, decimal_places=2, default=0)

    # Credits
    credits_attempted = models.DecimalField(
        max_digits=6, decimal_places=2, default=0)
    credits_earned = models.DecimalField(
        max_digits=6, decimal_places=2, default=0)

    # GPA
    total_grade_points = models.DecimalField(
        max_digits=8, decimal_places=2, default=0)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    # Status
    units_passed = models.PositiveIntegerField(default=0)
    units_failed = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'semester_aggregates'
        verbose_name = 'Semester Aggregate'
        verbose_name_plural = 'Semester Aggregates'
        unique_together = ['student', 'semester']
        ordering = ['student', '-semester__year']

    def __str__(self):
        return f"{self.student.reg_no} - {self.semester.name}: GPA {self.gpa}"


class CumulativeAggregate(BaseModel):
    """Cumulative aggregated results for a student."""

    student = models.OneToOneField(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='cumulative_aggregate'
    )

    # Cumulative totals
    cumulative_marks = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    cumulative_units = models.PositiveIntegerField(default=0)
    cumulative_average = models.DecimalField(
        max_digits=5, decimal_places=2, default=0)

    # Credits
    cumulative_credits_attempted = models.DecimalField(
        max_digits=8, decimal_places=2, default=0)
    cumulative_credits_earned = models.DecimalField(
        max_digits=8, decimal_places=2, default=0)

    # GPA
    cumulative_grade_points = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    cgpa = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    # Classification
    cumulative_grade = models.CharField(
        max_length=50, blank=True)  # DISTINCTION, CREDIT, PASS

    # Status
    total_units_passed = models.PositiveIntegerField(default=0)
    total_units_failed = models.PositiveIntegerField(default=0)

    # Last update tracking
    last_semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'cumulative_aggregates'
        verbose_name = 'Cumulative Aggregate'
        verbose_name_plural = 'Cumulative Aggregates'

    def __str__(self):
        return f"{self.student.reg_no}: CGPA {self.cgpa} ({self.cumulative_grade})"


class MarksUploadBatch(BaseModel):
    """Track bulk marks upload operations."""

    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.CASCADE,
        related_name='upload_batches'
    )
    unit = models.ForeignKey(
        'academics.Unit',
        on_delete=models.CASCADE,
        related_name='upload_batches'
    )
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='upload_batches'
    )

    file_name = models.CharField(max_length=255)
    total_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list)

    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )

    class Meta:
        db_table = 'marks_upload_batches'
        verbose_name = 'Marks Upload Batch'
        verbose_name_plural = 'Marks Upload Batches'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.unit.code} - {self.semester.name} ({self.status})"
