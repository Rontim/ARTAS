"""
URL patterns for students app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, StudentEnrollmentViewSet

router = DefaultRouter()
router.register(r'', StudentViewSet, basename='student')
router.register(r'enrollments', StudentEnrollmentViewSet,
                basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
]
