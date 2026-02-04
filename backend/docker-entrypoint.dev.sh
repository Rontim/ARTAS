#!/bin/bash
set -e

echo "=== ARTAS Backend Development Entrypoint ==="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=${DB_PASSWORD:-artas_dev_password} psql -h ${DB_HOST:-db} -U ${DB_USER:-artas} -d ${DB_NAME:-artas_dev} -c '\q' 2>/dev/null; do
    echo "Postgres is unavailable - sleeping"
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
if not User.objects.filter(email='admin@artas.dev').exists():
    User.objects.create_superuser(
        email='admin@artas.dev',
        password='admin123',
        first_name='Admin',
        last_name='User'
    )
    print('Superuser created: admin@artas.dev / admin123')
else:
    print('Superuser already exists')
EOF

echo "Starting development server..."
exec "$@"
