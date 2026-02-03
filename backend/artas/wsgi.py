"""
WSGI config for ARTAS project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'artas.settings')
application = get_wsgi_application()
