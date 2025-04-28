#!/bin/bash
# Verification script for the restaurant app stack

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default ports (these should match what's in start_dev.sh)
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Get the actual backend port by checking netstat or lsof
echo "Looking for actual backend port..."
if command -v lsof &> /dev/null; then
  # If lsof is available, use it
  BACKEND_PROCESSES=$(lsof -i -P -n | grep LISTEN | grep python)
  if [[ ! -z "$BACKEND_PROCESSES" ]]; then
    DETECTED_PORT=$(echo "$BACKEND_PROCESSES" | grep -oE ':[0-9]+' | grep -oE '[0-9]+' | head -1)
    if [[ ! -z "$DETECTED_PORT" ]]; then
      echo "Detected backend running on port: $DETECTED_PORT"
      BACKEND_PORT=$DETECTED_PORT
    fi
  fi
elif command -v netstat &> /dev/null; then
  # Otherwise try netstat
  BACKEND_PROCESSES=$(netstat -tuln | grep LISTEN | grep python)
  if [[ ! -z "$BACKEND_PROCESSES" ]]; then
    DETECTED_PORT=$(echo "$BACKEND_PROCESSES" | grep -oE ':[0-9]+' | grep -oE '[0-9]+' | head -1)
    if [[ ! -z "$DETECTED_PORT" ]]; then
      echo "Detected backend running on port: $DETECTED_PORT"
      BACKEND_PORT=$DETECTED_PORT
    fi
  fi
fi

# Function to check if a port is responding
check_port() {
  local port=$1
  local url="http://localhost:${port}"
  echo "Checking if backend is responding at $url..."
  
  # Try with curl first
  if command -v curl &> /dev/null; then
    if curl -s --head --request GET $url | grep -E "200|302|307|308|404" > /dev/null; then
      echo "Backend is responding on port $port (even with 404, which is normal)"
      return 0
    fi
  fi
  
  # Try with wget if curl fails
  if command -v wget &> /dev/null; then
    # Using -S flag to see server response headers, and look for any valid HTTP response
    if wget -S --spider -q $url 2>&1 | grep -E "HTTP/1.1 200|HTTP/1.1 404|HTTP/1.1 302" > /dev/null; then
      echo "Backend is responding on port $port (even with 404, which is normal)"
      return 0
    fi
  fi
  
  return 1
}

# Check if the backend is running at the detected port
if check_port $BACKEND_PORT; then
  echo -e "${GREEN}Backend found running on port $BACKEND_PORT${NC}"
  BACKEND_FOUND=true
else
  echo -e "${YELLOW}Backend not responding on the detected port. Trying API path...${NC}"
  # Try the API path, as the root might return 404
  if command -v curl &> /dev/null; then
    if curl -s --head --request GET "http://localhost:${BACKEND_PORT}/api/v1/docs" | grep -E "200|302|307|308|404" > /dev/null; then
      echo -e "${GREEN}Backend API docs found at http://localhost:${BACKEND_PORT}/api/v1/docs${NC}"
      BACKEND_FOUND=true
    else
      BACKEND_FOUND=false
    fi
  elif command -v wget &> /dev/null; then
    if wget -S --spider -q "http://localhost:${BACKEND_PORT}/api/v1/docs" 2>&1 | grep -E "HTTP/1.1 200|HTTP/1.1 404|HTTP/1.1 302" > /dev/null; then
      echo -e "${GREEN}Backend API docs found at http://localhost:${BACKEND_PORT}/api/v1/docs${NC}"
      BACKEND_FOUND=true
    else
      BACKEND_FOUND=false
    fi
  else
    BACKEND_FOUND=false
  fi
fi

if [ "$BACKEND_FOUND" != true ]; then
  echo -e "${RED}Could not find backend running on port $BACKEND_PORT.${NC}"
  echo "If the backend is running on a different port, edit this script or use: BACKEND_PORT=your_port ./verify_implementation.sh"
  exit 1
fi

# Check if the frontend is running
echo "Checking if frontend is running..."
if command -v curl &> /dev/null; then
  if curl -s --head --request GET http://localhost:$FRONTEND_PORT | grep -E "200|302|307|308|404" > /dev/null; then
    echo -e "${GREEN}Frontend is running on port $FRONTEND_PORT${NC}"
  else
    echo -e "${YELLOW}Warning: Frontend may not be running on port $FRONTEND_PORT${NC}"
  fi
elif command -v wget &> /dev/null; then
  if wget -S --spider -q http://localhost:$FRONTEND_PORT 2>&1 | grep -E "HTTP/1.1 200|HTTP/1.1 404|HTTP/1.1 302" > /dev/null; then
    echo -e "${GREEN}Frontend is running on port $FRONTEND_PORT${NC}"
  else
    echo -e "${YELLOW}Warning: Frontend may not be running on port $FRONTEND_PORT${NC}"
  fi
else
  echo -e "${YELLOW}Warning: Cannot check if frontend is running. No curl or wget available.${NC}"
fi

# Check API endpoints
echo "Checking API endpoints..."
API_PATH="/api/v1"
DOCS_PATH="${API_PATH}/docs"
FLOOR_PLANS_PATH="${API_PATH}/floor-plans"

if command -v curl &> /dev/null; then
  # Try API docs endpoint
  DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}${DOCS_PATH}")
  if [[ "$DOCS_RESPONSE" == "200" || "$DOCS_RESPONSE" == "308" || "$DOCS_RESPONSE" == "302" ]]; then
    echo -e "${GREEN}API docs accessible at http://localhost:${BACKEND_PORT}${DOCS_PATH}${NC}"
  else
    echo -e "${YELLOW}API docs not found at expected path (status: $DOCS_RESPONSE)${NC}"
  fi
  
  # Try floor plans endpoint
  FLOOR_PLANS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}${FLOOR_PLANS_PATH}")
  if [[ "$FLOOR_PLANS_RESPONSE" == "200" || "$FLOOR_PLANS_RESPONSE" == "308" || "$FLOOR_PLANS_RESPONSE" == "302" ]]; then
    echo -e "${GREEN}Floor plans API endpoint accessible${NC}"
    
    # Try to get tables for default floor plan
    DEFAULT_TABLES_PATH="${FLOOR_PLANS_PATH}/default/tables"
    TABLES_RESPONSE=$(curl -s "http://localhost:${BACKEND_PORT}${DEFAULT_TABLES_PATH}")
    if [[ "$TABLES_RESPONSE" == *"tables"* || "$TABLES_RESPONSE" == *"id"* || "$TABLES_RESPONSE" == *"[]"* ]]; then
      echo -e "${GREEN}Successfully retrieved tables from default floor plan:${NC}"
      echo "$TABLES_RESPONSE" | head -30
    else
      echo -e "${YELLOW}Could not find tables for default floor plan.${NC}"
      echo "Response: ${TABLES_RESPONSE}"
    fi
  else
    echo -e "${YELLOW}Floor plans API endpoint not accessible (status: $FLOOR_PLANS_RESPONSE)${NC}"
  fi
elif command -v wget &> /dev/null; then
  # Try with wget if curl is not available
  echo -e "${YELLOW}Using wget for API checks (less detailed output)${NC}"
  if wget -q -O - "http://localhost:${BACKEND_PORT}${DOCS_PATH}" > /dev/null; then
    echo -e "${GREEN}API docs accessible${NC}"
  else
    echo -e "${YELLOW}API docs not found at expected path${NC}"
  fi
fi

echo ""
echo -e "${GREEN}==== Verification Summary ====${NC}"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "API Docs: http://localhost:${BACKEND_PORT}${DOCS_PATH}"
echo "Floor Plans API: http://localhost:${BACKEND_PORT}${FLOOR_PLANS_PATH}"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Floor Plan Editor: http://localhost:$FRONTEND_PORT/admin"
echo ""
echo "To start the services: ./start_dev.sh"
echo "To stop the services: ./stop_dev.sh"
echo -e "${GREEN}============================${NC}"