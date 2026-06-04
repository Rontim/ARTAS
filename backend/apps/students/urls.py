"""
URL patterns for students app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, SemesterRegistrationViewSet,
    ModuleRegistrationViewSet, UnitRegistrationViewSet
)

router = DefaultRouter()
router.register(r'semester-registrations', SemesterRegistrationViewSet,
                basename='semester-registration')
router.register(r'module-registrations', ModuleRegistrationViewSet,
                basename='module-registration')
router.register(r'unit-registrations', UnitRegistrationViewSet,
                basename='unit-registration')
router.register(r'', StudentViewSet, basename='student')

urlpatterns = [
    path('', include(router.urls)),
]
