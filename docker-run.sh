#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}=== Plate Order System - Docker =====${NC}"
echo -e "${BLUE}======================================${NC}"

# Navigate to project root
cd "$(dirname "$0")"

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}docker-compose is not installed. Please install docker-compose and try again.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker daemon is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Build the Docker images
if [ "$1" == "--rebuild" ]; then
    echo -e "${YELLOW}Rebuilding Docker images...${NC}"
    docker-compose build --no-cache
else
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
fi

# Start the Docker containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose up -d

# Check if containers started successfully
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Docker containers. See error above.${NC}"
    exit 1
fi

# Wait for the services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
MAX_ATTEMPTS=30
ATTEMPTS=0
while ! curl -s http://localhost:10000/health &> /dev/null && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    echo -n "."
    sleep 1
    ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
    echo -e "\n${GREEN}Backend is running at: http://localhost:10000${NC}"
else
    echo -e "\n${RED}Backend failed to start properly. Checking logs...${NC}"
    docker-compose logs backend
    exit 1
fi

# Check if frontend is running
echo -e "${YELLOW}Checking if frontend is running...${NC}"
ATTEMPTS=0
while ! curl -s http://localhost:3000 &> /dev/null && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    echo -n "."
    sleep 1
    ATTEMPTS=$((ATTEMPTS+1))
done

if [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; then
    echo -e "\n${GREEN}Frontend is running at: http://localhost:3000${NC}"
else
    echo -e "\n${RED}Frontend failed to start properly. Checking logs...${NC}"
    docker-compose logs frontend
    exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Plate Order System is now running in Docker!${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${YELLOW}Backend URL: ${GREEN}http://localhost:10000${NC}"
echo -e "${YELLOW}Frontend URL: ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}To stop: ${GREEN}docker-compose down${NC}"
echo -e "${YELLOW}To view logs: ${GREEN}docker-compose logs -f${NC}"

# Open browser if possible
if command -v open &> /dev/null; then
    echo -e "${YELLOW}Opening frontend in your browser...${NC}"
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}Opening frontend in your browser...${NC}"
    xdg-open "http://localhost:3000"
fi 