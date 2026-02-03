"""
Core exceptions for ARTAS.
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class GradingError(APIException):
    """Exception raised when grading calculation fails."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred during grade calculation.'
    default_code = 'grading_error'


class TranscriptGenerationError(APIException):
    """Exception raised when transcript generation fails."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Failed to generate transcript.'
    default_code = 'transcript_generation_error'


class ValidationError(APIException):
    """Exception raised for validation errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation error occurred.'
    default_code = 'validation_error'


class PermissionDeniedError(APIException):
    """Exception raised when user lacks permission."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'
