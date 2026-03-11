"""
Middleware for automatic activity tracking on DRF ViewSet actions.
"""
import threading

from .models import ActivityLog

_activity_context = threading.local()


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class ActivityTrackingMiddleware:
    """
    Middleware that automatically logs create/update/delete actions
    performed through DRF ViewSet endpoints.
    """

    # Map HTTP methods + DRF actions to activity actions
    ACTION_MAP = {
        'POST': ActivityLog.ActionType.CREATE,
        'PUT': ActivityLog.ActionType.UPDATE,
        'PATCH': ActivityLog.ActionType.UPDATE,
        'DELETE': ActivityLog.ActionType.DELETE,
    }

    # Endpoints to skip (auth-related are logged separately)
    SKIP_PATHS = {'/api/v1/auth/login/',
                  '/api/v1/auth/logout/', '/api/v1/auth/token/refresh/'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if not self._should_track(request, response):
            return response

        self._log_activity(request, response)
        return response

    def _should_track(self, request, response):
        """Determine if this request should be tracked."""
        if request.method not in self.ACTION_MAP:
            return False
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return False
        if request.path in self.SKIP_PATHS:
            return False
        if not request.path.startswith('/api/'):
            return False
        # Only log successful mutations
        if response.status_code >= 400:
            return False
        return True

    def _log_activity(self, request, response):
        """Create an activity log entry from the request/response."""
        action = self.ACTION_MAP[request.method]
        entity_type, entity_id = self._parse_endpoint(request.path)

        if not entity_type:
            return

        # For create, get entity_id from response if available
        if action == ActivityLog.ActionType.CREATE and hasattr(response, 'data'):
            data = response.data
            if isinstance(data, dict):
                entity_id = str(data.get('id', ''))

        description = self._build_description(
            action, entity_type, request, response)

        ActivityLog.log(
            user=request.user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=get_client_ip(request),
        )

    def _parse_endpoint(self, path):
        """Extract entity type and ID from API path."""
        # /api/v1/students/uuid/ -> ('Student', 'uuid')
        # /api/v1/academics/programmes/ -> ('Programme', '')
        parts = [p for p in path.strip('/').split('/') if p]

        # Remove 'api' and 'v1' prefix
        if len(parts) >= 2 and parts[0] == 'api' and parts[1] == 'v1':
            parts = parts[2:]

        if not parts:
            return None, ''

        # Namespace mapping: auth/users -> User, academics/programmes -> Programme
        ENTITY_MAP = {
            'students': 'Student',
            'users': 'User',
            'schools': 'School',
            'departments': 'Department',
            'programmes': 'Programme',
            'units': 'Unit',
            'semesters': 'Semester',
            'academic-years': 'Academic Year',
            'modules': 'Module',
            'programme-units': 'Programme Unit',
            'semester-registrations': 'Semester Registration',
            'module-registrations': 'Module Registration',
            'unit-registrations': 'Unit Registration',
            'results': 'Result',
            'semester-aggregates': 'Semester Aggregate',
            'module-aggregates': 'Module Aggregate',
            'cumulative-aggregates': 'Cumulative Aggregate',
            'transcripts': 'Transcript',
        }

        # Walk through parts to find entity name
        entity_type = None
        entity_id = ''

        for part in parts:
            if part in ENTITY_MAP:
                entity_type = ENTITY_MAP[part]
                entity_id = ''
            elif entity_type and self._is_uuid_like(part):
                entity_id = part

        return entity_type, entity_id

    def _is_uuid_like(self, value):
        """Check if a string looks like a UUID."""
        return len(value) >= 32 and '-' in value

    def _build_description(self, action, entity_type, request, response):
        """Build a human-readable description."""
        action_past = {
            ActivityLog.ActionType.CREATE: 'Created',
            ActivityLog.ActionType.UPDATE: 'Updated',
            ActivityLog.ActionType.DELETE: 'Deleted',
        }
        verb = action_past.get(action, action)
        name = ''

        if hasattr(response, 'data') and isinstance(response.data, dict):
            data = response.data
            name = (
                data.get('full_name')
                or data.get('name')
                or data.get('code')
                or data.get('reg_no')
                or data.get('transcript_id')
                or ''
            )

        if name:
            return f"{verb} {entity_type.lower()} \"{name}\""
        return f"{verb} a {entity_type.lower()}"
