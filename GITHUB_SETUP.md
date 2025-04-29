# GitHub Setup and Workflow Documentation

This document provides a comprehensive overview of the GitHub CI/CD workflows, templates, and configuration set up for the Plate Order System project.

## Overview

The GitHub configuration includes:

- Continuous Integration (CI) workflow that runs tests, linting, and security checks
- Dependency scanning workflow to identify vulnerable packages
- Deployment workflow for automating deployments
- Issue templates for bug reports and feature requests
- Pull request template
- Branch protection recommendations

## Workflows

### Continuous Integration (CI)

Located at `.github/workflows/ci.yml`, this workflow:

- Runs on every push to the `main` branch and on all pull requests
- Performs frontend checks:
  - Linting
  - Type checking
  - Frontend tests
- Performs backend checks:
  - Python linting with flake8
  - Format checking with black
  - Backend tests
- Runs security checks:
  - Python security scanning with Bandit
  - Code quality scanning with SonarCloud

### Dependency Scanning

Located at `.github/workflows/dependency-scan.yml`, this workflow:

- Runs on pushes to `main`, pull requests, and weekly (Sunday)
- Scans frontend dependencies with Snyk
- Scans Python packages with safety
- Performs comprehensive scanning with OWASP Dependency Check
- Uploads dependency check reports as artifacts

### Deployment

Located at `.github/workflows/deploy.yml`, this workflow:

- Runs on pushes to `main` or manual trigger
- Builds and tests the application
- Deploys to Render (configured for this project)
- Verifies the deployment
- Sends a notification when deployment is complete

## Issue and Pull Request Templates

### Issue Templates

Two issue templates are provided:

1. **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.md`):
   - Structured format for reporting bugs
   - Includes sections for steps to reproduce, expected behavior, and environment details

2. **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.md`):
   - Structured format for proposing new features
   - Includes sections for problem statement, proposed solution, and acceptance criteria

### Pull Request Template

The PR template (`.github/PULL_REQUEST_TEMPLATE.md`) includes:

- Description of changes
- Related issues
- Type of change checklist
- Testing performed
- Comprehensive review checklist

## Branch Protection Recommendations

The following branch protection rules are recommended for the `main` branch:

- Require pull request reviews before merging
- Require status checks to pass before merging
  - Required status checks: `frontend-checks`, `backend-checks`, `security-checks`
- Require branches to be up to date before merging
- Include administrators in restrictions

## Required Secrets

The following secrets need to be configured in the GitHub repository settings:

1. `SONAR_TOKEN`: Token for SonarCloud analysis
2. `SNYK_TOKEN`: Token for Snyk dependency scanning
3. `RENDER_SERVICE_ID`: Service ID for Render deployment
4. `RENDER_API_KEY`: API key for Render deployment
5. `SLACK_WEBHOOK`: Webhook URL for Slack notifications

## Setup Instructions

1. Run the `setup_github.sh` script to initialize the repository
2. Create a repository on GitHub
3. Push your code to GitHub
4. Set up branch protection rules as recommended
5. Add the required secrets to your repository settings

## Best Practices

- Always create a feature branch for new development
- Reference issue numbers in commit messages and PRs
- Ensure all tests pass before requesting a review
- Address code review comments promptly
- Keep PRs focused and reasonably sized

## Troubleshooting

- If CI checks fail, review the GitHub Actions logs for details
- For dependency scanning failures, check if they are false positives before suppressing
- If deployment fails, verify your Render configuration and credentials