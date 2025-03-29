.PHONY: install test lint format clean run docker-build docker-up docker-down docker-logs dev-setup

install:
	python -m pip install --upgrade pip
	pip install -r requirements.txt
	pip install -r requirements-test.txt
	pre-commit install

test:
	pytest tests/ -v --cov=app --cov-report=term-missing

test-watch:
	pytest-watch -- tests/ -v --cov=app --cov-report=term-missing

lint:
	flake8 app tests
	mypy app tests
	black --check app tests
	isort --check-only app tests

format:
	black app tests
	isort app tests

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name "*.egg" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-test:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# Development setup
dev-setup: install docker-build docker-up
	@echo "Development environment is ready!"
	@echo "Run 'make docker-logs' to view logs"
	@echo "Run 'make docker-down' to stop services" 