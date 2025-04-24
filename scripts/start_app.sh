#!/bin/bash

# Configuration
VENV_DIR="venv"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$APP_DIR" || exit 1

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install or update dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -r requirements.txt

# Initialize Supabase database
echo -e "${GREEN}Initializing Supabase database...${NC}"
python scripts/init_supabase.py

# Start the application
echo -e "${GREEN}Starting application...${NC}"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 