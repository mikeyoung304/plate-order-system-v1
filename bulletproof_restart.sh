#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}======================================${NC}"
echo -e "${BLUE}${BOLD}= Plate Order System - BULLETPROOF! =${NC}"
echo -e "${BLUE}${BOLD}======================================${NC}"

# Navigate to the project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Helper function for section headers
section() {
  echo -e "\n${YELLOW}${BOLD}$1${NC}"
  echo -e "${YELLOW}----------------------------------------${NC}"
}

# Helper function for fatal errors
fatal() {
  echo -e "${RED}${BOLD}FATAL ERROR: $1${NC}"
  exit 1
}

section "1. SETTING UP ENVIRONMENT"

# Set up environment variables
export PYTHONPATH=$PROJECT_ROOT
export DATABASE_URL="sqlite:///./restaurant.db"
export NODE_OPTIONS="--max-old-space-size=8192"  # 8GB memory for Node

echo -e "  PYTHONPATH: ${GREEN}$PYTHONPATH${NC}"
echo -e "  DATABASE_URL: ${GREEN}$DATABASE_URL${NC}"
echo -e "  NODE_OPTIONS: ${GREEN}$NODE_OPTIONS${NC}"

section "2. KILLING CONFLICTING PROCESSES"

# Kill ALL Python processes just to be absolutely sure
pids=$(ps aux | grep python | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
  echo -e "  Killing Python processes: ${RED}$pids${NC}"
  kill -9 $pids 2>/dev/null
fi

# Kill specific Node.js processes
pids=$(ps aux | grep "node.*start.js" | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
  echo -e "  Killing React processes: ${RED}$pids${NC}"
  kill -9 $pids 2>/dev/null
fi

# Kill any serve processes
pids=$(ps aux | grep "serve -" | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
  echo -e "  Killing serve processes: ${RED}$pids${NC}"
  kill -9 $pids 2>/dev/null
fi

# Kill processes on common ports
for port in 3000 3001 8000 8080 10000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "  Killing process on port ${GREEN}$port${NC} (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

# Remove any stale PID files
rm -f .backend_pid .frontend_pid

# Wait to ensure processes are stopped
sleep 1

section "3. FIXING PYTHON PACKAGE STRUCTURE"

# Make fix_app_path.py executable
chmod +x fix_app_path.py 2>/dev/null

# Run fix_app_path.py to create proper Python package structure
if [ -f "fix_app_path.py" ]; then
  echo -e "  Creating proper Python package structure..."
  python fix_app_path.py
else
  echo -e "${YELLOW}  fix_app_path.py not found, skipping package structure fix.${NC}"
fi

section "4. REBUILDING DATABASE"

# Make initialize_database.py executable
chmod +x initialize_database.py 2>/dev/null

echo -e "  Removing and rebuilding database..."
python initialize_database.py

if [ $? -ne 0 ]; then
  fatal "Database initialization failed! Check logs above."
fi

section "5. STARTING BACKEND SERVER"

# Kill any existing servers on port 10000 again (just to be super sure)
pkill -f "python main.py" 2>/dev/null
kill -9 $(lsof -ti:10000 2>/dev/null) 2>/dev/null

# Wait a moment for port to be released
sleep 1

# Start the backend server
echo -e "  Starting backend server on port ${GREEN}10000${NC}..."
PORT=10000 python main.py &
BACKEND_PID=$!
echo $BACKEND_PID > .backend_pid

# Wait for backend to be ready
echo -e "  Waiting for backend to become available..."
MAX_ATTEMPTS=15
ATTEMPTS=0
while ! curl -s "http://localhost:10000/health" > /dev/null 2>&1 && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
  fatal "Backend failed to start properly. Check logs above."
fi

echo -e "\n  ${GREEN}Backend is running at: http://localhost:10000${NC}"

section "6. STARTING FRONTEND"

# Make sure we're using npx for serve
if ! command -v npx &> /dev/null; then
  fatal "npx not found. Please install Node.js and npm."
fi

cd frontend

# Frontend can be started in development or production mode
if [ "$1" == "--dev" ] || [ "$2" == "--dev" ]; then
  # Development mode with React dev server
  echo -e "  Starting frontend in ${GREEN}DEVELOPMENT${NC} mode..."
  
  # Force port 3001 for development server
  echo -e "  Setting port to ${GREEN}3001${NC}..."
  PORT=3001 npm start &
  FRONTEND_PID=$!
  FRONTEND_PORT=3001
else
  # Production mode with static build
  echo -e "  Starting frontend in ${GREEN}PRODUCTION${NC} mode..."
  
  # Build if needed
  if [ ! -d "build" ] || [ "$1" == "--rebuild-frontend" ] || [ "$2" == "--rebuild-frontend" ]; then
    echo -e "  Building frontend (this may take a minute)..."
    npm run build
    
    if [ $? -ne 0 ]; then
      cd $PROJECT_ROOT
      kill $(cat .backend_pid) 2>/dev/null
      fatal "Frontend build failed. Check errors above."
    fi
  fi
  
  # Start production server
  echo -e "  Serving static build on port ${GREEN}3001${NC}..."
  npx serve -l 3001 build &
  FRONTEND_PID=$!
  FRONTEND_PORT=3001
fi

echo $FRONTEND_PID > ../.frontend_pid
cd $PROJECT_ROOT

# Wait for frontend to start
echo -e "  Waiting for frontend to become available..."
sleep 3

section "7. APPLICATION IS READY!"

# Print URLs and instructions
echo -e "${GREEN}${BOLD}Backend URL:${NC} http://localhost:10000"
echo -e "${GREEN}${BOLD}Frontend URL:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}${BOLD}API Documentation:${NC} http://localhost:10000/docs"

# Open browser if possible
if command -v open &> /dev/null; then
  echo -e "  Opening frontend in your browser..."
  open "http://localhost:${FRONTEND_PORT}"
fi

# Final instruction
echo -e "\n${YELLOW}${BOLD}Press Ctrl+C to stop all servers${NC}"

# Setup cleanup
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  kill $(cat .frontend_pid) 2>/dev/null
  kill $(cat .backend_pid) 2>/dev/null
  rm -f .backend_pid .frontend_pid
  echo -e "${GREEN}Shutdown complete.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for Ctrl+C
wait 