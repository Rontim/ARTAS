# ARTAS Makefile for Docker commands
.PHONY: help dev dev-build dev-up dev-down dev-logs dev-shell prod prod-build prod-up prod-down prod-logs clean

# Default target
help:
	@echo "ARTAS Docker Commands"
	@echo "====================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build development containers"
	@echo "  make dev-up       - Start development containers (detached)"
	@echo "  make dev-down     - Stop development containers"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-shell    - Open shell in backend container"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build production containers"
	@echo "  make prod-up      - Start production containers (detached)"
	@echo "  make prod-down    - Stop production containers"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make migrate      - Run database migrations"
	@echo "  make superuser    - Create Django superuser"

# Development commands
dev:
	docker-compose -f docker-compose.dev.yml up --build

dev-build:
	docker-compose -f docker-compose.dev.yml build

dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell:
	docker-compose -f docker-compose.dev.yml exec backend bash

# Production commands
prod:
	docker-compose up --build

prod-build:
	docker-compose build

prod-up:
	docker-compose up -d

prod-down:
	docker-compose down

prod-logs:
	docker-compose logs -f

# Utility commands
clean:
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker-compose down -v --rmi all
	docker system prune -f

migrate:
	docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

superuser:
	docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
