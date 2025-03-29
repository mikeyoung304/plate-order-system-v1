#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Setting up Quick Order Features    ${NC}"
echo -e "${BLUE}=====================================${NC}"

# Ensure environment variables are set
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Creating sample .env file..."
    cp .env.example .env
    echo -e "${GREEN}Created .env file from example. Please update it with your settings.${NC}"
fi

# Function to check if a command succeeds
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Create python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    check_success "Virtual environment creation"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
check_success "Virtual environment activation"

# Install requirements
echo "Installing required packages..."
pip install -r requirements.txt
check_success "Package installation"

# Run database migration
echo "Running database migration..."
python create_migration.py
check_success "Database migration"

# Initialize sample data if needed
echo "Do you want to create sample data for testing? (y/n)"
read -r CREATE_SAMPLE_DATA

if [[ $CREATE_SAMPLE_DATA =~ ^[Yy]$ ]]; then
    echo "Creating sample data..."
    python initialize_database.py
    check_success "Database initialization"
    
    echo "Creating daily specials for today and tomorrow..."
    python create_daily_special.py --future 1
    check_success "Daily specials creation"
fi

# Run the server
echo -e "${GREEN}Setup complete! Starting the server...${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Server is running on port 8000     ${NC}"
echo -e "${BLUE}  Access at http://localhost:8000    ${NC}"
echo -e "${BLUE}=====================================${NC}"

python main.py 