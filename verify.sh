#!/bin/bash

# Verification Script for Plate Order System with Floor Plan Management
# This script tests the implementation to ensure everything works as expected

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
echo "║   Verification Script                                                     ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════${NC}\n"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "app" ] || [ ! -f "main.py" ]; then
    print_error "This script must be run from the plate-order-system-enhanced directory"
    print_info "Please navigate to the plate-order-system-enhanced directory and try again"
    exit 1
fi

# Step 1: Verify file structure
print_section "Step 1: Verifying file structure"

# Define required files and directories
required_files=(
    "main.py"
    "setup.sh"
    "app/core/config.py"
    "app/db/models.py"
    "app/db/session.py"
    "app/api/v1/schemas.py"
    "app/domain/services/speech_service.py"
    "app/domain/services/deepgram_service.py"
    "app/static/js/components/voice/VoiceRecorder.js"
    "app/templates/layouts/base.html"
    "app/templates/pages/server-view.html"
    "app/templates/pages/kitchen-view.html"
    "app/templates/pages/bar-view.html"
    "app/templates/pages/expo-view.html"
    "app/templates/pages/admin/floor-plan.html"
    "app/static/css/design-system.css"
    "app/static/js/admin/floor-plan-designer.js"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found $file"
    else
        print_error "Missing $file"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -eq 0 ]; then
    print_success "All required files are present"
else
    print_error "$missing_files required files are missing"
fi

# Step 2: Verify Python dependencies
print_section "Step 2: Verifying Python dependencies"

# Check for required Python packages
required_packages=(
    "fastapi"
    "uvicorn"
    "sqlalchemy"
    "pydantic"
    "python-dotenv"
    "python-multipart"
    "aiofiles"
    "jinja2"
    "websockets"
    "asyncio"
)

missing_packages=0
for package in "${required_packages[@]}"; do
    if python3 -c "import $package" 2>/dev/null; then
        print_success "Found Python package: $package"
    else
        print_error "Missing Python package: $package"
        missing_packages=$((missing_packages + 1))
    fi
done

if [ $missing_packages -eq 0 ]; then
    print_success "All required Python packages are installed"
else
    print_error "$missing_packages required Python packages are missing"
    print_info "Run 'pip3 install -r requirements.txt' to install missing packages"
fi

# Step 3: Verify JavaScript dependencies
print_section "Step 3: Verifying JavaScript dependencies"

if [ -f "app/static/js/lib/fabric.min.js" ]; then
    print_success "Found Fabric.js library"
else
    print_error "Missing Fabric.js library"
    print_info "Run 'curl -s -o app/static/js/lib/fabric.min.js https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js' to download it"
fi

# Step 4: Verify database setup
print_section "Step 4: Verifying database setup"

if [ -f "app.db" ]; then
    print_success "Found database file: app.db"
else
    print_error "Missing database file: app.db"
    print_info "The database will be created when you run the application for the first time"
fi

# Step 5: Verify environment variables
print_section "Step 5: Verifying environment variables"

if [ -f ".env" ]; then
    print_success "Found .env file"
    
    # Check for required environment variables
    required_env_vars=(
        "DEBUG"
        "SECRET_KEY"
        "DATABASE_URL"
        "DEEPGRAM_API_KEY"
        "HOST"
        "PORT"
    )
    
    missing_env_vars=0
    for var in "${required_env_vars[@]}"; do
        if grep -q "^$var=" .env; then
            print_success "Found environment variable: $var"
        else
            print_error "Missing environment variable: $var"
            missing_env_vars=$((missing_env_vars + 1))
        fi
    done
    
    if [ $missing_env_vars -eq 0 ]; then
        print_success "All required environment variables are set"
    else
        print_error "$missing_env_vars required environment variables are missing"
    fi
else
    print_error "Missing .env file"
    print_info "Run './setup.sh' to create the .env file"
fi

# Step 6: Verify server startup
print_section "Step 6: Verifying server startup"

print_info "Attempting to start the server in the background..."
python3 main.py > server_output.log 2>&1 &
server_pid=$!

# Wait for server to start
sleep 5

# Check if server is running
if ps -p $server_pid > /dev/null; then
    print_success "Server started successfully (PID: $server_pid)"
    
    # Test server connection
    print_info "Testing server connection..."
    if curl -s http://localhost:8000 > /dev/null; then
        print_success "Server is responding to requests"
    else
        print_error "Server is not responding to requests"
    fi
    
    # Stop the server
    print_info "Stopping the server..."
    kill $server_pid
    wait $server_pid 2>/dev/null
    print_success "Server stopped"
else
    print_error "Failed to start the server"
    print_info "Check server_output.log for details"
fi

# Step 7: Final verification
print_section "Step 7: Final verification"

# Count total successes and errors
total_successes=$(grep -c "✓" <<< "$(cat $0 | grep -E "print_success")")
total_errors=$(grep -c "✗" <<< "$(cat $0 | grep -E "print_error")")

print_info "Verification complete!"
print_info "Total successes: $total_successes"
print_info "Total errors: $total_errors"

if [ $total_errors -eq 0 ]; then
    print_success "All verification checks passed!"
    echo -e "\n${GREEN}The Plate Order System with Floor Plan Management is ready to use!${NC}"
    echo -e "${GREEN}Run './start.sh' to start the application.${NC}\n"
else
    print_error "Some verification checks failed."
    echo -e "\n${YELLOW}Please address the issues above before using the application.${NC}\n"
fi

# Clean up
if [ -f "server_output.log" ]; then
    rm server_output.log
fi
