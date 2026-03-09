"""
URL patterns for transcripts app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TranscriptViewSet, TranscriptRequestViewSet, VerifyTranscriptView

router = DefaultRouter()
router.register(r'', TranscriptViewSet, basename='transcript')
router.register(r'requests', TranscriptRequestViewSet,
                basename='transcript-request')

urlpatterns = [
    path('verify/', VerifyTranscriptView.as_view(), name='verify-transcript'),
    path('', include(router.urls)),
]
