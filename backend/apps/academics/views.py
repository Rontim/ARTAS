"""
Views for academics app.
"""
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.accounts.permissions import IsAdminOrReadOnly, IsRegistrarUser
from .models import (
    School, Department, Programme, Unit, ProgrammeUnit,
    AcademicYear, Semester, SemesterUnit, Module
)
from .serializers import (
    SchoolSerializer, DepartmentSerializer, ProgrammeSerializer,
    ProgrammeListSerializer, UnitSerializer, UnitListSerializer,
    ProgrammeUnitSerializer, AcademicYearSerializer, SemesterSerializer,
    SemesterListSerializer, SemesterUnitSerializer, ModuleSerializer
)


@extend_schema_view(
    list=extend_schema(description='List all schools'),
    retrieve=extend_schema(description='Retrieve a specific school'),
    create=extend_schema(description='Create a new school'),
    update=extend_schema(description='Update a school'),
    destroy=extend_schema(description='Delete a school'),
)
class SchoolViewSet(viewsets.ModelViewSet):
    """ViewSet for managing schools."""
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def departments(self, request, pk=None):
        """Get all departments in a school."""
        school = self.get_object()
        departments = school.departments.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(description='List all departments'),
    retrieve=extend_schema(description='Retrieve a specific department'),
    create=extend_schema(description='Create a new department'),
    update=extend_schema(description='Update a department'),
    destroy=extend_schema(description='Delete a department'),
)
class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing departments."""
    queryset = Department.objects.select_related('school').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['school']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'school__name']
    ordering = ['school__name', 'name']

    @action(detail=True, methods=['get'])
    def programmes(self, request, pk=None):
        """Get all programmes in a department."""
        department = self.get_object()
        programmes = department.programmes.all()
        serializer = ProgrammeListSerializer(programmes, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(description='List all programmes'),
    retrieve=extend_schema(description='Retrieve a specific programme'),
    create=extend_schema(description='Create a new programme'),
    update=extend_schema(description='Update a programme'),
    destroy=extend_schema(description='Delete a programme'),
)
class ProgrammeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing programmes."""
    queryset = Programme.objects.select_related(
        'department', 'department__school').all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department',
                        'programme_type', 'structure', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'department__name']
    ordering = ['code']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProgrammeListSerializer
        return ProgrammeSerializer

    @action(detail=True, methods=['get'])
    def curriculum(self, request, pk=None):
        """Get the curriculum (programme units) for a programme."""
        programme = self.get_object()
        units = ProgrammeUnit.objects.filter(
            programme=programme).select_related('unit')
        serializer = ProgrammeUnitSerializer(units, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students enrolled in a programme."""
        programme = self.get_object()
        from apps.students.serializers import StudentListSerializer
        students = programme.students.filter(status='active')
        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(description='List all units'),
    retrieve=extend_schema(description='Retrieve a specific unit'),
    create=extend_schema(description='Create a new unit'),
    update=extend_schema(description='Update a unit'),
    destroy=extend_schema(description='Delete a unit'),
)
class UnitViewSet(viewsets.ModelViewSet):
    """ViewSet for managing units."""
    queryset = Unit.objects.prefetch_related('prerequisites').all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['unit_type', 'is_active', 'recommended_year']
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name', 'credit_hours']
    ordering = ['code']

    def get_serializer_class(self):
        if self.action == 'list':
            return UnitListSerializer
        return UnitSerializer


@extend_schema_view(
    list=extend_schema(description='List all programme units'),
    retrieve=extend_schema(description='Retrieve a specific programme unit'),
    create=extend_schema(description='Create a new programme unit'),
    update=extend_schema(description='Update a programme unit'),
    destroy=extend_schema(description='Delete a programme unit'),
)
class ProgrammeUnitViewSet(viewsets.ModelViewSet):
    """ViewSet for managing programme curriculum."""
    queryset = ProgrammeUnit.objects.select_related('programme', 'unit').all()
    serializer_class = ProgrammeUnitSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['programme', 'year_of_study',
                        'semester_number', 'is_mandatory']
    ordering_fields = ['year_of_study', 'semester_number']
    ordering = ['programme', 'year_of_study', 'semester_number']


@extend_schema_view(
    list=extend_schema(description='List all academic years'),
    retrieve=extend_schema(description='Retrieve a specific academic year'),
    create=extend_schema(description='Create a new academic year'),
    update=extend_schema(description='Update an academic year'),
    destroy=extend_schema(description='Delete an academic year'),
)
class AcademicYearViewSet(viewsets.ModelViewSet):
    """ViewSet for managing academic years."""
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_current']
    ordering_fields = ['year']
    ordering = ['-year']

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current academic year."""
        try:
            current_year = AcademicYear.objects.get(is_current=True)
            serializer = self.get_serializer(current_year)
            return Response(serializer.data)
        except AcademicYear.DoesNotExist:
            return Response({'error': 'No current academic year set'}, status=404)

    @action(detail=True, methods=['get'])
    def semesters(self, request, pk=None):
        """Get all semesters in an academic year."""
        academic_year = self.get_object()
        semesters = academic_year.semesters.all()
        serializer = SemesterSerializer(semesters, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(description='List all semesters'),
    retrieve=extend_schema(description='Retrieve a specific semester'),
    create=extend_schema(description='Create a new semester'),
    update=extend_schema(description='Update a semester'),
    destroy=extend_schema(description='Delete a semester'),
)
class SemesterViewSet(viewsets.ModelViewSet):
    """ViewSet for managing semesters."""
    queryset = Semester.objects.select_related('academic_year').all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['academic_year', 'semester_type', 'is_active', 'year']
    ordering_fields = ['year', 'start_date']
    ordering = ['-year', '-start_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return SemesterListSerializer
        return SemesterSerializer

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current active semester."""
        try:
            current_semester = Semester.objects.get(is_active=True)
            serializer = SemesterSerializer(current_semester)
            return Response(serializer.data)
        except Semester.DoesNotExist:
            return Response({'error': 'No active semester set'}, status=404)


@extend_schema_view(
    list=extend_schema(description='List all semester unit offerings'),
    retrieve=extend_schema(description='Retrieve a specific semester unit'),
    create=extend_schema(description='Create a new semester unit offering'),
    update=extend_schema(description='Update a semester unit'),
    destroy=extend_schema(description='Delete a semester unit'),
)
class SemesterUnitViewSet(viewsets.ModelViewSet):
    """ViewSet for managing semester unit offerings."""
    queryset = SemesterUnit.objects.select_related(
        'semester', 'unit', 'programme').all()
    serializer_class = SemesterUnitSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['semester', 'programme']
    search_fields = ['unit__code', 'unit__name', 'lecturer']


@extend_schema_view(
    list=extend_schema(description='List all modules'),
    retrieve=extend_schema(description='Retrieve a specific module'),
    create=extend_schema(description='Create a new module'),
    update=extend_schema(description='Update a module'),
    destroy=extend_schema(description='Delete a module'),
)
class ModuleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing modules (module-based programmes)."""
    queryset = Module.objects.select_related('programme').all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['programme', 'is_active']
    search_fields = ['name', 'programme__code']
    ordering_fields = ['module_number', 'programme__code']
    ordering = ['programme', 'module_number']

    @action(detail=True, methods=['get'])
    def units(self, request, pk=None):
        """Get all units in a module."""
        module = self.get_object()
        programme_units = ProgrammeUnit.objects.filter(
            module=module).select_related('unit')
        serializer = ProgrammeUnitSerializer(programme_units, many=True)
        return Response(serializer.data)
