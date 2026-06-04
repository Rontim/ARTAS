"""
Serializers for students app.
"""
from rest_framework import serializers
from apps.academics.models import Programme
from .models import (
    Student, StudentEnrollment, SemesterRegistration, ModuleRegistration, SemesterRegistrationUnit
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
    
    # Allow writing programme and status
    programme = serializers.PrimaryKeyRelatedField(
        queryset=Programme.objects.all(), required=False)
    status = serializers.CharField(required=False)

    class Meta:
        model = Student
        fields = [
            'id', 'reg_no', 'first_name', 'middle_name', 'last_name', 'full_name',
            'email', 'phone_number', 'address',
            'date_of_birth', 'gender', 'nationality', 'national_id',
            'programme', 'programme_name', 'programme_structure',
            'department_name', 'school_name',
            'admission_year', 'current_year_of_study',
            'is_semester_based', 'is_module_based',
            'status', 'graduation_date', 'photo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        programme = validated_data.pop('programme', None)
        status = validated_data.pop('status', None)
        
        # Update student fields
        instance = super().update(instance, validated_data)
        
        # Update enrollment fields
        enrollment = instance.active_enrollment
        if enrollment:
            if programme:
                enrollment.programme = programme
            if status:
                enrollment.current_status = status
            enrollment.save()
            
        return instance


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
    programme = serializers.PrimaryKeyRelatedField(
        queryset=Programme.objects.all(), write_only=True, required=True)
    cohort = serializers.CharField(write_only=True, required=False)
    admission_date = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            'reg_no', 'first_name', 'middle_name', 'last_name',
            'email', 'phone_number', 'address',
            'date_of_birth', 'gender', 'nationality', 'national_id',
            'programme', 'admission_year',
            'status', 'photo', 'cohort', 'admission_date'
        ]

    def validate_reg_no(self, value):
        """Validate registration number is unique."""
        if Student.objects.filter(reg_no=value).exists():
            raise serializers.ValidationError(
                'A student with this registration number already exists.')
        return value

    def create(self, validated_data):
        from django.utils import timezone
        programme = validated_data.pop('programme')
        admission_year = validated_data.pop('admission_year', timezone.now().year)
        admission_semester = validated_data.pop('admission_semester', None)
        status = validated_data.pop('status', 'active')
        cohort = validated_data.pop('cohort', f"{admission_year}")
        admission_date = validated_data.pop('admission_date', timezone.now().date())
        
        student = Student.objects.create(**validated_data)
        
        StudentEnrollment.objects.create(
            student=student,
            programme=programme,
            admission_date=admission_date,
            cohort=cohort,
            current_status=status,
            admission_semester=admission_semester
        )
        return student


class UnitRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for unit registration."""
    student = serializers.SerializerMethodField()
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    credit_hours = serializers.DecimalField(
        source='unit.credit_hours', max_digits=4, decimal_places=2, read_only=True)
    context_name = serializers.SerializerMethodField()
    status = serializers.CharField(source='unit_status', required=False)

    class Meta:
        model = SemesterRegistrationUnit
        fields = [
            'id', 'student', 'student_reg_no', 'student_name',
            'unit', 'unit_code', 'unit_name', 'credit_hours',
            'semester_registration', 'module_registration', 'semester_unit',
            'status', 'context_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_student(self, obj):
        return str(obj.student.id)

    def get_context_name(self, obj):
        if obj.semester_registration:
            return obj.semester_registration.semester.name
        elif obj.module_registration:
            return obj.module_registration.module.name
        return None


class SemesterRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for semester registration."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)

    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, required=True
    )
    year_of_study = serializers.IntegerField(source='program_year', required=True)

    unit_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    units = UnitRegistrationSerializer(
        many=True, read_only=True, source='unit_registrations')

    class Meta:
        model = SemesterRegistration
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'semester', 'semester_name', 'year_of_study',
            'registration_date', 'unit_ids', 'units', 'created_at', 'status'
        ]
        read_only_fields = ['id', 'registration_date', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['student'] = str(instance.student_enrollment.student.id)
        # Handle deprecated properties
        ret['is_repeat'] = instance.is_repeat
        return ret

    def create(self, validated_data):
        student = validated_data.pop('student', None)
        if student:
            enrollment = student.enrollments.filter(current_status='active').first() or student.enrollments.first()
            if not enrollment:
                raise serializers.ValidationError({"student": "Student has no active enrollment. Please enroll the student first."})
            validated_data['student_enrollment'] = enrollment
            validated_data['academic_year'] = validated_data['semester'].academic_year
        return super().create(validated_data)


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


class StudentBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk student upload."""
    file = serializers.FileField()
    programme = serializers.UUIDField()
    admission_year = serializers.IntegerField()
