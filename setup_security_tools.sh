#!/bin/bash
# Setup script for security tools in the Plate Order System repository

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up security tools for Plate Order System...${NC}"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo -e "${RED}Error: pip is not installed.${NC}"
    exit 1
fi

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo -e "${YELLOW}Installing pre-commit...${NC}"
    pip install pre-commit
fi

# Install pre-commit hooks
echo -e "${GREEN}Installing pre-commit hooks...${NC}"
pre-commit install

# Generate a fresh secrets baseline
echo -e "${GREEN}Generating secrets baseline...${NC}"
if ! command -v detect-secrets &> /dev/null; then
    echo -e "${YELLOW}Installing detect-secrets...${NC}"
    pip install detect-secrets
fi

detect-secrets scan > .secrets.baseline
echo -e "${GREEN}Secrets baseline generated at .secrets.baseline${NC}"

# Verify that no secrets were detected
SECRETS_COUNT=$(detect-secrets scan --json | grep -o "results" | wc -l)
if [ "$SECRETS_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Warning: Potential secrets detected in the repository.${NC}"
    echo -e "Review the .secrets.baseline file and remove any sensitive information from the codebase."
else
    echo -e "${GREEN}No secrets detected in the codebase.${NC}"
fi

# Install safety for dependency scanning
echo -e "${GREEN}Installing safety for dependency scanning...${NC}"
pip install safety

# Run safety check
echo -e "${GREEN}Checking Python dependencies for security vulnerabilities...${NC}"
safety check -r backend/requirements.txt

echo -e "${GREEN}Security tools setup complete!${NC}"
echo -e "Make sure to review the ${YELLOW}SECURITY.md${NC} and ${YELLOW}SECURE-CREDENTIALS-GUIDE.md${NC} files for best practices."