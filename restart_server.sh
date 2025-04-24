#!/bin/bash

# Restart script for Plate Order System
# This script will stop the current server, restart it with updated code,
# and verify the API connections work properly

# Set color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║   Plate Order System - Automated Restart & Connection Test               ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Find and stop the current FastAPI process running on port 8005
echo -e "${YELLOW}Finding and stopping current FastAPI server on port 8005...${NC}"
PORT_PID=$(lsof -ti:8005)

if [ -n "$PORT_PID" ]; then
  echo -e "${YELLOW}Stopping FastAPI server with PID: $PORT_PID${NC}"
  kill -15 $PORT_PID
  sleep 2
  
  # Check if the process was killed
  if ps -p $PORT_PID > /dev/null; then
    echo -e "${RED}Failed to stop server gracefully, force stopping...${NC}"
    kill -9 $PORT_PID
    sleep 1
  fi
else
  echo -e "${YELLOW}No existing process found on port 8005${NC}"
fi

# Start the updated FastAPI server in the background
echo -e "${YELLOW}Starting FastAPI server with updated compatibility routes...${NC}"
python3 backend/main.py > backend_logs.txt 2>&1 &
BACKEND_PID=$!

# Store the PID for future reference
echo $BACKEND_PID > .backend_pid

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 5

# Test the health API
echo -e "${YELLOW}Testing API connection...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:8005/api/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
  echo -e "${GREEN}✓ Health API connection successful!${NC}"
else
  echo -e "${RED}❌ Health API connection failed${NC}"
fi

# Test the menu API
MENU_RESPONSE=$(curl -s http://localhost:8005/api/menu)
if [[ $MENU_RESPONSE == *"items"* ]]; then
  echo -e "${GREEN}✓ Menu API connection successful!${NC}"
else
  echo -e "${RED}❌ Menu API connection failed${NC}"
fi

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                          ║"
echo "║   Server has been restarted with updated compatibility routes.           ║"
echo "║   The frontend should now connect properly to the backend.               ║"
echo "║                                                                          ║"
echo "║   - FastAPI is running on port 8005 (PID: $BACKEND_PID)                   "
echo "║   - NextJS is running on port 3000                                       ║"
echo "║                                                                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Server restart complete. Backend logs are saved to backend_logs.txt"