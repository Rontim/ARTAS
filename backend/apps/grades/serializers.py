"""
Serializers for grades app.
"""
from rest_framework import serializers
from .models import (
    GradingScale, GradeDefinition, StudentResult,
    SemesterAggregate, CumulativeAggregate, MarksUploadBatch
)


class GradeDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for grade definitions."""

    class Meta:
        model = GradeDefinition
        fields = [
            'id', 'grade', 'min_marks', 'max_marks',
            'grade_points', 'classification', 'description'
        ]
        read_only_fields = ['id']


class GradingScaleSerializer(serializers.ModelSerializer):
    """Serializer for grading scale with definitions."""
    grade_definitions = GradeDefinitionSerializer(many=True, read_only=True)

    class Meta:
        model = GradingScale
        fields = ['id', 'name', 'is_default', 'description',
                  'grade_definitions', 'created_at']
        read_only_fields = ['id', 'created_at']


class StudentResultSerializer(serializers.ModelSerializer):
    """Serializer for student results."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)

    class Meta:
        model = StudentResult
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'unit', 'unit_code', 'unit_name',
            'semester', 'semester_name',
            'marks', 'grade', 'grade_points',
            'credit_attempted', 'credit_earned',
            'status', 'is_approved', 'is_repeat', 'attempt_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'grade', 'grade_points', 'credit_earned',
            'status', 'is_approved', 'created_at', 'updated_at'
        ]


class StudentResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating student results."""

    class Meta:
        model = StudentResult
        fields = [
            'student', 'unit', 'semester', 'marks',
            'credit_attempted', 'is_repeat', 'attempt_number'
        ]

    def validate(self, attrs):
        # Check for duplicate result (same student, unit, semester, attempt)
        existing = StudentResult.objects.filter(
            student=attrs['student'],
            unit=attrs['unit'],
            semester=attrs['semester'],
            attempt_number=attrs.get('attempt_number', 1),
            is_deleted=False
        ).exists()

        if existing:
            raise serializers.ValidationError(
                'A result already exists for this student, unit, semester, and attempt.'
            )

        return attrs


class MarksEntrySerializer(serializers.Serializer):
    """Serializer for single marks entry."""
    student_id = serializers.UUIDField()
    unit_id = serializers.UUIDField()
    semester_id = serializers.UUIDField()
    marks = serializers.DecimalField(max_digits=5, decimal_places=2)
    credit_attempted = serializers.DecimalField(max_digits=4, decimal_places=2)
    is_repeat = serializers.BooleanField(default=False)


class BulkMarksEntrySerializer(serializers.Serializer):
    """Serializer for bulk marks entry."""
    unit_id = serializers.UUIDField()
    semester_id = serializers.UUIDField()
    results = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


class SemesterAggregateSerializer(serializers.ModelSerializer):
    """Serializer for semester aggregates."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)

    class Meta:
        model = SemesterAggregate
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'semester', 'semester_name',
            'total_marks', 'units_taken', 'term_average',
            'credits_attempted', 'credits_earned',
            'total_grade_points', 'gpa',
            'units_passed', 'units_failed',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CumulativeAggregateSerializer(serializers.ModelSerializer):
    """Serializer for cumulative aggregates."""
    student_name = serializers.CharField(
        source='student.full_name', read_only=True)
    student_reg_no = serializers.CharField(
        source='student.reg_no', read_only=True)

    class Meta:
        model = CumulativeAggregate
        fields = [
            'id', 'student', 'student_name', 'student_reg_no',
            'cumulative_marks', 'cumulative_units', 'cumulative_average',
            'cumulative_credits_attempted', 'cumulative_credits_earned',
            'cumulative_grade_points', 'cgpa', 'cumulative_grade',
            'total_units_passed', 'total_units_failed',
            'last_semester', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MarksUploadBatchSerializer(serializers.ModelSerializer):
    """Serializer for marks upload batches."""
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    semester_name = serializers.CharField(
        source='semester.name', read_only=True)
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = MarksUploadBatch
        fields = [
            'id', 'semester', 'semester_name', 'unit', 'unit_code',
            'uploaded_by', 'uploaded_by_name', 'file_name',
            'total_records', 'successful_records', 'failed_records',
            'errors', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StudentTranscriptDataSerializer(serializers.Serializer):
    """Serializer for student transcript data."""
    student = serializers.DictField()
    results_by_semester = serializers.ListField()
    cumulative = serializers.DictField()
