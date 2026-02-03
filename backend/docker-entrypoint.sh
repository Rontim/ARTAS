#!/bin/bash
set -e

echo "=== ARTAS Backend Production Entrypoint ==="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
    sleep 1
done
echo "PostgreSQL is ready!"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create cache table if needed
echo "Creating cache table..."
python manage.py createcachetable || true

echo "Starting server..."
exec "$@"
