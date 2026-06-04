"""
Views for students app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from apps.accounts.permissions import IsStaffUser, IsRegistrarUser
from .models import Student, StudentEnrollment, SemesterRegistration, ModuleRegistration, SemesterRegistrationUnit
from .serializers import (
    StudentSerializer, StudentListSerializer, StudentCreateSerializer,
    SemesterRegistrationSerializer, ModuleRegistrationSerializer,
    UnitRegistrationSerializer
)

from core.logging import get_logger

logger = get_logger(__name__)


@extend_schema_view(
    list=extend_schema(description='List all students with filtering'),
    retrieve=extend_schema(description='Retrieve a specific student'),
    create=extend_schema(description='Create a new student'),
    update=extend_schema(description='Update a student'),
    partial_update=extend_schema(description='Partially update a student'),
    destroy=extend_schema(description='Delete a student'),
)
class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing students."""
    queryset = Student.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = []
    search_fields = ['reg_no', 'first_name', 'last_name', 'email']
    ordering_fields = ['reg_no', 'first_name', 'last_name', 'created_at']
    ordering = ['reg_no']

    def get_queryset(self):
        queryset = super().get_queryset()
        programme_id = self.request.query_params.get('programme')
        if programme_id:
            queryset = queryset.filter(enrollments__programme_id=programme_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(enrollments__current_status=status_filter)
            
        admission_year_filter = self.request.query_params.get('admission_year')
        if admission_year_filter:
            queryset = queryset.filter(enrollments__admission_date__year=admission_year_filter)
            
        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action == 'create':
            return StudentCreateSerializer
        return StudentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsRegistrarUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all semester registrations for a student."""
        student = self.get_object()
        registrations = SemesterRegistration.objects.filter(
            student_enrollment__student=student
        ).select_related('semester').all()
        serializer = SemesterRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def module_registrations(self, request, pk=None):
        """Get all module registrations for a student."""
        student = self.get_object()
        registrations = student.module_registrations.select_related(
            'module', 'module__programme').all()
        serializer = ModuleRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def unit_registrations(self, request, pk=None):
        """Get all unit registrations for a student."""
        student = self.get_object()
        registrations = SemesterRegistrationUnit.objects.filter(
            semester_registration__student_enrollment__student=student
        ).select_related(
            'unit', 'semester_registration__semester',
            'module_registration__module'
        ).all()
        serializer = UnitRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all academic results for a student."""
        student = self.get_object()
        from apps.grades.serializers import StudentResultSerializer
        from apps.grades.models import StudentResult
        results = StudentResult.objects.filter(
            unit_registration__semester_registration__student_enrollment__student=student
        ).select_related(
            'unit_registration__unit',
            'unit_registration__semester_registration__semester',
            'unit_registration__module_registration__module'
        ).all()
        serializer = StudentResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_programme(self, request):
        """Get students grouped by programme."""
        programme_id = request.query_params.get('programme_id')
        if not programme_id:
            return Response(
                {'error': 'programme_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        students = Student.objects.filter(enrollments__programme_id=programme_id).distinct()
        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(description='List all semester registrations'),
    retrieve=extend_schema(description='Retrieve a specific registration'),
    create=extend_schema(description='Create a new semester registration'),
    destroy=extend_schema(description='Delete a registration'),
)
class SemesterRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing semester registrations."""
    queryset = SemesterRegistration.objects.select_related(
        'student_enrollment', 'student_enrollment__student', 'semester').all()
    serializer_class = SemesterRegistrationSerializer
    permission_classes = [IsRegistrarUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student_enrollment', 'semester', 'program_year']
    ordering_fields = ['registration_date', 'program_year']
    ordering = ['-registration_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_enrollment__student_id=student_id)
        return queryset

    def perform_create(self, serializer):
        from django.db import transaction
        from apps.academics.models import SemesterUnit
        from .models import SemesterRegistrationUnit

        # Pop unit_ids so they are not passed to the SemesterRegistration.objects.create()
        unit_ids = serializer.validated_data.pop('unit_ids', [])

        with transaction.atomic():
            instance = serializer.save()

            if unit_ids:
                # Get the student's programme
                programme = instance.student_enrollment.programme

                # Get the semester units for these units in this semester/programme
                semester_units = SemesterUnit.objects.filter(
                    semester=instance.semester,
                    programme=programme,
                    unit_id__in=unit_ids
                )

                # Create unit registrations
                unit_regs = [
                    SemesterRegistrationUnit(
                        semester_registration=instance,
                        unit=su.unit,
                        semester_unit=su,
                        unit_status='registered'
                    ) for su in semester_units
                ]
                SemesterRegistrationUnit.objects.bulk_create(unit_regs)

    def perform_update(self, serializer):
        from django.db import transaction
        from apps.academics.models import SemesterUnit
        from .models import SemesterRegistrationUnit

        # Pop unit_ids so they are not passed to the SemesterRegistration.objects.update()
        unit_ids = serializer.validated_data.pop('unit_ids', None)

        with transaction.atomic():
            instance = serializer.save()
            
            if unit_ids is not None:  # If unit_ids was provided in the update
                # Get existing registrations for this semester enrollment
                existing_regs = SemesterRegistrationUnit.objects.filter(semester_registration=instance)
                existing_unit_ids = set(existing_regs.values_list('unit_id', flat=True))

                # Identify units to add and remove
                to_add = set(unit_ids) - existing_unit_ids
                to_remove = existing_unit_ids - set(unit_ids)

                # Remove units
                if to_remove:
                    existing_regs.filter(unit_id__in=to_remove).delete()

                # Add units
                if to_add:
                    programme = instance.student_enrollment.programme
                    semester_units = SemesterUnit.objects.filter(
                        semester=instance.semester,
                        programme=programme,
                        unit_id__in=to_add
                    )
                    unit_regs = [
                        SemesterRegistrationUnit(
                            semester_registration=instance,
                            unit=su.unit,
                            semester_unit=su,
                            unit_status='registered'
                        ) for su in semester_units
                    ]
                    SemesterRegistrationUnit.objects.bulk_create(unit_regs)


@extend_schema_view(
    list=extend_schema(description='List all module registrations'),
    retrieve=extend_schema(
        description='Retrieve a specific module registration'),
    create=extend_schema(description='Create a new module registration'),
    destroy=extend_schema(description='Delete a module registration'),
)
class ModuleRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing module registrations."""
    queryset = ModuleRegistration.objects.select_related(
        'student', 'module', 'module__programme').all()
    serializer_class = ModuleRegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'module', 'is_repeat']
    ordering_fields = ['registration_date']
    ordering = ['-registration_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]


@extend_schema_view(
    list=extend_schema(description='List all unit registrations'),
    retrieve=extend_schema(
        description='Retrieve a specific unit registration'),
    create=extend_schema(description='Create a new unit registration'),
    destroy=extend_schema(description='Delete a unit registration'),
)
class UnitRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing unit registrations."""
    queryset = SemesterRegistrationUnit.objects.select_related(
        'semester_registration__student_enrollment__student', 'unit',
        'semester_registration__semester',
        'module_registration__module'
    ).all()
    serializer_class = UnitRegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['semester_registration', 'unit', 'unit_status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(semester_registration__student_enrollment__student_id=student_id)
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]
