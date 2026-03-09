"""
Serializers for academics app.
"""
from rest_framework import serializers
from .models import (
    School, Department, Programme, Unit, ProgrammeUnit,
    AcademicYear, Semester, SemesterUnit, Module
)


class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School model."""
    department_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'code', 'description',
                  'dean', 'department_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_department_count(self, obj):
        return obj.departments.count()


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model."""
    school_name = serializers.CharField(source='school.name', read_only=True)
    programme_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'school', 'school_name',
            'head_of_department', 'description', 'programme_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_programme_count(self, obj):
        return obj.programmes.count()


class ProgrammeSerializer(serializers.ModelSerializer):
    """Serializer for Programme model."""
    department_name = serializers.CharField(
        source='department.name', read_only=True)
    school_name = serializers.CharField(
        source='department.school.name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Programme
        fields = [
            'id', 'name', 'code', 'department', 'department_name', 'school_name',
            'programme_type', 'structure', 'duration_years', 'total_credits_required',
            'description', 'is_active', 'student_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_student_count(self, obj):
        return obj.students.filter(status='active').count()


class ProgrammeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for programme lists."""
    department_name = serializers.CharField(
        source='department.name', read_only=True)

    class Meta:
        model = Programme
        fields = ['id', 'name', 'code', 'department_name',
                  'programme_type', 'structure', 'is_active']


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for Unit model."""
    prerequisites_list = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'code', 'name', 'description', 'credit_hours', 'unit_type',
            'prerequisites', 'prerequisites_list', 'recommended_year',
            'recommended_semester', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_prerequisites_list(self, obj):
        return [{'id': str(u.id), 'code': u.code, 'name': u.name} for u in obj.prerequisites.all()]


class UnitListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for unit lists."""

    class Meta:
        model = Unit
        fields = ['id', 'code', 'name',
                  'credit_hours', 'unit_type', 'is_active']


class ProgrammeUnitSerializer(serializers.ModelSerializer):
    """Serializer for programme curriculum."""
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    credit_hours = serializers.DecimalField(
        source='unit.credit_hours', max_digits=4, decimal_places=2, read_only=True)
    module_name = serializers.CharField(
        source='module.name', read_only=True, default=None)

    class Meta:
        model = ProgrammeUnit
        fields = [
            'id', 'programme', 'programme_name', 'unit', 'unit_code', 'unit_name',
            'credit_hours', 'year_of_study', 'semester_number',
            'module', 'module_name', 'is_mandatory'
        ]
        read_only_fields = ['id']


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer for Module model."""
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)
    programme_code = serializers.CharField(
        source='programme.code', read_only=True)
    unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            'id', 'programme', 'programme_name', 'programme_code',
            'name', 'module_number', 'description', 'is_active',
            'unit_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_unit_count(self, obj):
        return obj.module_units.count()


class AcademicYearSerializer(serializers.ModelSerializer):
    """Serializer for academic year."""
    semester_count = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = [
            'id', 'year', 'name', 'start_date', 'end_date',
            'is_current', 'semester_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_semester_count(self, obj):
        return obj.semesters.count()


class SemesterSerializer(serializers.ModelSerializer):
    """Serializer for semester."""
    academic_year_name = serializers.CharField(
        source='academic_year.name', read_only=True)

    class Meta:
        model = Semester
        fields = [
            'id', 'academic_year', 'academic_year_name', 'name', 'semester_type',
            'year', 'start_date', 'end_date', 'registration_deadline',
            'marks_submission_deadline', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SemesterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for semester lists."""

    class Meta:
        model = Semester
        fields = ['id', 'name', 'semester_type', 'year', 'is_active']


class SemesterUnitSerializer(serializers.ModelSerializer):
    """Serializer for semester unit offerings."""
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)

    class Meta:
        model = SemesterUnit
        fields = [
            'id', 'semester', 'semester_name', 'unit', 'unit_code', 'unit_name',
            'programme', 'programme_name', 'lecturer', 'max_students'
        ]
        read_only_fields = ['id']
