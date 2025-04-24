#!/bin/bash

# Exit on error
set -e

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$APP_DIR/venv"
VOICE_ORDER_FIXES="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/voice-order-fixes"
SETUP_SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/setup-scripts"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to app directory
cd "$APP_DIR" || exit 1

# Create backup directory
mkdir -p "$APP_DIR/backup"

# Function to display steps
show_step() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function for user confirmation
confirm() {
    read -p "$1 (y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Initialize virtual environment
init_venv() {
    show_step "Setting up Python virtual environment"
    
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv "$VENV_DIR"
    else
        echo -e "${GREEN}Virtual environment already exists.${NC}"
    fi
    
    # Activate virtual environment
    source "$VENV_DIR/bin/activate"
    
    # Install dependencies
    echo -e "${GREEN}Installing dependencies...${NC}"
    pip install -r requirements.txt
    
    # Ensure Deepgram SDK is installed
    if ! pip show deepgram-sdk > /dev/null; then
        echo -e "${YELLOW}Installing Deepgram SDK...${NC}"
        pip install deepgram-sdk
        
        # Update requirements.txt if needed
        if ! grep -q "deepgram-sdk" requirements.txt; then
            echo "deepgram-sdk" >> requirements.txt
        fi
    fi
}

# Initialize Supabase database
init_supabase() {
    show_step "Initializing Supabase database"
    
    # Run the Supabase initialization script
    python "$APP_DIR/scripts/init_supabase.py"
}

# Integrate voice order system
integrate_voice_system() {
    show_step "Integrating voice recognition system"
    
    # Check if voice order fixes directory exists
    if [ ! -d "$VOICE_ORDER_FIXES" ]; then
        echo -e "${RED}Voice order fixes directory not found: $VOICE_ORDER_FIXES${NC}"
        echo -e "${YELLOW}Skipping voice integration${NC}"
        return
    fi
    
    # Backup existing files
    echo -e "${GREEN}Backing up existing files...${NC}"
    cp "$APP_DIR/app/websockets/connection_manager.py" "$APP_DIR/backup/" 2>/dev/null || true
    cp "$APP_DIR/voice-recognition.css" "$APP_DIR/backup/" 2>/dev/null || true
    
    # Create necessary directories
    echo -e "${GREEN}Ensuring necessary directories exist...${NC}"
    mkdir -p "$APP_DIR/app/static/js"
    mkdir -p "$APP_DIR/app/websockets"
    
    # Copy improved files
    echo -e "${GREEN}Copying improved voice recognition files...${NC}"
    cp "$VOICE_ORDER_FIXES/improved-speech.py" "$APP_DIR/app/websockets/"
    cp "$VOICE_ORDER_FIXES/voice-recognition.css" "$APP_DIR/"
    cp "$VOICE_ORDER_FIXES/improved-ipad-voice-recognition.js" "$APP_DIR/app/static/js/"
    
    echo -e "${GREEN}Voice recognition integration complete!${NC}"
}

# Check for frontend setup
check_frontend() {
    show_step "Checking frontend setup"
    
    # Check if setup-scripts directory exists
    if [ ! -d "$SETUP_SCRIPTS" ]; then
        echo -e "${RED}Setup scripts directory not found: $SETUP_SCRIPTS${NC}"
        echo -e "${YELLOW}Skipping frontend setup check${NC}"
        return
    fi
    
    # Check for Supabase frontend project
    if [ -d "$SETUP_SCRIPTS/supabase-api-project" ]; then
        echo -e "${GREEN}Found Supabase frontend project${NC}"
        
        # Check if we should sync environment variables
        if confirm "Would you like to sync Supabase environment variables from the frontend project?"; then
            echo -e "${GREEN}Syncing Supabase environment variables...${NC}"
            
            # Extract Supabase URL and key from .env.local
            if [ -f "$SETUP_SCRIPTS/supabase-api-project/.env.local" ]; then
                SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$SETUP_SCRIPTS/supabase-api-project/.env.local" | cut -d '=' -f2)
                SUPABASE_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY "$SETUP_SCRIPTS/supabase-api-project/.env.local" | cut -d '=' -f2)
                DEEPGRAM_KEY=$(grep DEEPGRAM_API_KEY "$SETUP_SCRIPTS/supabase-api-project/.env.local" | cut -d '=' -f2)
                
                # Update .env file
                sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" "$APP_DIR/.env"
                sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY|" "$APP_DIR/.env"
                
                if [ -n "$DEEPGRAM_KEY" ]; then
                    sed -i.bak "s|DEEPGRAM_API_KEY=.*|DEEPGRAM_API_KEY=$DEEPGRAM_KEY|" "$APP_DIR/.env"
                fi
                
                rm -f "$APP_DIR/.env.bak"
                
                echo -e "${GREEN}Environment variables updated${NC}"
            else
                echo -e "${YELLOW}Frontend .env.local file not found${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}Supabase frontend project not found${NC}"
    fi
}

# Start the application
start_app() {
    show_step "Starting the application"
    
    # Activate virtual environment if not already activated
    if [ -z "$VIRTUAL_ENV" ]; then
        source "$VENV_DIR/bin/activate"
    fi
    
    echo -e "${GREEN}Starting the application...${NC}"
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

# Main execution
show_step "Plate Order System Setup"
echo "This script will set up all components of the Plate Order System:"
echo "1. Python virtual environment and dependencies"
echo "2. Supabase database initialization"
echo "3. Voice recognition integration"
echo "4. Frontend environment sync"
echo "5. Start the application"
echo

# Run setup steps
init_venv
init_supabase
integrate_voice_system
check_frontend

# Ask if user wants to start the application
if confirm "Would you like to start the application now?"; then
    start_app
else
    echo -e "\n${GREEN}Setup complete! Run 'scripts/start_app.sh' to start the application.${NC}"
fi 