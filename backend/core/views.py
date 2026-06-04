"""
Views for core app: dashboard stats and activity feed.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from .models import ActivityLog
from .serializers import ActivityLogSerializer, DashboardStatsSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Activity log feed.
    Admin sees all activities; other users see only their own.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['action', 'entity_type', 'user']
    search_fields = ['description', 'entity_type']

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.select_related('user')
        if user.is_admin():
            return qs
        return qs.filter(user=user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Return aggregate counts for the dashboard."""
    from apps.students.models import Student, StudentEnrollment
    from apps.academics.models import Programme, Unit
    from apps.transcripts.models import Transcript
    from apps.accounts.models import User

    today = timezone.now().date()

    stats = {
        'total_students': Student.objects.count(),
        'active_students': StudentEnrollment.objects.filter(
            current_status='active'
        ).values('student').distinct().count(),
        'total_programmes': Programme.objects.count(),
        'total_units': Unit.objects.count(),
        'transcripts_generated': Transcript.objects.filter(
            status__in=['generated', 'issued']
        ).count(),
        'pending_requests': Transcript.objects.filter(status='draft').count(),
        'approved_today': Transcript.objects.filter(
            status='issued', issued_at__date=today
        ).count(),
        'total_users': User.objects.filter(is_active=True).count(),
    }

    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_extended(request):
    """Return rich dashboard data: status breakdown, top programmes, grade distribution, recent students."""
    from apps.students.models import Student, StudentEnrollment
    from apps.academics.models import Programme
    from apps.grades.models import StudentResult
    from django.db.models import Count, Q
    from django.db.models.functions import ExtractYear

    # Student status breakdown (via StudentEnrollment.current_status)
    status_qs = (
        StudentEnrollment.objects
        .values('current_status')
        .annotate(count=Count('student', distinct=True))
        .order_by('-count')
    )
    student_status = {row['current_status']: row['count'] for row in status_qs}

    # Top 5 programmes by active enrollment
    top_programmes = list(
        Programme.objects
        .annotate(student_count=Count(
            'enrollments__student',
            filter=Q(enrollments__current_status='active'),
            distinct=True
        ))
        .filter(student_count__gt=0)
        .order_by('-student_count')
        .values('code', 'name', 'student_count')[:5]
    )

    # Grade distribution
    grade_qs = (
        StudentResult.objects.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    grade_distribution = {row['status']: row['count'] for row in grade_qs}

    # Recent 5 students — join through active enrollment for programme and status
    recent_qs = (
        Student.objects
        .prefetch_related('enrollments__programme')
        .order_by('-created_at')[:5]
    )
    recent_students = []
    for s in recent_qs:
        enrollment = s.active_enrollment
        recent_students.append({
            'id': str(s.id),
            'reg_no': s.reg_no,
            'first_name': s.first_name,
            'last_name': s.last_name,
            'programme__name': enrollment.programme.name if enrollment else None,
            'status': enrollment.current_status if enrollment else None,
            'created_at': s.created_at,
        })

    # Enrollment trend: distinct students per admission year (last 5 years)
    current_year = timezone.now().year
    enrollment_trend = list(
        StudentEnrollment.objects
        .filter(admission_date__year__gte=current_year - 4)
        .annotate(admission_year=ExtractYear('admission_date'))
        .values('admission_year')
        .annotate(count=Count('student', distinct=True))
        .order_by('admission_year')
    )

    return Response({
        'student_status': student_status,
        'top_programmes': top_programmes,
        'grade_distribution': grade_distribution,
        'recent_students': recent_students,
        'enrollment_trend': enrollment_trend,
    })
