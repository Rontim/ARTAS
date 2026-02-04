#!/bin/bash
set -e

echo "=== ARTAS Backend Production Entrypoint ==="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST:-db} -U ${DB_USER} -d ${DB_NAME} -c '\q' 2>/dev/null; do
    echo "Postgres is unavailable - sleeping"
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
