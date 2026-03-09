"""
Grading engine for computing grades, GPA, and aggregations.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Dict, List, Tuple
from django.db import transaction
from django.db.models import Sum, Avg, Count, F, Q
from django.conf import settings

from .models import (
    GradingScale, GradeDefinition, StudentResult,
    SemesterAggregate, ModuleAggregate, CumulativeAggregate, ResultStatus
)


class GradingEngine:
    """
    Core grading engine for ARTAS.
    Handles grade calculation, GPA computation, and result aggregation.
    """

    def __init__(self, grading_scale: Optional[GradingScale] = None):
        """Initialize the grading engine with a grading scale."""
        if grading_scale:
            self.grading_scale = grading_scale
        else:
            self.grading_scale = self._get_default_grading_scale()

        self._load_grade_definitions()

    def _get_default_grading_scale(self) -> GradingScale:
        """Get the default grading scale or create one if none exists."""
        try:
            return GradingScale.objects.get(is_default=True)
        except GradingScale.DoesNotExist:
            return self._create_default_grading_scale()

    def _create_default_grading_scale(self) -> GradingScale:
        """Create a default grading scale based on settings."""
        scale = GradingScale.objects.create(
            name='Default Grading Scale',
            is_default=True,
            description='Standard institutional grading scale'
        )

        # Create grade definitions from settings or use defaults
        default_grades = getattr(settings, 'DEFAULT_GRADING_SCALE', {
            'A': {'min': 70, 'max': 100, 'points': 4.0, 'classification': 'DISTINCTION'},
            'B': {'min': 60, 'max': 69, 'points': 3.0, 'classification': 'CREDIT'},
            'C': {'min': 50, 'max': 59, 'points': 2.0, 'classification': 'PASS'},
            'D': {'min': 40, 'max': 49, 'points': 1.0, 'classification': 'PASS'},
            'E': {'min': 0, 'max': 39, 'points': 0.0, 'classification': 'FAIL'},
        })

        for grade, values in default_grades.items():
            GradeDefinition.objects.create(
                grading_scale=scale,
                grade=grade,
                min_marks=Decimal(str(values['min'])),
                max_marks=Decimal(str(values['max'])),
                grade_points=Decimal(str(values['points'])),
                classification=values['classification']
            )

        return scale

    def _load_grade_definitions(self):
        """Load grade definitions into memory for faster lookups."""
        self.grade_definitions = list(
            self.grading_scale.grade_definitions.order_by('-min_marks')
        )

    def get_grade(self, marks: Decimal) -> Tuple[str, Decimal, str]:
        """
        Get grade, grade points, and classification for given marks.

        Returns:
            Tuple of (grade, grade_points, classification)
        """
        marks = Decimal(str(marks)).quantize(Decimal('0.01'))

        for grade_def in self.grade_definitions:
            if grade_def.min_marks <= marks <= grade_def.max_marks:
                return (
                    grade_def.grade,
                    grade_def.grade_points,
                    grade_def.classification
                )

        # Default to fail if no match found
        return ('E', Decimal('0.00'), 'FAIL')

    def determine_result_status(self, marks: Decimal, classification: str) -> str:
        """Determine the result status based on marks and classification."""
        if classification == 'FAIL':
            return ResultStatus.FAIL
        return ResultStatus.PASS

    @transaction.atomic
    def process_result(self, result: StudentResult) -> StudentResult:
        """
        Process a single student result - compute grade, points, and status.
        """
        grade, grade_points, classification = self.get_grade(result.marks)

        result.grade = grade
        result.grade_points = grade_points
        result.status = self.determine_result_status(
            result.marks, classification)

        # Set credits earned
        if result.status == ResultStatus.PASS:
            result.credit_earned = result.credit_attempted
        else:
            result.credit_earned = Decimal('0.00')

        result.save()
        return result

    @transaction.atomic
    def compute_semester_aggregate(self, student, semester) -> SemesterAggregate:
        """
        Compute semester-level aggregates for a student.
        """
        results = StudentResult.objects.filter(
            unit_registration__student=student,
            unit_registration__semester_registration__semester=semester,
            is_deleted=False
        ).exclude(status=ResultStatus.WITHDRAWN)

        # Calculate aggregates
        total_marks = results.aggregate(total=Sum('marks'))[
            'total'] or Decimal('0')
        units_taken = results.count()
        credits_attempted = results.aggregate(total=Sum('credit_attempted'))[
            'total'] or Decimal('0')
        credits_earned = results.aggregate(total=Sum('credit_earned'))[
            'total'] or Decimal('0')
        total_grade_points = Decimal('0')

        for result in results:
            total_grade_points += result.grade_points * result.credit_attempted

        # Calculate averages
        term_average = Decimal('0')
        gpa = Decimal('0')

        if units_taken > 0:
            term_average = (
                total_marks / units_taken).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        if credits_attempted > 0:
            gpa = (total_grade_points /
                   credits_attempted).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # Count passed/failed
        units_passed = results.filter(status=ResultStatus.PASS).count()
        units_failed = results.filter(status=ResultStatus.FAIL).count()

        # Create or update aggregate
        aggregate, created = SemesterAggregate.objects.update_or_create(
            student=student,
            semester=semester,
            defaults={
                'total_marks': total_marks,
                'units_taken': units_taken,
                'term_average': term_average,
                'credits_attempted': credits_attempted,
                'credits_earned': credits_earned,
                'total_grade_points': total_grade_points,
                'gpa': gpa,
                'units_passed': units_passed,
                'units_failed': units_failed,
            }
        )

        return aggregate

    @transaction.atomic
    def compute_module_aggregate(self, student, module) -> ModuleAggregate:
        """
        Compute module-level aggregates for a student.
        """
        results = StudentResult.objects.filter(
            unit_registration__student=student,
            unit_registration__module_registration__module=module,
            is_deleted=False
        ).exclude(status=ResultStatus.WITHDRAWN)

        total_marks = results.aggregate(total=Sum('marks'))[
            'total'] or Decimal('0')
        units_taken = results.count()
        credits_attempted = results.aggregate(total=Sum('credit_attempted'))[
            'total'] or Decimal('0')
        credits_earned = results.aggregate(total=Sum('credit_earned'))[
            'total'] or Decimal('0')
        total_grade_points = Decimal('0')

        for result in results:
            total_grade_points += result.grade_points * result.credit_attempted

        module_average = Decimal('0')
        gpa = Decimal('0')

        if units_taken > 0:
            module_average = (
                total_marks / units_taken).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        if credits_attempted > 0:
            gpa = (total_grade_points /
                   credits_attempted).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        units_passed = results.filter(status=ResultStatus.PASS).count()
        units_failed = results.filter(status=ResultStatus.FAIL).count()

        aggregate, created = ModuleAggregate.objects.update_or_create(
            student=student,
            module=module,
            defaults={
                'total_marks': total_marks,
                'units_taken': units_taken,
                'module_average': module_average,
                'credits_attempted': credits_attempted,
                'credits_earned': credits_earned,
                'total_grade_points': total_grade_points,
                'gpa': gpa,
                'units_passed': units_passed,
                'units_failed': units_failed,
            }
        )

        return aggregate

    def compute_aggregates_for_result(self, result: StudentResult):
        """Compute the appropriate aggregates based on the result's registration type."""
        ur = result.unit_registration
        student = ur.student

        if ur.semester_registration:
            self.compute_semester_aggregate(
                student, ur.semester_registration.semester)
        elif ur.module_registration:
            self.compute_module_aggregate(
                student, ur.module_registration.module)

        self.compute_cumulative_aggregate(student)

    @transaction.atomic
    def compute_cumulative_aggregate(self, student) -> CumulativeAggregate:
        """
        Compute cumulative aggregates for a student across all semesters and modules.
        """
        # Gather from semester aggregates
        semester_aggregates = SemesterAggregate.objects.filter(
            student=student,
            is_deleted=False
        ).order_by('semester__year', 'semester__start_date')

        # Gather from module aggregates
        module_aggregates = ModuleAggregate.objects.filter(
            student=student,
            is_deleted=False
        ).order_by('module__module_number')

        # Aggregate across all
        cumulative_marks = Decimal('0')
        cumulative_units = 0
        cumulative_credits_attempted = Decimal('0')
        cumulative_credits_earned = Decimal('0')
        cumulative_grade_points = Decimal('0')
        total_units_passed = 0
        total_units_failed = 0
        last_semester = None

        for agg in semester_aggregates:
            cumulative_marks += agg.total_marks
            cumulative_units += agg.units_taken
            cumulative_credits_attempted += agg.credits_attempted
            cumulative_credits_earned += agg.credits_earned
            cumulative_grade_points += agg.total_grade_points
            total_units_passed += agg.units_passed
            total_units_failed += agg.units_failed
            last_semester = agg.semester

        for agg in module_aggregates:
            cumulative_marks += agg.total_marks
            cumulative_units += agg.units_taken
            cumulative_credits_attempted += agg.credits_attempted
            cumulative_credits_earned += agg.credits_earned
            cumulative_grade_points += agg.total_grade_points
            total_units_passed += agg.units_passed
            total_units_failed += agg.units_failed

        # Calculate cumulative averages
        cumulative_average = Decimal('0')
        cgpa = Decimal('0')

        if cumulative_units > 0:
            cumulative_average = (cumulative_marks / cumulative_units).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

        if cumulative_credits_attempted > 0:
            cgpa = (cumulative_grade_points / cumulative_credits_attempted).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

        # Determine cumulative classification
        cumulative_grade = self._get_classification(cumulative_average)

        # Create or update cumulative aggregate
        aggregate, created = CumulativeAggregate.objects.update_or_create(
            student=student,
            defaults={
                'cumulative_marks': cumulative_marks,
                'cumulative_units': cumulative_units,
                'cumulative_average': cumulative_average,
                'cumulative_credits_attempted': cumulative_credits_attempted,
                'cumulative_credits_earned': cumulative_credits_earned,
                'cumulative_grade_points': cumulative_grade_points,
                'cgpa': cgpa,
                'cumulative_grade': cumulative_grade,
                'total_units_passed': total_units_passed,
                'total_units_failed': total_units_failed,
                'last_semester': last_semester,
            }
        )

        return aggregate

    def _get_classification(self, average: Decimal) -> str:
        """Get overall classification based on average marks."""
        _, _, classification = self.get_grade(average)
        return classification

    @transaction.atomic
    def process_student_results(self, student, semester=None):
        """
        Process all results for a student, optionally for a specific semester.
        Recomputes grades, semester/module aggregates, and cumulative aggregates.
        """
        # Get results to process
        results_query = StudentResult.objects.filter(
            unit_registration__student=student, is_deleted=False)
        if semester:
            results_query = results_query.filter(
                unit_registration__semester_registration__semester=semester)

        # Process each result
        for result in results_query:
            self.process_result(result)

        # Compute semester aggregates
        if semester:
            self.compute_semester_aggregate(student, semester)
        else:
            # Compute for all semesters the student has results in
            from apps.academics.models import Semester
            semester_ids = StudentResult.objects.filter(
                unit_registration__student=student,
                unit_registration__semester_registration__isnull=False,
                is_deleted=False
            ).values_list(
                'unit_registration__semester_registration__semester', flat=True
            ).distinct()
            for sem in Semester.objects.filter(id__in=semester_ids):
                self.compute_semester_aggregate(student, sem)

            # Compute for all modules the student has results in
            from apps.academics.models import Module
            module_ids = StudentResult.objects.filter(
                unit_registration__student=student,
                unit_registration__module_registration__isnull=False,
                is_deleted=False
            ).values_list(
                'unit_registration__module_registration__module', flat=True
            ).distinct()
            for mod in Module.objects.filter(id__in=module_ids):
                self.compute_module_aggregate(student, mod)

        # Compute cumulative aggregate
        self.compute_cumulative_aggregate(student)

    def batch_process_results(self, semester, programme=None):
        """
        Process all results for a semester, optionally filtered by programme.
        """
        from apps.students.models import Student

        students_query = Student.objects.filter(
            unit_registrations__results__isnull=False,
            unit_registrations__semester_registration__semester=semester,
            is_deleted=False
        ).distinct()

        if programme:
            students_query = students_query.filter(programme=programme)

        processed_count = 0
        for student in students_query:
            self.process_student_results(student, semester)
            processed_count += 1

        return processed_count
