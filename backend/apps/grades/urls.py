"""
URL patterns for grades app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GradingScaleViewSet, StudentResultViewSet,
    SemesterAggregateViewSet, CumulativeAggregateViewSet,
    RecomputeGradesView
)

router = DefaultRouter()
router.register(r'scales', GradingScaleViewSet, basename='grading-scale')
router.register(r'results', StudentResultViewSet, basename='student-result')
router.register(r'semester-aggregates', SemesterAggregateViewSet,
                basename='semester-aggregate')
router.register(r'cumulative-aggregates',
                CumulativeAggregateViewSet, basename='cumulative-aggregate')

urlpatterns = [
    path('', include(router.urls)),
    path('recompute/', RecomputeGradesView.as_view(), name='recompute-grades'),
]
