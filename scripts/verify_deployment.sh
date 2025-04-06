#!/bin/bash

# Deployment verification script for Plate Order System
# This script verifies that the application is deployed correctly

set -e

# Configuration
APP_NAME="plate-order-system"
DEPLOY_DIR="/home/ubuntu/projects/plate-order-system-enhanced"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Print success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if containers are running
check_containers() {
  print_header "Checking Docker containers"
  
  if docker ps | grep -q "plate-order-system"; then
    print_success "Application containers are running"
    docker ps
  else
    print_error "Application containers are not running"
    exit 1
  fi
}

# Check application health
check_health() {
  print_header "Checking application health"
  
  if curl -s http://localhost:8000/health | grep -q "healthy"; then
    print_success "Application is healthy"
  else
    print_error "Application health check failed"
    exit 1
  fi
}

# Check Nginx configuration
check_nginx() {
  print_header "Checking Nginx configuration"
  
  if docker exec -it $(docker ps -q -f name=nginx) nginx -t 2>/dev/null; then
    print_success "Nginx configuration is valid"
  else
    print_error "Nginx configuration is invalid"
    exit 1
  fi
}

# Check SSL certificate
check_ssl() {
  print_header "Checking SSL certificate"
  
  if openssl s_client -connect localhost:443 -servername localhost </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    print_success "SSL certificate is valid"
  else
    print_warning "SSL certificate is self-signed (expected for development)"
  fi
}

# Check application logs
check_logs() {
  print_header "Checking application logs"
  
  docker logs $(docker ps -q -f name=app) --tail 20
  print_success "Application logs displayed"
}

# Main function
main() {
  print_header "Starting verification of $APP_NAME deployment"
  
  check_containers
  check_health
  check_nginx
  check_ssl
  check_logs
  
  print_header "Verification completed successfully"
  echo -e "The application is running correctly at https://localhost"
  echo -e "You can access the API documentation at https://localhost/docs"
}

# Run the main function
main
