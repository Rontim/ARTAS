"""
Models for academic structure management.
"""
from django.db import models
from core.models import BaseModel


class School(BaseModel):
    """School/Faculty within the institution."""

    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    dean = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'schools'
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(BaseModel):
    """Department within a school."""

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    school = models.ForeignKey(
        School,
        on_delete=models.PROTECT,
        related_name='departments'
    )
    head_of_department = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['school', 'name']
        unique_together = ['name', 'school']

    def __str__(self):
        return f"{self.name} ({self.school.code})"


class ProgrammeType(models.TextChoices):
    """Types of academic programmes."""
    CERTIFICATE = 'certificate', 'Certificate'
    DIPLOMA = 'diploma', 'Diploma'
    BACHELORS = 'bachelors', 'Bachelor\'s Degree'
    MASTERS = 'masters', 'Master\'s Degree'
    PHD = 'phd', 'Doctor of Philosophy'


class ProgrammeStructure(models.TextChoices):
    """Structure type of academic programmes."""
    SEMESTER_BASED = 'semester', 'Semester Based'
    MODULE_BASED = 'module', 'Module Based'


class Programme(BaseModel):
    """Academic programme offered by the institution."""

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='programmes'
    )
    programme_type = models.CharField(
        max_length=20,
        choices=ProgrammeType.choices,
        default=ProgrammeType.BACHELORS
    )
    structure = models.CharField(
        max_length=20,
        choices=ProgrammeStructure.choices,
        default=ProgrammeStructure.SEMESTER_BASED
    )
    duration_years = models.PositiveIntegerField(default=4)
    total_credits_required = models.PositiveIntegerField(default=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'programmes'
        verbose_name = 'Programme'
        verbose_name_plural = 'Programmes'
        ordering = ['department', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class UnitType(models.TextChoices):
    """Types of academic units/courses."""
    CORE = 'core', 'Core'
    ELECTIVE = 'elective', 'Elective'
    COMMON = 'common', 'Common Course'


class Unit(BaseModel):
    """Academic unit/course."""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    credit_hours = models.DecimalField(
        max_digits=4, decimal_places=2, default=3.00)
    unit_type = models.CharField(
        max_length=20,
        choices=UnitType.choices,
        default=UnitType.CORE
    )

    # Prerequisites
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='required_for'
    )

    # Year and semester recommendations
    recommended_year = models.PositiveIntegerField(default=1)
    recommended_semester = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'units'
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Module(BaseModel):
    """Module for module-based programmes (e.g., KNEC)."""

    programme = models.ForeignKey(
        Programme,
        on_delete=models.CASCADE,
        related_name='modules'
    )
    name = models.CharField(max_length=100)  # e.g., "Module 1"
    module_number = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'modules'
        verbose_name = 'Module'
        verbose_name_plural = 'Modules'
        unique_together = ['programme', 'module_number']
        ordering = ['programme', 'module_number']

    def __str__(self):
        return f"{self.programme.code} - {self.name}"


class ProgrammeUnit(BaseModel):
    """Association between programmes and units (curriculum)."""

    programme = models.ForeignKey(
        Programme,
        on_delete=models.CASCADE,
        related_name='programme_units'
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='programme_units'
    )

    # For semester-based programmes
    year_of_study = models.PositiveIntegerField(null=True, blank=True)
    semester_number = models.PositiveIntegerField(null=True, blank=True)

    # For module-based programmes
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='module_units'
    )

    is_mandatory = models.BooleanField(default=True)

    class Meta:
        db_table = 'programme_units'
        verbose_name = 'Programme Unit'
        verbose_name_plural = 'Programme Units'
        unique_together = ['programme', 'unit']
        ordering = ['programme', 'year_of_study',
                    'semester_number', 'unit__code']

    def __str__(self):
        if self.module:
            return f"{self.programme.code} - {self.unit.code} ({self.module.name})"
        return f"{self.programme.code} - {self.unit.code} (Y{self.year_of_study}S{self.semester_number})"


class AcademicYear(BaseModel):
    """Academic year definition."""

    year = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=50)  # e.g., "2023/2024"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = 'academic_years'
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        ordering = ['-year']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one academic year is marked as current
        if self.is_current:
            AcademicYear.objects.filter(
                is_current=True).update(is_current=False)
        super().save(*args, **kwargs)


class SemesterType(models.TextChoices):
    """Types of semesters."""
    FIRST = 'first', 'First Semester'
    SECOND = 'second', 'Second Semester'
    THIRD = 'third', 'Third Semester'
    SUPPLEMENTARY = 'supplementary', 'Supplementary'


class Semester(BaseModel):
    """Semester within an academic year."""

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name='semesters'
    )
    # e.g., "JANUARY-APRIL SEMESTER 2023"
    name = models.CharField(max_length=100)
    semester_type = models.CharField(
        max_length=20,
        choices=SemesterType.choices
    )
    year = models.PositiveIntegerField()  # Calendar year for the semester
    start_date = models.DateField()
    end_date = models.DateField()
    registration_deadline = models.DateField(null=True, blank=True)
    marks_submission_deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'semesters'
        verbose_name = 'Semester'
        verbose_name_plural = 'Semesters'
        ordering = ['-year', '-start_date']
        unique_together = ['academic_year', 'semester_type']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure only one semester is marked as active
        if self.is_active:
            Semester.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class SemesterUnit(BaseModel):
    """Units offered in a specific semester."""

    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='semester_units'
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='semester_offerings'
    )
    programme = models.ForeignKey(
        Programme,
        on_delete=models.CASCADE,
        related_name='semester_units'
    )
    lecturer = models.CharField(max_length=200, blank=True)
    max_students = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'semester_units'
        verbose_name = 'Semester Unit'
        verbose_name_plural = 'Semester Units'
        unique_together = ['semester', 'unit', 'programme']
        ordering = ['semester', 'unit__code']

    def __str__(self):
        return f"{self.semester.name} - {self.unit.code}"
