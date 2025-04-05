#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Enhanced Plate Order System Launcher ===${NC}"

# Navigate to the project root directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Set up Python path to ensure modules are found
export PYTHONPATH=$PROJECT_ROOT:$PYTHONPATH

# Set up environment variables
export DEEPGRAM_API_KEY=DEMO_KEY
export NODE_OPTIONS="--max-old-space-size=8192"
export DATABASE_URL="sqlite:///./restaurant.db"
export PORT=10000

# Clean up any stale pid files
rm -f .backend_pid .frontend_pid

# Kill existing processes more reliably
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
# Target specific ports first
for port in 10000 3001 3000; do
  pids=$(lsof -ti:$port)
  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}Attempting to kill processes on port $port: $pids${NC}"
    # Use kill -9 for forceful termination if needed
    kill -9 $pids 2>/dev/null || echo -e "${RED}Failed to kill processes on port $port. Manual check might be needed.${NC}"
  fi
done
# General cleanup for the backend script pattern, just in case
pkill -9 -f "python main.py" 2>/dev/null
pkill -9 -f "npm start" 2>/dev/null
pkill -9 -f "npx serve" 2>/dev/null
echo -e "${GREEN}Process cleanup attempted.${NC}"
# Short pause to allow ports to free up
sleep 1

# Make sure we have the required npm packages
echo -e "${YELLOW}Ensuring required npm packages are installed...${NC}"
if ! command -v npx &> /dev/null; then
  echo -e "${RED}npx not found. Please install Node.js and npm${NC}"
  exit 1
fi

# Run the project structure fix script
echo -e "${YELLOW}Running project structure fixes...${NC}"
python project_structure_fix.py
if [ $? -ne 0 ]; then
  echo -e "${RED}Project structure fix failed.${NC}"
  exit 1
fi

# Run the database fix script (optional, could be removed if initialize_database handles all cleanup)
echo -e "${YELLOW}Checking and fixing database issues...${NC}"
python database_fix.py
# Always run the full initialization script afterwards to ensure correct seeding
echo -e "${GREEN}Running database initialization (ensures fresh data)...${NC}"
python initialize_database.py
if [ $? -ne 0 ]; then
  echo -e "${RED}Database initialization failed. See errors above.${NC}"
  echo -e "${RED}Try removing app.db and restaurant.db files and running again.${NC}"
  exit 1
fi

echo -e "${GREEN}Database prepared successfully.${NC}"

# Make sure the restaurant floor plan image exists
if [ ! -f "src/app/static/img/restaurant-floor.jpg" ]; then
  echo -e "${YELLOW}Adding restaurant floor plan image...${NC}"
  mkdir -p src/app/static/img
  curl -s https://images.unsplash.com/photo-1574936611143-15d98eee43c0 -o src/app/static/img/restaurant-floor.jpg
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to download restaurant floor image.${NC}"
  fi
fi

# Make sure Python path includes the project root
export PYTHONPATH=$PROJECT_ROOT:$PYTHONPATH

# Start the backend server in background
echo -e "${YELLOW}Starting backend server on port 10000...${NC}"
PORT=10000 python main.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to become available
echo -e "${YELLOW}Waiting for backend to start...${NC}"
MAX_ATTEMPTS=30
ATTEMPTS=0
while ! curl -s "http://localhost:10000/health" > /dev/null 2>&1 && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
  echo -e "\n${GREEN}Backend is running on http://localhost:10000${NC}"
else
  echo -e "\n${RED}Backend failed to start properly. Check logs.${NC}"
  echo -e "${YELLOW}Trying to display backend errors...${NC}"
  ps -p $BACKEND_PID > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    kill $BACKEND_PID 2>/dev/null
  else
    echo -e "${RED}Backend process crashed. Check for import errors or conflicts.${NC}"
  fi
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
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
 fi

# Ensure dependencies are installed *before* starting
echo -e "${YELLOW}Ensuring frontend dependencies are installed...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install frontend dependencies. Check errors above.${NC}"
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Always remove the old build directory to ensure freshness
echo -e "${YELLOW}Removing old frontend build directory (if exists)...${NC}"
rm -rf build # Keep removing build dir just in case

# Always use the development server for now to avoid caching/serving issues
echo -e "${YELLOW}Starting frontend development server...${NC}"
cd $PROJECT_ROOT/frontend # Ensure we are in the frontend directory
PORT=3001 npm start &
FRONTEND_PID=$!
FRONTEND_PORT=3001
USING_DEV_SERVER=true # Explicitly set this


# Comment out the build/serve logic
## # Check for build directory, if not present try to build
## if [ ! -d "build" ] || [ "$1" == "--rebuild" ]; then
##  echo -e "${YELLOW}Building frontend...${NC}"
##  NODE_OPTIONS="--max-old-space-size=8192" npm run build
##  if [ $? -ne 0 ]; then
##    echo -e "${RED}Frontend build failed. Check errors above.${NC}"
##    echo -e "${YELLOW}Trying to start the development server instead...${NC}"
##
##    # In case of build failure, try to start the development server
##    cd $PROJECT_ROOT/frontend
##    PORT=3001 npm start &
##    FRONTEND_PID=$!
##    FRONTEND_PORT=3001
##    USING_DEV_SERVER=true
##  else
##    echo -e "${GREEN}Frontend build completed successfully.${NC}"
##    USING_DEV_SERVER=false
##  fi
## else
##  USING_DEV_SERVER=false
## fi
## #
## # # If we have a build and not using dev server, serve it with npx
## # if [ "$USING_DEV_SERVER" != "true" ]; then
## #  # Start frontend using npx serve
## #  echo -e "${GREEN}Starting frontend server on port 3001...${NC}"
## #  cd build
## #  npx serve -l 3001 . &
## #  FRONTEND_PID=$!
## #  FRONTEND_PORT=3001
## # fi

# Store PIDs for cleanup (ensure they are written to the project root)
echo $BACKEND_PID > "$PROJECT_ROOT/.backend_pid"
echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend_pid"

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
ATTEMPTS=0
while ! curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1 && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo -n "."
  sleep 1
  ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
  echo -e "\n${GREEN}Frontend is running on http://localhost:${FRONTEND_PORT}${NC}"
else
  echo -e "\n${YELLOW}Could not confirm frontend is running. It may be on a different port.${NC}"
  # Try to find the actual port
  if [ "$USING_DEV_SERVER" == "true" ]; then
    # Dev server will output the port it's using, so leave it
    echo -e "${YELLOW}Check the npm start output above for the correct port.${NC}"
  else
    # For serve, check if it's running on another port
    FRONTEND_PORT=$(lsof -i -P -n | grep LISTEN | grep node | grep -v 10000 | awk '{print $9}' | sed 's/.*://' | head -1)
    if [ ! -z "$FRONTEND_PORT" ]; then
      echo -e "${GREEN}Found frontend running on port ${FRONTEND_PORT}${NC}"
    else
      echo -e "${RED}Could not determine frontend port. Check for errors above.${NC}"
    fi
  fi
fi

echo -e "${GREEN}=== Plate Order System is now running! ===${NC}"
echo -e "${YELLOW}Backend URL: http://localhost:10000${NC}"
echo -e "${YELLOW}Frontend URL: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${YELLOW}API Endpoints:${NC}"
echo -e "  ${YELLOW}Dashboard Stats: http://localhost:10000/api/dashboard/stats${NC}"
echo -e "  ${YELLOW}Recent Orders: http://localhost:10000/api/orders/recent${NC}"
echo -e "  ${YELLOW}Tables Layout: http://localhost:10000/api/tables/layout${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Open browser if possible
if command -v open &> /dev/null; then
  echo -e "${GREEN}Opening frontend in your browser...${NC}"
  open "http://localhost:${FRONTEND_PORT}"
elif command -v xdg-open &> /dev/null; then
  echo -e "${GREEN}Opening frontend in your browser...${NC}"
  xdg-open "http://localhost:${FRONTEND_PORT}"
fi

# Trap SIGINT and SIGTERM to kill both processes
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  # Read PIDs from files for robustness
  BACKEND_PID_TO_KILL=$(cat "$PROJECT_ROOT/.backend_pid" 2>/dev/null)
  FRONTEND_PID_TO_KILL=$(cat "$PROJECT_ROOT/.frontend_pid" 2>/dev/null)

  if [ ! -z "$FRONTEND_PID_TO_KILL" ]; then
    kill $FRONTEND_PID_TO_KILL 2>/dev/null
  fi
  if [ ! -z "$BACKEND_PID_TO_KILL" ]; then
    kill $BACKEND_PID_TO_KILL 2>/dev/null
  fi

  # Additional cleanup just in case PIDs weren't captured or files were deleted
  pkill -9 -f "python main.py" 2>/dev/null
  pkill -9 -f "npm start" 2>/dev/null
  pkill -9 -f "npx serve" 2>/dev/null

  rm -f "$PROJECT_ROOT/.backend_pid" "$PROJECT_ROOT/.frontend_pid"
  echo -e "${GREEN}Shutdown complete.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes to finish (Removed 'wait' command to potentially avoid EOF error)
# wait
