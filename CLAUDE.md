# Plate Order System Development Guide

## Build & Run Commands
- **Backend**: `make run` (uvicorn app.main:app --reload)
- **Frontend**: `cd frontend && npm start`
- **CSS**: `npm run build:css` (Tailwind)
- **Docker**: `make docker-build && make docker-up`

## Test Commands
- **All tests**: `./run_tests.sh`
- **Backend only**: `make test` or `pytest tests/ -v --cov=app`
- **Single test**: `pytest tests/path/to/test_file.py::test_function_name`
- **Frontend tests**: `cd frontend && npm test` 
- **Single frontend test**: `cd frontend && npm test -- -t "test name pattern"`

## Lint & Format
- **Python**: `make lint` (flake8, mypy, black, isort)
- **Format Python**: `make format` (black, isort)
- **TypeScript**: `cd frontend && npm run lint`
- **Format TS**: `cd frontend && npm run format`

## Code Style Guidelines
- **Python**: Use Python 3.10+, type annotations, docstrings
- **TypeScript**: Strict typing required, React functional components
- **Error handling**: Use custom exceptions from core.exceptions
- **Imports**: Group standard lib, third-party, then local imports
- **Tests**: Maintain >80% test coverage for all new code
- **CSS**: Use Tailwind utility classes when possible