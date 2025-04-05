#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}== Plate Order System - Clean Start ==${NC}"
echo -e "${BLUE}======================================${NC}"

# Navigate to the project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Ensure Python environment is set up properly
export PYTHONPATH=$PROJECT_ROOT
export DATABASE_URL="sqlite:///./restaurant.db"

echo -e "${YELLOW}Setting environment:${NC}"
echo -e "  PYTHONPATH=${GREEN}$PYTHONPATH${NC}"
echo -e "  DATABASE_URL=${GREEN}$DATABASE_URL${NC}"

# Kill any running processes that might interfere
echo -e "${YELLOW}Killing any running processes...${NC}"

# Kill specific process patterns
pkill -f "python main.py" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
pkill -f "serve -s build" 2>/dev/null
pkill -f "serve -l 3001" 2>/dev/null
pkill -f "node.*start.js" 2>/dev/null

# Kill processes on specific ports
for port in 3000 3001 10000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "  Killing process on port ${GREEN}$port${NC} (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# Remove any stale PID files
rm -f .backend_pid .frontend_pid

# Clean rebuild database option
if [ "$1" == "--rebuild-db" ]; then
  echo -e "${YELLOW}Rebuilding database from scratch...${NC}"
  rm -f restaurant.db app.db
  python initialize_database.py
  if [ $? -ne 0 ]; then
    echo -e "${RED}Database initialization failed!${NC}"
    exit 1
  fi
else
  # Just check the database
  if [ ! -f "restaurant.db" ]; then
    echo -e "${YELLOW}Database not found. Creating it...${NC}"
    python initialize_database.py
    if [ $? -ne 0 ]; then
      echo -e "${RED}Database initialization failed!${NC}"
      exit 1
    fi
  fi
fi

# Start the backend
echo -e "${YELLOW}Starting backend server on port 10000...${NC}"
PORT=10000 python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > .backend_pid
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
MAX_ATTEMPTS=30
ATTEMPTS=0
while ! curl -s "http://localhost:10000/health" > /dev/null 2>&1 && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
  echo -e "\n${RED}Backend failed to start properly.${NC}"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

echo -e "\n${GREEN}Backend is running at: http://localhost:10000${NC}"

# Install necessary npm packages globally if needed
echo -e "${YELLOW}Checking for required npm packages...${NC}"
if ! command -v npx &> /dev/null; then
  echo -e "${RED}npx not found. Please install Node.js and npm${NC}"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Start the frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

# Use development server or serve the build
if [ "$1" == "--dev" ] || [ "$2" == "--dev" ]; then
  # Start React development server
  echo -e "${YELLOW}Starting frontend development server...${NC}"
  export NODE_OPTIONS="--max-old-space-size=4096"
  PORT=3001 npm start &
  FRONTEND_PID=$!
  FRONTEND_PORT=3001
else
  # Check if build exists, build it if needed
  if [ ! -d "build" ]; then
    echo -e "${YELLOW}Building frontend...${NC}"
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm run build
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}Frontend build failed.${NC}"
      kill $BACKEND_PID 2>/dev/null
      exit 1
    fi
  fi
  
  # Serve the build using npx
  echo -e "${YELLOW}Starting frontend server on port 3001...${NC}"
  npx serve -l 3001 build &
  FRONTEND_PID=$!
  FRONTEND_PORT=3001
fi

echo $FRONTEND_PID > ../.frontend_pid

cd $PROJECT_ROOT

# Wait for frontend to be available
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
sleep 3

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}==== Plate Order System Running! ====${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}Backend URL: ${GREEN}http://localhost:10000${NC}"
echo -e "${YELLOW}Frontend URL: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"

# Open browser if possible
if command -v open &> /dev/null; then
  echo -e "${YELLOW}Opening frontend in your browser...${NC}"
  open "http://localhost:${FRONTEND_PORT}"
fi

echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Set up cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  if [ -f .frontend_pid ]; then
    kill $(cat .frontend_pid) 2>/dev/null
  fi
  if [ -f .backend_pid ]; then
    kill $(cat .backend_pid) 2>/dev/null
  fi
  rm -f .backend_pid .frontend_pid
  echo -e "${GREEN}Shutdown complete.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for CTRL+C
wait 