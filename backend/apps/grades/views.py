"""
Views for grades app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from decimal import Decimal

from apps.accounts.permissions import IsStaffUser, IsRegistrarUser
from .models import (
    GradingScale, GradeDefinition, StudentResult,
    SemesterAggregate, ModuleAggregate, CumulativeAggregate, MarksUploadBatch
)
from .serializers import (
    GradingScaleSerializer, GradeDefinitionSerializer,
    StudentResultSerializer, StudentResultCreateSerializer,
    MarksEntrySerializer, BulkMarksEntrySerializer,
    SemesterAggregateSerializer, ModuleAggregateSerializer,
    CumulativeAggregateSerializer, MarksUploadBatchSerializer
)
from .engine import GradingEngine


@extend_schema_view(
    list=extend_schema(description='List all grading scales'),
    retrieve=extend_schema(description='Retrieve a specific grading scale'),
    create=extend_schema(description='Create a new grading scale'),
)
class GradingScaleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing grading scales."""
    queryset = GradingScale.objects.prefetch_related('grade_definitions').all()
    serializer_class = GradingScaleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the default grading scale."""
        try:
            scale = GradingScale.objects.get(is_default=True)
            serializer = self.get_serializer(scale)
            return Response(serializer.data)
        except GradingScale.DoesNotExist:
            return Response({'error': 'No default grading scale set'}, status=404)


@extend_schema_view(
    list=extend_schema(description='List all student results'),
    retrieve=extend_schema(description='Retrieve a specific result'),
    create=extend_schema(description='Create a new result'),
    update=extend_schema(description='Update a result'),
    destroy=extend_schema(description='Delete a result'),
)
class StudentResultViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student results."""
    queryset = StudentResult.objects.select_related(
        'unit_registration__semester_registration__student_enrollment__student',
        'unit_registration__unit',
        'unit_registration__semester_registration__semester',
        'unit_registration__module_registration__module'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['unit_registration', 'status', 'is_approved']
    search_fields = ['unit_registration__semester_registration__student_enrollment__student__reg_no',
                     'unit_registration__unit__code']
    ordering_fields = ['marks', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentResultCreateSerializer
        return StudentResultSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsStaffUser()]
        return [IsAuthenticated()]

    @transaction.atomic
    def perform_create(self, serializer):
        """Create result and process grades."""
        result = serializer.save()
        engine = GradingEngine()
        engine.process_result(result)
        force = str(self.request.data.get('force_aggregate', 'false')).lower() == 'true'
        engine.compute_aggregates_for_result(result, force=force)

    @transaction.atomic
    def perform_update(self, serializer):
        """Update result and reprocess grades."""
        result = serializer.save()
        engine = GradingEngine()
        engine.process_result(result)
        force = str(self.request.data.get('force_aggregate', 'false')).lower() == 'true'
        engine.compute_aggregates_for_result(result, force=force)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsStaffUser])
    @transaction.atomic
    def bulk_entry(self, request):
        """Bulk entry of marks for multiple students."""
        serializer = BulkMarksEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.academics.models import Unit, Semester, Module
        from apps.students.models import Student, SemesterRegistrationUnit

        unit_id = serializer.validated_data['unit_id']
        semester_id = serializer.validated_data.get('semester_id')
        module_id = serializer.validated_data.get('module_id')
        results_data = serializer.validated_data['results']

        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            return Response({'error': 'Unit not found'}, status=status.HTTP_400_BAD_REQUEST)

        engine = GradingEngine()
        created_results = []
        errors = []

        for item in results_data:
            try:
                student = Student.objects.get(reg_no=item.get('reg_no'))

                # Find the unit registration for this student + unit
                ur_filter = {'unit': unit}
                if semester_id:
                    ur_filter['semester_registration__student_enrollment__student'] = student
                    ur_filter['semester_registration__semester_id'] = semester_id
                elif module_id:
                    ur_filter['module_registration__student'] = student
                    ur_filter['module_registration__module_id'] = module_id
                else:
                    ur_filter['semester_registration__student_enrollment__student'] = student

                unit_reg = SemesterRegistrationUnit.objects.get(**ur_filter)

                result, created = StudentResult.objects.update_or_create(
                    unit_registration=unit_reg,
                    attempt_number=item.get('attempt_number', 1),
                    defaults={
                        'marks': Decimal(str(item['marks'])),
                        'credit_attempted': Decimal(str(item.get('credit_attempted', unit.credit_hours))),
                        'is_repeat': item.get('is_repeat', False),
                    }
                )

                engine.process_result(result)
                created_results.append(result.id)

            except Student.DoesNotExist:
                errors.append({'reg_no': item.get('reg_no'),
                              'error': 'Student not found'})
            except SemesterRegistrationUnit.DoesNotExist:
                errors.append({'reg_no': item.get('reg_no'),
                              'error': 'Unit registration not found'})
            except Exception as e:
                errors.append({'reg_no': item.get('reg_no'), 'error': str(e)})

        # Recompute aggregates for affected students
        affected_unit_regs = SemesterRegistrationUnit.objects.filter(
            results__id__in=created_results
        ).select_related(
            'semester_registration__student_enrollment__student', 'semester_registration__semester',
            'module_registration__module'
        ).distinct()

        for ur in affected_unit_regs:
            if ur.semester_registration:
                engine.compute_semester_aggregate(
                    ur.student, ur.semester_registration.semester)
            elif ur.module_registration:
                engine.compute_module_aggregate(
                    ur.student, ur.module_registration.module)
            engine.compute_cumulative_aggregate(ur.student)

        return Response({
            'message': f'Processed {len(created_results)} results',
            'created': len(created_results),
            'errors': errors
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    @transaction.atomic
    def approve_results(self, request):
        """Approve multiple results."""
        result_ids = request.data.get('result_ids', [])

        updated = StudentResult.objects.filter(
            id__in=result_ids
        ).update(
            is_approved=True,
            approved_by=request.user,
            approved_at=timezone.now()
        )

        return Response({'message': f'Approved {updated} results'})


@extend_schema_view(
    list=extend_schema(description='List semester aggregates'),
    retrieve=extend_schema(
        description='Retrieve a specific semester aggregate'),
)
class SemesterAggregateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing semester aggregates (read-only)."""
    queryset = SemesterAggregate.objects.select_related(
        'student', 'semester').all()
    serializer_class = SemesterAggregateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'semester']
    ordering_fields = ['gpa', 'term_average']
    ordering = ['-semester__year']


@extend_schema_view(
    list=extend_schema(description='List module aggregates'),
    retrieve=extend_schema(
        description='Retrieve a specific module aggregate'),
)
class ModuleAggregateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing module aggregates (read-only)."""
    queryset = ModuleAggregate.objects.select_related(
        'student', 'module').all()
    serializer_class = ModuleAggregateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'module']
    ordering_fields = ['gpa', 'module_average']
    ordering = ['module__module_number']


@extend_schema_view(
    list=extend_schema(description='List cumulative aggregates'),
    retrieve=extend_schema(
        description='Retrieve a specific cumulative aggregate'),
)
class CumulativeAggregateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing cumulative aggregates (read-only)."""
    queryset = CumulativeAggregate.objects.select_related(
        'student', 'last_semester').all()
    serializer_class = CumulativeAggregateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'cumulative_grade']
    ordering_fields = ['cgpa', 'cumulative_average']
    ordering = ['-cgpa']


class RecomputeGradesView(APIView):
    """View for recomputing grades and aggregates."""
    permission_classes = [IsAuthenticated, IsRegistrarUser]

    @extend_schema(description='Recompute grades for a student or semester')
    @transaction.atomic
    def post(self, request):
        """Recompute grades for specified scope."""
        student_id = request.data.get('student_id')
        semester_id = request.data.get('semester_id')
        programme_id = request.data.get('programme_id')

        engine = GradingEngine()

        if student_id:
            from apps.students.models import Student
            try:
                student = Student.objects.get(id=student_id)
                engine.process_student_results(student)
                return Response({'message': f'Recomputed grades for {student.reg_no}'})
            except Student.DoesNotExist:
                return Response({'error': 'Student not found'}, status=404)

        elif semester_id:
            from apps.academics.models import Semester, Programme
            try:
                semester = Semester.objects.get(id=semester_id)
                programme = Programme.objects.get(
                    id=programme_id) if programme_id else None
                count = engine.batch_process_results(semester, programme)
                return Response({'message': f'Recomputed grades for {count} students'})
            except Semester.DoesNotExist:
                return Response({'error': 'Semester not found'}, status=404)

        return Response(
            {'error': 'Please provide student_id or semester_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
