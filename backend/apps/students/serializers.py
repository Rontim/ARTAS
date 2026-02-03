"""
Serializers for students app.
"""
from rest_framework import serializers
from .models import Student, StudentEnrollment


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model."""
    full_name = serializers.ReadOnlyField()
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)
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
            'programme', 'programme_name', 'department_name', 'school_name',
            'admission_year', 'admission_semester', 'current_year_of_study',
            'status', 'graduation_date', 'photo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student lists."""
    full_name = serializers.ReadOnlyField()
    programme_name = serializers.CharField(
        source='programme.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'full_name', 'programme_name',
            'admission_year', 'current_year_of_study', 'status'
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
            'current_year_of_study', 'status', 'photo'
        ]

    def validate_reg_no(self, value):
        """Validate registration number is unique."""
        if Student.objects.filter(reg_no=value).exists():
            raise serializers.ValidationError(
                'A student with this registration number already exists.')
        return value


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for student enrollment."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'semester', 'semester_name', 'year_of_study',
            'is_repeat', 'enrollment_date', 'created_at'
        ]
        read_only_fields = ['id', 'enrollment_date', 'created_at']


class StudentBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk student upload."""
    file = serializers.FileField()
    programme = serializers.UUIDField()
    admission_year = serializers.IntegerField()
