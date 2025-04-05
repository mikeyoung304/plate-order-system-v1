#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}=== Plate Order System Launcher ===${NC}"
echo -e "${BLUE}======================================${NC}"

# Navigate to the project root directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Set up environment variables
export PYTHONPATH=$PROJECT_ROOT
export DATABASE_URL="sqlite:///./restaurant.db"

echo -e "${YELLOW}Environment setup:${NC}"
echo -e "  - PYTHONPATH: ${GREEN}$PYTHONPATH${NC}"
echo -e "  - DATABASE_URL: ${GREEN}$DATABASE_URL${NC}"

# Kill existing processes on the required ports
echo -e "${YELLOW}Cleaning up any existing processes...${NC}"
for port in 3000 3001 10000; do
  processes=$(lsof -ti tcp:$port)
  if [ -n "$processes" ]; then
    echo -e "  - Killing processes on port ${GREEN}$port${NC}: $processes"
    kill -9 $processes 2>/dev/null
  else
    echo -e "  - No processes found on port ${GREEN}$port${NC}"
  fi
done

# Clean up any stale PID files
rm -f .backend_pid .frontend_pid

# Check if database exists, rebuild if necessary
if [ ! -f "restaurant.db" ]; then
  echo -e "${YELLOW}Database doesn't exist. Rebuilding...${NC}"
  python rebuild_database.py
elif [ "$1" == "--rebuild" ]; then
  echo -e "${YELLOW}Rebuilding database...${NC}"
  python rebuild_database.py
else
  echo -e "${YELLOW}Using existing database${NC}"
fi

# Start the backend
echo -e "${YELLOW}Starting backend server on port 10000...${NC}"
PORT=10000 python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > .backend_pid
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for the backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
MAX_ATTEMPTS=30
ATTEMPTS=0
while ! curl -s "http://localhost:10000/health" > /dev/null 2>&1 && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
  echo -e "\n${GREEN}Backend is running at: http://localhost:10000${NC}"
else
  echo -e "\n${RED}Backend failed to start properly. Check logs.${NC}"
  ps -p $BACKEND_PID > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  echo -e "${RED}Exiting...${NC}"
  exit 1
fi

# Start the frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies. Check errors above.${NC}"
    kill $(cat ../.backend_pid) 2>/dev/null
    exit 1
  fi
fi

# Set NODE_OPTIONS for increased memory
export NODE_OPTIONS="--max-old-space-size=4096"
echo -e "${YELLOW}Set Node.js memory allocation: ${GREEN}${NODE_OPTIONS}${NC}"

# Check if we should run development server or serve the build
if [ "$1" == "--dev" ] || [ "$2" == "--dev" ]; then
  # Start development server
  echo -e "${YELLOW}Starting frontend development server...${NC}"
  PORT=3001 npm start &
  FRONTEND_PID=$!
else
  # Build frontend if build directory doesn't exist
  if [ ! -d "build" ]; then
    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
      echo -e "${RED}Frontend build failed. Check errors above.${NC}"
      kill $(cat ../.backend_pid) 2>/dev/null
      exit 1
    fi
    echo -e "${GREEN}Frontend build completed successfully.${NC}"
  fi

  # Start frontend using npx serve
  echo -e "${YELLOW}Starting frontend server on port 3001...${NC}"
  npx serve -l 3001 build &
  FRONTEND_PID=$!
fi

echo $FRONTEND_PID > ../.frontend_pid
cd $PROJECT_ROOT

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 5

# Detect frontend URL
FRONTEND_PORT="3001"
if ! lsof -i:3001 | grep -q LISTEN; then
  # Try to find the actual port dynamically
  FRONTEND_PORT=$(lsof -i -P -n | grep LISTEN | grep node | grep -v 10000 | awk '{print $9}' | sed 's/.*://' | head -1)
  if [ -z "$FRONTEND_PORT" ]; then
    echo -e "${YELLOW}Could not detect frontend port automatically.${NC}"
    echo -e "${YELLOW}Please check terminal output above for the correct port number.${NC}"
    FRONTEND_PORT="shown in the terminal output above"
  fi
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}=== Plate Order System is running! ===${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}Backend URL: ${GREEN}http://localhost:10000${NC}"
echo -e "${YELLOW}Frontend URL: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Open browser if possible
if command -v open &> /dev/null; then
  echo -e "${YELLOW}Opening frontend in your browser...${NC}"
  open "http://localhost:${FRONTEND_PORT}"
elif command -v xdg-open &> /dev/null; then
  echo -e "${YELLOW}Opening frontend in your browser...${NC}"
  xdg-open "http://localhost:${FRONTEND_PORT}"
fi

# Trap for cleanup
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  kill $(cat .frontend_pid) 2>/dev/null
  kill $(cat .backend_pid) 2>/dev/null
  rm -f .backend_pid .frontend_pid
  echo -e "${GREEN}Shutdown complete.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes to finish
wait 