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
    def active_enrollment(self):
        """Get active student enrollment."""
        return self.enrollments.filter(current_status=StudentStatus.ACTIVE).first() or self.enrollments.first()

    @property
    def programme(self):
        """Deprecated: Get the student's programme through active enrollment."""
        enrollment = self.active_enrollment
        return enrollment.programme if enrollment else None

    @property
    def admission_year(self):
        """Deprecated: Get student's admission year."""
        enrollment = self.active_enrollment
        return enrollment.admission_date.year if enrollment else None

    @property
    def status(self):
        """Deprecated: Get student's status."""
        enrollment = self.active_enrollment
        return enrollment.current_status if enrollment else StudentStatus.ACTIVE

    @property
    def graduation_date(self):
        """Deprecated: Get student's graduation date."""
        enrollment = self.active_enrollment
        return enrollment.expected_graduation_date if enrollment else None

    @property
    def current_year_of_study(self):
        """Derive current year of study from the latest semester registration."""
        latest = self.semester_registrations.order_by(
            '-semester__academic_year__year', '-semester__start_date'
        ).first()
        return latest.program_year if latest else 1

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
        prog = self.programme
        return prog.department.school if prog and prog.department else None

    @property
    def department(self):
        """Return the student's department through programme."""
        prog = self.programme
        return prog.department if prog else None

    @property
    def is_semester_based(self):
        prog = self.programme
        return prog.structure == 'semester' if prog else True

    @property
    def is_module_based(self):
        prog = self.programme
        return prog.structure == 'module' if prog else False


class StudentEnrollment(BaseModel):
    """Represents a student's admission into a program."""

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    programme = models.ForeignKey(
        'academics.Programme',
        on_delete=models.PROTECT,
        related_name='enrollments'
    )
    admission_date = models.DateField()
    cohort = models.CharField(max_length=50)  # e.g., "2025/2026"
    current_status = models.CharField(
        max_length=20,
        choices=StudentStatus.choices,
        default=StudentStatus.ACTIVE
    )
    expected_graduation_date = models.DateField(null=True, blank=True)
    admission_semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrollments'
    )

    class Meta:
        db_table = 'student_enrollments'
        verbose_name = 'Student Enrollment'
        verbose_name_plural = 'Student Enrollments'
        unique_together = ['student', 'programme']

    def __str__(self):
        return f"{self.student.reg_no} - {self.programme.code} ({self.current_status})"


class SemesterRegistration(BaseModel):
    """Registration of a student for a semester (semester-based programmes)."""

    student_enrollment = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='semester_registrations'
    )
    academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='semester_registrations'
    )
    semester = models.ForeignKey(
        'academics.Semester',
        on_delete=models.PROTECT,
        related_name='registrations'
    )
    program_year = models.PositiveIntegerField()
    registration_date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('registered', 'Registered'),
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('deferred', 'Deferred'),
        ],
        default='registered'
    )

    class Meta:
        db_table = 'semester_registrations'
        verbose_name = 'Semester Registration'
        verbose_name_plural = 'Semester Registrations'
        unique_together = ['student_enrollment', 'semester']
        ordering = ['-semester__academic_year__year', '-semester__start_date']

    def __str__(self):
        return f"{self.student_enrollment.student.reg_no} - {self.semester} (Y{self.program_year})"

    @property
    def student(self):
        """Deprecated: Get the student for backward compatibility."""
        return self.student_enrollment.student

    @property
    def year_of_study(self):
        """Deprecated: Get year of study."""
        return self.program_year

    @year_of_study.setter
    def year_of_study(self, value):
        self.program_year = value

    @property
    def is_repeat(self):
        """Deprecated helper."""
        return False


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


class SemesterRegistrationUnit(BaseModel):
    """Student's registration for a specific unit offering."""

    semester_registration = models.ForeignKey(
        SemesterRegistration,
        on_delete=models.CASCADE,
        related_name='unit_registrations'
    )
    unit = models.ForeignKey(
        'academics.Unit',
        on_delete=models.PROTECT,
        related_name='registrations'
    )
    unit_status = models.CharField(
        max_length=20,
        choices=[
            ('registered', 'Registered'),
            ('completed', 'Completed'),
            ('dropped', 'Dropped'),
            ('deferred', 'Deferred'),
            ('repeat', 'Repeat'),
            ('retake', 'Retake'),
            ('supplementary', 'Supplementary'),
            ('credit_transfer', 'Credit Transfer'),
        ],
        default='registered'
    )
    attempt_number = models.PositiveIntegerField(default=1)

    # For compatibility and tracking specific offerings
    semester_unit = models.ForeignKey(
        'academics.SemesterUnit',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='registrations'
    )

    # To satisfy historical multi-type CheckConstraints (if any)
    module_registration = models.ForeignKey(
        ModuleRegistration,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='unit_registrations'
    )

    class Meta:
        db_table = 'semester_registration_units'
        verbose_name = 'Semester Registration Unit'
        verbose_name_plural = 'Semester Registration Units'
        ordering = ['semester_registration', 'unit__code']
        constraints = [
            models.UniqueConstraint(
                fields=['semester_registration', 'unit'],
                name='unique_semester_reg_unit'
            )
        ]

    def __str__(self):
        return f"{self.semester_registration.student_enrollment.student.reg_no} - {self.unit.code} ({self.unit_status})"

    @property
    def student(self):
        return self.semester_registration.student_enrollment.student

    @property
    def status(self):
        return self.unit_status

    @property
    def is_semester_based(self):
        return True

    @property
    def is_module_based(self):
        return False
