#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up test environment...${NC}"

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install test dependencies
echo "Installing test dependencies..."
pip install -r requirements-test.txt

# Install development dependencies
echo "Installing development dependencies..."
pip install -r requirements-dev.txt

# Run frontend tests
echo -e "\n${YELLOW}Running frontend tests...${NC}"
cd frontend
npm install
npm test

# Run backend tests
echo -e "\n${YELLOW}Running backend tests...${NC}"
cd ../src
pytest \
    --verbose \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=html \
    --no-cov-on-fail \
    --html=test-report.html \
    --self-contained-html

# Check test results
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    
    # Open coverage report in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open htmlcov/index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open htmlcov/index.html
    fi
    
    # Open test report in browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open test-report.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open test-report.html
    fi
else
    echo -e "\n${RED}Tests failed!${NC}"
    exit 1
fi

# Deactivate virtual environment
deactivate 