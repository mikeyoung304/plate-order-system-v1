#!/bin/bash

# Start Script for Plate Order System with Floor Plan Management
# This script starts the application server

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║   Plate Order System - Enhanced Edition                                   ║"
echo "║                                                                           ║"
echo "║   Starting Server...                                                      ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -d "app" ] || [ ! -f "main.py" ]; then
    echo -e "${RED}Error: This script must be run from the plate-order-system-enhanced directory${NC}"
    echo -e "${BLUE}Please navigate to the plate-order-system-enhanced directory and try again${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo -e "${BLUE}Please run the setup script first: ./setup.sh${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found, creating default configuration...${NC}"
    cat > .env << EOF
# Plate Order System Environment Variables
DEBUG=True
SECRET_KEY=plate_order_system_secret_key_change_in_production
DATABASE_URL=sqlite:///./app.db

# Deepgram API Key - Replace with your actual key for production
DEEPGRAM_API_KEY=your_deepgram_api_key

# Server Configuration
HOST=0.0.0.0
PORT=8000
EOF
    echo -e "${GREEN}Created default .env file${NC}"
    echo -e "${YELLOW}Note: For production, please update the DEEPGRAM_API_KEY in the .env file${NC}"
fi

# Load environment variables
if [ -f ".env" ]; then
    source <(grep -v '^#' .env | sed 's/^/export /')
fi

# Set default port if not defined
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

echo -e "${BLUE}Starting server on ${HOST}:${PORT}...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server
python3 main.py

# Check if server started successfully
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start the server${NC}"
    echo -e "${BLUE}Please check the error message above and make sure all dependencies are installed${NC}"
    echo -e "${BLUE}You can run the setup script to install dependencies: ./setup.sh${NC}"
    exit 1
fi
