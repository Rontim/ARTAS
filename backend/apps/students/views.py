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
from .models import Student, SemesterRegistration, ModuleRegistration, UnitRegistration
from .serializers import (
    StudentSerializer, StudentListSerializer, StudentCreateSerializer,
    SemesterRegistrationSerializer, ModuleRegistrationSerializer,
    UnitRegistrationSerializer
)


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
    queryset = Student.objects.select_related(
        'programme', 'programme__department', 'programme__department__school'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['programme', 'status', 'admission_year']
    search_fields = ['reg_no', 'first_name', 'last_name', 'email']
    ordering_fields = ['reg_no', 'first_name',
                       'last_name', 'admission_year', 'created_at']
    ordering = ['reg_no']

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action == 'create':
            return StudentCreateSerializer
        return StudentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all semester registrations for a student."""
        student = self.get_object()
        registrations = student.semester_registrations.select_related(
            'semester').all()
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
        registrations = student.unit_registrations.select_related(
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
            unit_registration__student=student
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
        students = self.queryset.filter(programme_id=programme_id)
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
        'student', 'semester').all()
    serializer_class = SemesterRegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'semester', 'year_of_study', 'is_repeat']
    ordering_fields = ['registration_date', 'year_of_study']
    ordering = ['-registration_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]


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
    queryset = UnitRegistration.objects.select_related(
        'student', 'unit',
        'semester_registration__semester',
        'module_registration__module'
    ).all()
    serializer_class = UnitRegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'unit', 'semester_registration',
                        'module_registration', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]
