"""
URL patterns for core app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityLogViewSet, dashboard_stats, dashboard_extended

router = DefaultRouter()
router.register(r'activities', ActivityLogViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/extended/', dashboard_extended, name='dashboard-extended'),
]
