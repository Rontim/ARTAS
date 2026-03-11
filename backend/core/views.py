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
    from apps.students.models import Student
    from apps.academics.models import Programme, Unit
    from apps.transcripts.models import Transcript
    from apps.accounts.models import User

    today = timezone.now().date()

    stats = {
        'total_students': Student.objects.count(),
        'active_students': Student.objects.filter(status='active').count(),
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
    from apps.students.models import Student
    from apps.academics.models import Programme
    from apps.grades.models import StudentResult
    from django.db.models import Count, Q

    # Student status breakdown
    status_qs = (
        Student.objects.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    student_status = {row['status']: row['count'] for row in status_qs}

    # Top 5 programmes by enrollment
    top_programmes = list(
        Programme.objects
        .annotate(student_count=Count('students'))
        .filter(student_count__gt=0)
        .order_by('-student_count')
        .values('code', 'name', 'student_count')[:5]
    )

    # Grade distribution (pass / fail / supplementary / incomplete / exempted / withdrawn)
    grade_qs = (
        StudentResult.objects.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    grade_distribution = {row['status']: row['count'] for row in grade_qs}

    # Recent 5 students
    recent_students = list(
        Student.objects.select_related('programme')
        .order_by('-created_at')[:5]
        .values('id', 'reg_no', 'first_name', 'last_name', 'programme__name', 'status', 'created_at')
    )

    # Enrollment trend: students per admission year (last 5 years)
    current_year = timezone.now().year
    enrollment_trend = list(
        Student.objects
        .filter(admission_year__gte=current_year - 4)
        .values('admission_year')
        .annotate(count=Count('id'))
        .order_by('admission_year')
    )

    return Response({
        'student_status': student_status,
        'top_programmes': top_programmes,
        'grade_distribution': grade_distribution,
        'recent_students': recent_students,
        'enrollment_trend': enrollment_trend,
    })
