"""
Models for student management.
"""
from django.db import models
from core.models import BaseModel


class StudentStatus(models.TextChoices):
    """Student enrollment status."""
    ACTIVE = 'active', 'Active'
    GRADUATED = 'graduated', 'Graduated'
    SUSPENDED = 'suspended', 'Suspended'
    WITHDRAWN = 'withdrawn', 'Withdrawn'
    DEFERRED = 'deferred', 'Deferred'


class Student(BaseModel):
    """Student model representing academic records."""

    # Basic Information
    reg_no = models.CharField(
        max_length=50, unique=True, verbose_name='Registration Number')
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)

    # Contact Information
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    # Demographics
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    national_id = models.CharField(max_length=50, blank=True)

    # Academic Information
    programme = models.ForeignKey(
        'academics.Programme',
        on_delete=models.PROTECT,
        related_name='students'
    )
    admission_year = models.PositiveIntegerField()
    admission_semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admitted_students'
    )
    current_year_of_study = models.PositiveIntegerField(default=1)

    # Status
    status = models.CharField(
        max_length=20,
        choices=StudentStatus.choices,
        default=StudentStatus.ACTIVE
    )
    graduation_date = models.DateField(null=True, blank=True)

    # Photo
    photo = models.ImageField(
        upload_to='students/photos/', null=True, blank=True)

    class Meta:
        db_table = 'students'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['reg_no']

    def __str__(self):
        return f"{self.reg_no} - {self.full_name}"

    @property
    def full_name(self):
        """Return the student's full name."""
        names = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(filter(None, names))

    @property
    def school(self):
        """Return the student's school through programme."""
        return self.programme.department.school if self.programme and self.programme.department else None

    @property
    def department(self):
        """Return the student's department through programme."""
        return self.programme.department if self.programme else None


class StudentEnrollment(BaseModel):
    """Track student enrollment in semesters."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='enrollments'
    )
    year_of_study = models.PositiveIntegerField()
    is_repeat = models.BooleanField(default=False)
    enrollment_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'student_enrollments'
        verbose_name = 'Student Enrollment'
        verbose_name_plural = 'Student Enrollments'
        unique_together = ['student', 'semester']
        ordering = ['-semester__year', '-semester__start_date']

    def __str__(self):
        return f"{self.student.reg_no} - {self.semester}"
