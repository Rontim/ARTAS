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
from .models import Student, StudentEnrollment
from .serializers import (
    StudentSerializer, StudentListSerializer, StudentCreateSerializer,
    StudentEnrollmentSerializer
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
    filterset_fields = ['programme', 'status',
                        'admission_year', 'current_year_of_study']
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
    def enrollments(self, request, pk=None):
        """Get all enrollments for a student."""
        student = self.get_object()
        enrollments = student.enrollments.select_related('semester').all()
        serializer = StudentEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all academic results for a student."""
        student = self.get_object()
        from apps.grades.serializers import StudentResultSerializer
        results = student.results.select_related('unit', 'semester').all()
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
    list=extend_schema(description='List all student enrollments'),
    retrieve=extend_schema(description='Retrieve a specific enrollment'),
    create=extend_schema(description='Create a new enrollment'),
    destroy=extend_schema(description='Delete an enrollment'),
)
class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student enrollments."""
    queryset = StudentEnrollment.objects.select_related(
        'student', 'semester').all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'semester', 'year_of_study', 'is_repeat']
    ordering_fields = ['enrollment_date', 'year_of_study']
    ordering = ['-enrollment_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]
