"""
URL configuration for ARTAS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from core.health import health_check, readiness_check

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Health checks
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/ready/', readiness_check, name='readiness-check'),

    # API v1
    path('api/v1/', include([
        path('auth/', include('apps.accounts.urls')),
        path('students/', include('apps.students.urls')),
        path('academics/', include('apps.academics.urls')),
        path('grades/', include('apps.grades.urls')),
        path('transcripts/', include('apps.transcripts.urls')),
    ])),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL,
                          document_root=settings.STATIC_ROOT)
