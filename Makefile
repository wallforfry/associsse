# Associsse Docker Management

.PHONY: help dev prod build clean logs shell db-migrate db-reset

# Default target
help:
	@echo "Available commands:"
	@echo "  dev         - Start development environment"
	@echo "  prod        - Start production environment"
	@echo "  build       - Build Docker images"
	@echo "  clean       - Stop and remove all containers and volumes"
	@echo "  logs        - Show application logs"
	@echo "  shell       - Open shell in app container"
	@echo "  db-migrate  - Run database migrations"
	@echo "  db-reset    - Reset database (WARNING: destroys data)"
	@echo "  db-studio   - Open Prisma Studio"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose up -d
	@echo "Application available at: http://localhost:3000"
	@echo "Minio console available at: http://localhost:9001"
	@echo "Minio credentials: minioadmin / minioadmin"

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Application available at: http://localhost:3000"

# Build images
build:
	@echo "Building Docker images..."
	docker-compose build

# Clean up
clean:
	@echo "Stopping and removing containers..."
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	@echo "Removing unused images..."
	docker image prune -f

# Show logs
logs:
	docker-compose logs -f app

# Open shell in app container
shell:
	docker-compose exec app sh

# Database operations
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec app pnpm db:migrate

db-reset:
	@echo "WARNING: This will destroy all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose exec app pnpm db:reset

db-studio:
	@echo "Opening Prisma Studio..."
	docker-compose exec app pnpm db:studio

# Quick setup for new developers
setup:
	@echo "Setting up development environment..."
	cp env.docker .env.local
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	sleep 15
	docker-compose exec app pnpm db:migrate
	@echo "Setup complete! Application available at: http://localhost:3000"
