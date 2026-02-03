#!/bin/bash
set -e

echo "=== ARTAS Backend Development Entrypoint ==="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
    sleep 1
done
echo "PostgreSQL is ready!"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist (dev only)
echo "Creating default superuser if not exists..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@artas.local').exists():
    User.objects.create_superuser(
        email='admin@artas.local',
        password='admin123',
        first_name='Admin',
        last_name='User'
    )
    print('Superuser created: admin@artas.local / admin123')
else:
    print('Superuser already exists')
EOF

echo "Starting development server..."
exec "$@"
