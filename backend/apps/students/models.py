"""
Models for student management.
"""
from django.db import models
from django.db.models import Q
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
    def current_year_of_study(self):
        """Derive current year of study from the latest semester registration."""
        latest = self.semester_registrations.order_by(
            '-semester__academic_year__year', '-semester__start_date'
        ).first()
        return latest.year_of_study if latest else 1

    @property
    def current_module(self):
        """Derive current module from the latest module registration."""
        latest = self.module_registrations.order_by(
            '-registration_date'
        ).first()
        return latest.module if latest else None

    @property
    def school(self):
        """Return the student's school through programme."""
        return self.programme.department.school if self.programme and self.programme.department else None

    @property
    def department(self):
        """Return the student's department through programme."""
        return self.programme.department if self.programme else None


class SemesterRegistration(BaseModel):
    """Registration of a student for a semester (semester-based programmes)."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='semester_registrations'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='registrations'
    )
    year_of_study = models.PositiveIntegerField()
    is_repeat = models.BooleanField(default=False)
    registration_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'semester_registrations'
        verbose_name = 'Semester Registration'
        verbose_name_plural = 'Semester Registrations'
        unique_together = ['student', 'semester']
        ordering = ['-semester__academic_year__year', '-semester__start_date']

    def __str__(self):
        return f"{self.student.reg_no} - {self.semester} (Y{self.year_of_study})"


class ModuleRegistration(BaseModel):
    """Registration of a student for a module (module-based programmes)."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='module_registrations'
    )
    module = models.ForeignKey(
        'academics.Module',
        on_delete=models.PROTECT,
        related_name='registrations'
    )
    is_repeat = models.BooleanField(default=False)
    registration_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'module_registrations'
        verbose_name = 'Module Registration'
        verbose_name_plural = 'Module Registrations'
        unique_together = ['student', 'module']
        ordering = ['module__module_number']

    def __str__(self):
        return f"{self.student.reg_no} - {self.module.name}"


class RegistrationStatus(models.TextChoices):
    """Status of a unit registration."""
    REGISTERED = 'registered', 'Registered'
    DROPPED = 'dropped', 'Dropped'
    COMPLETED = 'completed', 'Completed'


class UnitRegistration(BaseModel):
    """Student's registration for a specific unit offering."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='unit_registrations'
    )
    unit = models.ForeignKey(
        'academics.Unit',
        on_delete=models.PROTECT,
        related_name='registrations'
    )

    # For semester-based programmes
    semester_registration = models.ForeignKey(
        SemesterRegistration,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='unit_registrations'
    )
    semester_unit = models.ForeignKey(
        'academics.SemesterUnit',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='registrations'
    )

    # For module-based programmes
    module_registration = models.ForeignKey(
        ModuleRegistration,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='unit_registrations'
    )

    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.REGISTERED
    )

    class Meta:
        db_table = 'unit_registrations'
        verbose_name = 'Unit Registration'
        verbose_name_plural = 'Unit Registrations'
        ordering = ['student', 'unit__code']
        constraints = [
            models.UniqueConstraint(
                fields=['semester_registration', 'semester_unit'],
                condition=Q(semester_registration__isnull=False),
                name='unique_semester_unit_reg'
            ),
            models.UniqueConstraint(
                fields=['module_registration', 'unit'],
                condition=Q(module_registration__isnull=False),
                name='unique_module_unit_reg'
            ),
            models.CheckConstraint(
                check=(
                    Q(semester_registration__isnull=False, module_registration__isnull=True) |
                    Q(semester_registration__isnull=True,
                      module_registration__isnull=False)
                ),
                name='registration_type_exclusive'
            ),
        ]

    def __str__(self):
        return f"{self.student.reg_no} - {self.unit.code} ({self.status})"

    @property
    def is_semester_based(self):
        return self.semester_registration is not None

    @property
    def is_module_based(self):
        return self.module_registration is not None
