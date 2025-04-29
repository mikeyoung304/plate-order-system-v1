# Contributing to Plate Order System

Thank you for your interest in contributing to the Plate Order System! This document outlines the development workflow, coding standards, and review process to ensure consistent, high-quality contributions.

## Getting Started

1. **Fork the repository** on GitHub and clone your fork:
   ```bash
   git clone git@github.com:<your-username>/plate-order-system.git
   cd plate-order-system
   ```

2. **Set up your development environment**:
   - Follow the detailed setup instructions in [DEVELOPER.md](DEVELOPER.md)
   - Configure all required services (database, API keys, etc.)

## Development Workflow

### Branching Strategy

We follow an Agile workflow with two-week sprints and feature branches:

1. **Branch Naming Convention**:
   - Features: `feat/short-description`
   - Bugfixes: `fix/short-description`
   - Documentation: `docs/short-description`
   - Refactoring: `refactor/short-description`
   - Performance: `perf/short-description`

2. **Always branch from the latest `main`**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/my-feature
   ```

3. **Commit Standards**:
   - Use descriptive commit messages
   - Reference issue numbers when applicable: `feat: add voice recognition prompt (#123)`
   - Follow conventional commits format when possible

### Pull Request Process

1. Create a branch for your feature or bugfix
2. Implement your changes with appropriate tests
3. Ensure tests pass locally: `pytest` for backend, `npm test` for frontend
4. Push your branch and create a PR against `main`
5. Fill out the PR template with details about your changes
6. Address any feedback from code reviews
7. Once approved, your PR will be merged

## Coding Standards

### General Guidelines

- Follow established patterns in the codebase
- Write self-documenting code with clear variable and function names
- Include docstrings/comments for complex logic
- Keep functions small and focused on a single responsibility
- Use type hints in Python and TypeScript

### Python (Backend)

- Follow PEP 8 style guide
- Use FastAPI dependency injection patterns
- Organize code in the repository pattern (models, repositories, services, API endpoints)
- Document API endpoints using docstrings for OpenAPI generation

### JavaScript/TypeScript (Frontend)

- Follow the Next.js App Router patterns
- Use React hooks and functional components
- Follow the project's ESLint and Prettier configurations
- Properly type all components and functions using TypeScript

### State Management Standards

The project follows clean code principles for state management:

1. **Principles**:
   - Single Source of Truth: Each piece of data has one authoritative source
   - Immutability: Use immutable data structures for predictable state changes
   - Explicit State Transitions: Make state changes clear and well-defined
   - Separation of Concerns: Keep state logic separate from UI components
   - Minimal Global State: Limit global state to avoid unexpected behavior

2. **Local State**:
   - Use React's `useState` for component-specific state
   - Don't share local state directly between unrelated components

3. **Context API** (for scoped shared state):
   - Use for theming, user authentication, and application-wide configurations
   - Combine with `useReducer` for complex state logic
   - Don't overuse Context as a replacement for prop drilling when component composition would work better

4. **Implement Immutability**:
   - Create new objects/arrays instead of mutating existing ones
   - Use spread operators, `map`, `filter`, etc. for transformations

## Testing Requirements

All contributions should maintain or improve the project's test coverage:

### Backend Testing

- Unit tests for all repository methods and services
- API endpoint tests for all routes
- Use pytest fixtures for database setup and teardown

### Frontend Testing

- Component tests using React Testing Library
- Mock API calls and external dependencies
- Test both success and error states

### Integration Tests

- End-to-end tests for critical user flows
- Test voice recognition with sample audio files
- Verify real-time updates work correctly

## Code Review Process

All code changes require review before merging:

1. **Initial Check**:
   - Automated CI checks must pass (linting, tests, build)
   - PR should address a single concern with focused changes

2. **Code Review**:
   - At least one approval from a core maintainer is required
   - Reviewers check for:
     - Functionality: Does it work as expected?
     - Code quality: Is it readable and maintainable?
     - Test coverage: Are there appropriate tests?
     - Security concerns: Any potential vulnerabilities?
     - Performance implications: Any bottlenecks introduced?

3. **Feedback Implementation**:
   - Address all review comments
   - Push additional commits to your branch
   - Re-request review once changes are complete

4. **Final Verification**:
   - Reviewer confirms all issues are addressed
   - CI checks pass on the final version
   - Changes are ready to merge

## Documentation

All features and significant changes should be documented:

- Update relevant README sections
- Add inline code documentation for new functions/classes
- Update API docs for new endpoints

## Questions?

If you have any questions or need help, please open an issue for discussion or contact the maintainers.

Thank you for contributing to the Plate Order System!