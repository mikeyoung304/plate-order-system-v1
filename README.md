# Plate Order System

A restaurant management system with table management, order processing, and meal period functionality.

## Quick Start

The easiest way to run the application is using the provided startup script:

```bash
# Make the script executable first
chmod +x start-app.sh

# Run the application
./start-app.sh
```

This script will:
1. Initialize the database (if needed)
2. Start the backend server on port 10000
3. Start the frontend on port 3000 (or another available port)
4. Provide URLs for accessing the application

## Manual Setup

If you prefer to run components manually:

### Backend

```bash
# Initialize the database (if not already done)
python initialize_database.py

# Start the backend server
python main.py
```

The backend will run on http://localhost:10000.

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# If you haven't built the frontend yet:
npm run build

# Serve the frontend
npx serve -s build
```

The frontend will typically run on http://localhost:3000 (or another port if 3000 is in use).

## Development

For development work:

### Backend

```bash
# Start backend with auto-reload
python main.py
```

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm start
```

## Troubleshooting

### Port Conflicts

If you encounter port conflicts:
- Backend: Check if any process is using port 10000 and terminate it
- Frontend: The serve command will automatically use an alternative port

### Database Issues

If you see database errors like "no such table", run:
```bash
python initialize_database.py
```

### Startup Script

The `start-app.sh` script addresses most common issues automatically, including:
- Killing conflicting processes
- Initializing the database
- Starting services in the correct order

## System Architecture

- **Backend**: Python FastAPI application
- **Frontend**: React TypeScript application
- **Database**: SQLite for all environments (dev, test, prod)
- **API Endpoints**: RESTful API endpoints at `/api/`

## Development Setup

### Option 1: Local Development

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
make install
```

3. Set up pre-commit hooks:
```bash
pre-commit install
```

4. Start Redis (if not using Docker):
```bash
docker run -d -p 6379:6379 redis:latest
```

5. Run the application:
```bash
make run
```

### Option 2: Docker Development

1. Install Docker and Docker Compose

2. Set up the development environment:
```bash
make dev-setup
```

This will:
- Install dependencies
- Build Docker images
- Start the application and Redis

## Development Commands

### Local Development
- Run the application:
```bash
make run
```

- Run tests:
```bash
make test
```

- Run tests in watch mode:
```bash
make test-watch
```

- Run linting:
```bash
make lint
```

- Format code:
```bash
make format
```

- Clean up:
```bash
make clean
```

### Docker Development
- Build Docker images:
```bash
make docker-build
```

- Start services:
```bash
make docker-up
```

- Stop services:
```bash
make docker-down
```

- View logs:
```bash
make docker-logs
```

## Testing

The project uses a comprehensive testing strategy with mocked dependencies for reliable and fast tests:

### Unit Tests
- Located in `tests/unit/`
- Test individual components in isolation
- Mock external dependencies
- Fast execution

### Integration Tests
- Located in `tests/integration/`
- Test component interactions
- Use mocked Redis and other services
- Moderate execution time

### End-to-End Tests
- Located in `tests/e2e/`
- Test complete workflows
- Use mocked external services
- Fast and reliable execution

### Running Tests

1. Run all tests:
```bash
make test
```

2. Run specific test types:
```bash
pytest tests/unit/  # Unit tests only
pytest tests/integration/  # Integration tests only
pytest tests/e2e/  # End-to-end tests only
```

3. Run tests with coverage:
```bash
pytest tests/ --cov=app --cov-report=term-missing
```

### Test Environment

The test environment is configured in `conftest.py` and includes:
- Mocked Redis for rate limiting
- Mocked external services
- Test settings
- Shared test fixtures

## CI/CD

The project uses GitHub Actions for continuous integration:

1. On every push to main and pull requests:
   - Run all tests
   - Generate coverage report
   - Upload coverage to Codecov
   - Run linting checks

2. Pre-commit hooks ensure code quality:
   - Format code with Black
   - Sort imports with isort
   - Check types with mypy
   - Run flake8
   - Run tests

## Project Structure

```
plate-order-system/
├── app/
│   ├── api/          # API endpoints
│   ├── core/         # Core functionality
│   ├── models/       # Data models
│   ├── services/     # Business logic
│   └── config/       # Configuration
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/         # End-to-end tests
├── .github/         # GitHub Actions workflows
└── .pre-commit-config.yaml  # Pre-commit hooks configuration
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License