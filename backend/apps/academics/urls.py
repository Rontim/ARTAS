"""
URL patterns for academics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolViewSet, DepartmentViewSet, ProgrammeViewSet,
    UnitViewSet, ProgrammeUnitViewSet, AcademicYearViewSet,
    SemesterViewSet, SemesterUnitViewSet, ModuleViewSet
)

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'programmes', ProgrammeViewSet, basename='programme')
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'programme-units', ProgrammeUnitViewSet,
                basename='programme-unit')
router.register(r'academic-years', AcademicYearViewSet,
                basename='academic-year')
router.register(r'semesters', SemesterViewSet, basename='semester')
router.register(r'semester-units', SemesterUnitViewSet,
                basename='semester-unit')
router.register(r'modules', ModuleViewSet, basename='module')

urlpatterns = [
    path('', include(router.urls)),
]
