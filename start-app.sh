#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Plate Order System Launcher ===${NC}"

# Navigate to the project root directory
cd "$(dirname "$0")"

# Kill existing processes
echo -e "${YELLOW}Stopping any existing processes...${NC}"
pkill -f "python main.py" 2>/dev/null
for port in 10000 3000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}Killing process $pid on port $port${NC}"
    kill -9 $pid 2>/dev/null
  fi
done

# Initialize the database
echo -e "${YELLOW}Checking database setup...${NC}"
if [ -f "initialize_database.py" ]; then
  echo -e "${GREEN}Running database initialization...${NC}"
  python initialize_database.py
  if [ $? -ne 0 ]; then
    echo -e "${RED}Database initialization failed. Check errors above.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Database initialized successfully.${NC}"
else
  echo -e "${YELLOW}No initialize_database.py found. Assuming database is already set up.${NC}"
fi

# Start the backend
echo -e "${YELLOW}Starting backend server...${NC}"
python main.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to become available
echo -e "${YELLOW}Waiting for backend to start...${NC}"
MAX_ATTEMPTS=30
ATTEMPTS=0
while ! curl -s "http://localhost:10000/health" > /dev/null && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
  echo -e "\n${GREEN}Backend is running on http://localhost:10000${NC}"
else
  echo -e "\n${RED}Backend failed to start properly. Check logs.${NC}"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Start the frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd frontend

# Check if build exists, otherwise build it
if [ ! -d "build" ]; then
  echo -e "${YELLOW}Building frontend...${NC}"
  npm run build
  if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed. Check errors above.${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
fi

# Serve the frontend using npx
echo -e "${GREEN}Starting frontend server...${NC}"
npx serve -s build &
FRONTEND_PID=$!
cd ..

# Store PIDs for cleanup
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid

echo -e "${GREEN}=== Plate Order System is now running! ===${NC}"
echo -e "${YELLOW}Backend URL: http://localhost:10000${NC}"
echo -e "${YELLOW}Frontend URL: Check the output above (typically http://localhost:3000 or another port if 3000 is in use)${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Trap SIGINT and SIGTERM to kill both processes
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $FRONTEND_PID 2>/dev/null
  kill $BACKEND_PID 2>/dev/null
  rm -f .backend_pid .frontend_pid
  echo -e "${GREEN}Shutdown complete.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes to finish
wait 