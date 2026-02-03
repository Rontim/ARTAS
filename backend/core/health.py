"""
Health check views for ARTAS.
"""
from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for container orchestration.
    Returns 200 if the service is healthy.
    """
    health_status = {
        'status': 'healthy',
        'service': 'artas-backend',
    }

    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['database'] = 'connected'
    except Exception as e:
        health_status['database'] = 'disconnected'
        health_status['status'] = 'unhealthy'
        return JsonResponse(health_status, status=503)

    return JsonResponse(health_status, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check for Kubernetes/Docker.
    Returns 200 when the service is ready to accept traffic.
    """
    return JsonResponse({
        'status': 'ready',
        'service': 'artas-backend',
    }, status=200)
