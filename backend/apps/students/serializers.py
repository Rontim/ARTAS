"""
Serializers for students app.
"""
from rest_framework import serializers
from .models import (
    Student, SemesterRegistration, ModuleRegistration, UnitRegistration
)


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model."""
    full_name = serializers.ReadOnlyField()
    current_year_of_study = serializers.ReadOnlyField()
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)
    programme_structure = serializers.CharField(
        source='programme.structure', read_only=True)
    department_name = serializers.CharField(
        source='programme.department.name', read_only=True)
    school_name = serializers.CharField(
        source='programme.department.school.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'first_name', 'middle_name', 'last_name', 'full_name',
            'email', 'phone_number', 'address',
            'date_of_birth', 'gender', 'nationality', 'national_id',
            'programme', 'programme_name', 'programme_structure',
            'department_name', 'school_name',
            'admission_year', 'admission_semester', 'current_year_of_study',
            'status', 'graduation_date', 'photo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student lists."""
    full_name = serializers.ReadOnlyField()
    current_year_of_study = serializers.ReadOnlyField()
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)
    programme_structure = serializers.CharField(
        source='programme.structure', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'full_name', 'programme_name',
            'programme_structure', 'admission_year',
            'current_year_of_study', 'status'
        ]


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating students."""

    class Meta:
        model = Student
        fields = [
            'reg_no', 'first_name', 'middle_name', 'last_name',
            'email', 'phone_number', 'address',
            'date_of_birth', 'gender', 'nationality', 'national_id',
            'programme', 'admission_year', 'admission_semester',
            'status', 'photo'
        ]

    def validate_reg_no(self, value):
        """Validate registration number is unique."""
        if Student.objects.filter(reg_no=value).exists():
            raise serializers.ValidationError(
                'A student with this registration number already exists.')
        return value


class SemesterRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for semester registration."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)

    class Meta:
        model = SemesterRegistration
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'semester', 'semester_name', 'year_of_study',
            'is_repeat', 'registration_date', 'created_at'
        ]
        read_only_fields = ['id', 'registration_date', 'created_at']


class ModuleRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for module registration."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    module_name = serializers.CharField(
        source='module.name', read_only=True)
    programme_name = serializers.CharField(
        source='module.programme.name', read_only=True)

    class Meta:
        model = ModuleRegistration
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'module', 'module_name', 'programme_name',
            'is_repeat', 'registration_date', 'created_at'
        ]
        read_only_fields = ['id', 'registration_date', 'created_at']


class UnitRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for unit registration."""
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    context_name = serializers.SerializerMethodField()

    class Meta:
        model = UnitRegistration
        fields = [
            'id', 'student', 'student_reg_no', 'student_name',
            'unit', 'unit_code', 'unit_name',
            'semester_registration', 'module_registration', 'semester_unit',
            'status', 'context_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_context_name(self, obj):
        if obj.semester_registration:
            return obj.semester_registration.semester.name
        elif obj.module_registration:
            return obj.module_registration.module.name
        return None


class StudentBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk student upload."""
    file = serializers.FileField()
    programme = serializers.UUIDField()
    admission_year = serializers.IntegerField()
