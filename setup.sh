#!/bin/bash

# One-Click Setup Script for Plate Order System with Floor Plan Management
# This script automates the entire implementation process for the enhanced plate order system
# including floor plan management, dynamic seat tracking, order routing, and voice recording

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
echo "║   Plate Order System - Enhanced Edition with Floor Plan Management        ║"
echo "║                                                                           ║"
echo "║   One-Click Setup Script                                                  ║"
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a Python package is installed
python_package_installed() {
    python3 -c "import $1" >/dev/null 2>&1
}

# Check if we're in the right directory
if [ ! -d "app" ] || [ ! -f "main.py" ]; then
    print_error "This script must be run from the plate-order-system-enhanced directory"
    print_info "Please navigate to the plate-order-system-enhanced directory and try again"
    exit 1
fi

# Step 1: Check and install dependencies
print_section "Step 1: Checking and installing dependencies"

# Check for Python
if command_exists python3; then
    print_success "Python 3 is installed"
    python3 --version
else
    print_error "Python 3 is not installed"
    print_info "Installing Python 3..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
fi

# Check for pip
if command_exists pip3; then
    print_success "pip is installed"
else
    print_error "pip is not installed"
    print_info "Installing pip..."
    sudo apt-get install -y python3-pip
fi

# Check for Node.js
if command_exists node; then
    print_success "Node.js is installed"
    node --version
else
    print_error "Node.js is not installed"
    print_info "Installing Node.js..."
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check for npm
if command_exists npm; then
    print_success "npm is installed"
    npm --version
else
    print_error "npm is not installed"
    print_info "Installing npm..."
    sudo apt-get install -y npm
fi

# Install Python dependencies
print_info "Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    print_success "Python dependencies installed successfully"
else
    print_error "Failed to install Python dependencies"
    print_info "Creating requirements.txt and trying again..."
    
    # Create requirements.txt if it doesn't exist
    cat > requirements.txt << EOF
fastapi>=0.68.0
uvicorn>=0.15.0
sqlalchemy>=1.4.23
pydantic>=1.8.2
python-dotenv>=0.19.0
python-multipart>=0.0.5
aiofiles>=0.7.0
jinja2>=3.0.1
deepgram-sdk>=2.4.0
websockets>=10.0
asyncio>=3.4.3
EOF
    
    pip3 install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        print_success "Python dependencies installed successfully"
    else
        print_error "Failed to install Python dependencies"
        exit 1
    fi
fi

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install fabric@5.3.1 --save

if [ $? -eq 0 ]; then
    print_success "Node.js dependencies installed successfully"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# Step 2: Set up environment variables
print_section "Step 2: Setting up environment variables"

# Check if .env file exists
if [ -f ".env" ]; then
    print_info "Found existing .env file"
    # Backup existing .env file
    cp .env .env.backup
    print_info "Backed up existing .env file to .env.backup"
else
    print_info "Creating new .env file"
fi

# Create or update .env file
cat > .env << EOF
# Plate Order System Environment Variables
DEBUG=True
SECRET_KEY=plate_order_system_secret_key_change_in_production
DATABASE_URL=sqlite:///./app.db

# Deepgram API Key - Replace with your actual key for production
DEEPGRAM_API_KEY=your_deepgram_api_key

# Server Configuration
HOST=0.0.0.0
PORT=8000
EOF

print_success "Environment variables set up successfully"
print_info "NOTE: For production, please update the DEEPGRAM_API_KEY in the .env file"

# Step 3: Set up database
print_section "Step 3: Setting up database"

print_info "Creating database initialization script..."
cat > init_db.py << EOF
import asyncio
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.db.models import Base
from app.core.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL)

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")
EOF

print_info "Initializing database..."
python3 init_db.py

if [ $? -eq 0 ]; then
    print_success "Database initialized successfully"
else
    print_error "Failed to initialize database"
    exit 1
fi

# Step 4: Set up floor plan management system
print_section "Step 4: Setting up floor plan management system"

print_info "Ensuring all necessary directories exist..."
mkdir -p app/static/js/lib
mkdir -p app/static/js/admin
mkdir -p app/static/css/admin
mkdir -p app/templates/pages/admin
mkdir -p app/api/v1/endpoints
mkdir -p app/db/repositories

print_info "Downloading Fabric.js library..."
curl -s -o app/static/js/lib/fabric.min.js https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js

if [ $? -eq 0 ]; then
    print_success "Fabric.js downloaded successfully"
else
    print_error "Failed to download Fabric.js"
    print_info "Copying from npm directory..."
    cp node_modules/fabric/dist/fabric.min.js app/static/js/lib/
    
    if [ $? -eq 0 ]; then
        print_success "Fabric.js copied successfully from npm directory"
    else
        print_error "Failed to copy Fabric.js from npm directory"
        exit 1
    fi
fi

print_success "Floor plan management system set up successfully"

# Step 5: Set up voice recording functionality
print_section "Step 5: Setting up voice recording functionality"

print_info "Ensuring voice recording directories exist..."
mkdir -p app/static/js/components/voice
mkdir -p app/domain/services
mkdir -p app/websockets

print_success "Voice recording functionality set up successfully"

# Step 6: Update main.py to include all routes
print_section "Step 6: Updating main.py"

print_info "Updating main.py to include all routes..."
cat > main.py << EOF
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import orders, floor_plans, speech
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="Plate Order System",
    description="Enhanced plate order system with floor plan management",
    version="2.0.0"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers
app.include_router(orders.router)
app.include_router(floor_plans.router)
app.include_router(speech.router)

# Import page routes after mounting static files to avoid circular imports
from app.api.v1.endpoints import pages

# Include page routes
app.include_router(pages.router)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
EOF

print_success "main.py updated successfully"

# Step 7: Create page routes
print_section "Step 7: Creating page routes"

print_info "Creating page routes..."
mkdir -p app/api/v1/endpoints

cat > app/api/v1/endpoints/pages.py << EOF
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

from app.db.repositories.floor_plans import FloorPlanRepository
from app.db.session import get_db

router = APIRouter()

# Set up templates
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the index page"""
    return templates.TemplateResponse("pages/index.html", {"request": request})

@router.get("/server", response_class=HTMLResponse)
async def server_view(request: Request):
    """Render the server view page"""
    return templates.TemplateResponse("pages/server-view.html", {"request": request})

@router.get("/kitchen", response_class=HTMLResponse)
async def kitchen_view(request: Request):
    """Render the kitchen view page"""
    return templates.TemplateResponse("pages/kitchen-view.html", {"request": request})

@router.get("/bar", response_class=HTMLResponse)
async def bar_view(request: Request):
    """Render the bar view page"""
    return templates.TemplateResponse("pages/bar-view.html", {"request": request})

@router.get("/expo", response_class=HTMLResponse)
async def expo_view(request: Request):
    """Render the expo view page"""
    return templates.TemplateResponse("pages/expo-view.html", {"request": request})

@router.get("/admin/floor-plan", response_class=HTMLResponse)
async def floor_plan_admin(request: Request):
    """Render the floor plan admin page"""
    return templates.TemplateResponse("pages/admin/floor-plan.html", {"request": request})

@router.get("/admin/floor-plan/{floor_plan_id}", response_class=HTMLResponse)
async def floor_plan_edit(request: Request, floor_plan_id: int, db=Depends(get_db)):
    """Render the floor plan edit page"""
    # Get floor plan from database
    floor_plan_repo = FloorPlanRepository(db)
    floor_plan = floor_plan_repo.get_floor_plan(floor_plan_id)
    
    if not floor_plan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    
    return templates.TemplateResponse(
        "pages/admin/floor-plan.html", 
        {"request": request, "floor_plan_id": floor_plan_id}
    )
EOF

print_success "Page routes created successfully"

# Step 8: Create index page
print_section "Step 8: Creating index page"

print_info "Creating index page..."
mkdir -p app/templates/layouts
mkdir -p app/templates/pages

cat > app/templates/layouts/base.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Plate Order System{% endblock %}</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Design System CSS -->
    <link href="/static/css/design-system.css" rel="stylesheet">
    
    <!-- Page-specific CSS -->
    {% block css %}{% endblock %}
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/static/img/favicon.png">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">Plate Order System</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="/server">Server View</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/kitchen">Kitchen View</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/bar">Bar View</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/expo">Expo View</a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            Admin
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/admin/floor-plan">Floor Plan Management</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="container-fluid py-4">
        {% block content %}{% endblock %}
    </main>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 bg-light">
        <div class="container text-center">
            <span class="text-muted">Plate Order System &copy; 2025</span>
        </div>
    </footer>

    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Page-specific JavaScript -->
    {% block js %}{% endblock %}
</body>
</html>
EOF

cat > app/templates/pages/index.html << EOF
{% extends "layouts/base.html" %}

{% block title %}Plate Order System - Home{% endblock %}

{% block content %}
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card shadow-sm">
                <div class="card-body text-center">
                    <h1 class="display-4 mb-4">Welcome to Plate Order System</h1>
                    <p class="lead">Enhanced with Floor Plan Management and Voice Recognition</p>
                    
                    <hr class="my-4">
                    
                    <div class="row mt-5">
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Server View</h5>
                                    <p class="card-text">Take orders with voice recognition and manage tables</p>
                                    <a href="/server" class="btn btn-primary">Go to Server View</a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Kitchen View</h5>
                                    <p class="card-text">View and manage food orders</p>
                                    <a href="/kitchen" class="btn btn-primary">Go to Kitchen View</a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Bar View</h5>
                                    <p class="card-text">View and manage drink orders</p>
                                    <a href="/bar" class="btn btn-primary">Go to Bar View</a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Expo View</h5>
                                    <p class="card-text">Overview of all orders with floor plan</p>
                                    <a href="/expo" class="btn btn-primary">Go to Expo View</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <a href="/admin/floor-plan" class="btn btn-outline-primary">Floor Plan Management</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
EOF

print_success "Index page created successfully"

# Step 9: Create design system CSS
print_section "Step 9: Creating design system CSS"

print_info "Creating design system CSS..."
cat > app/static/css/design-system.css << EOF
/**
 * Design System CSS for Plate Order System
 * Provides consistent styling across all pages
 */

:root {
  /* Color palette */
  --primary: #0d6efd;
  --secondary: #6c757d;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
  --light: #f8f9fa;
  --dark: #212529;
  
  /* Typography */
  --font-family-sans-serif: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 1rem;
  --spacing-4: 1.5rem;
  --spacing-5: 3rem;
  
  /* Border radius */
  --border-radius: 0.25rem;
  --border-radius-lg: 0.5rem;
  --border-radius-sm: 0.125rem;
}

/* General styles */
body {
  font-family: var(--font-family-sans-serif);
  color: var(--dark);
  background-color: #f5f8fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

/* Card styles */
.card {
  border-radius: var(--border-radius-lg);
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: all 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}

/* Button styles */
.btn {
  border-radius: var(--border-radius);
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  background-color: var(--primary);
  border-color: var(--primary);
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

/* Table styles */
.table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

/* Form styles */
.form-control {
  border-radius: var(--border-radius);
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Badge styles */
.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
  border-radius: var(--border-radius-sm);
}

/* Alert styles */
.alert {
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
}

/* Navbar styles */
.navbar {
  padding: 0.75rem 1rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.navbar-brand {
  font-weight: 600;
}

/* Footer styles */
.footer {
  padding: 1.5rem 0;
  color: #6c757d;
  border-top: 1px solid #dee2e6;
}

/* Utility classes */
.shadow-sm {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}

.shadow {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.shadow-lg {
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
}

/* iPad optimizations */
@media (min-width: 768px) and (max-width: 1024px) {
  .btn {
    padding: 0.4rem 0.8rem;
  }
  
  .card {
    margin-bottom: 1rem;
  }
  
  .container {
    max-width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Mobile optimizations */
@media (max-width: 767.98px) {
  .btn {
    padding: 0.375rem 0.75rem;
  }
  
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .card {
    margin-bottom: 0.75rem;
  }
}
EOF

print_success "Design system CSS created successfully"

# Step 10: Start the application
print_section "Step 10: Starting the application"

print_info "Creating start script..."
cat > start.sh << EOF
#!/bin/bash
python3 main.py
EOF

chmod +x start.sh

print_success "Start script created successfully"

print_info "Creating README.md..."
cat > README.md << EOF
# Plate Order System - Enhanced Edition

## Features
- Floor Plan Management System
- Dynamic Seat Tracking
- Order Routing System (Food to Kitchen, Drinks to Bar)
- Voice Recording with Speech-to-Text
- Responsive Design for iPad and Mobile

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher

### Installation
1. Clone this repository
2. Run the one-click setup script:
   \`\`\`
   ./setup.sh
   \`\`\`
3. Update the \`.env\` file with your Deepgram API key
4. Start the application:
   \`\`\`
   ./start.sh
   \`\`\`
5. Open your browser and navigate to \`http://localhost:8000\`

## Views
- **Server View**: For servers to take orders using voice recognition
- **Kitchen View**: For kitchen staff to view and manage food orders
- **Bar View**: For bar staff to view and manage drink orders
- **Expo View**: For expo staff to view all orders with floor plan visualization
- **Admin View**: For managers to create and edit floor plans

## Voice Recording
The system uses Deepgram for speech-to-text processing. To use this feature:
1. Get a Deepgram API key from [https://deepgram.com](https://deepgram.com)
2. Add your API key to the \`.env\` file

## License
This project is licensed under the MIT License - see the LICENSE file for details.
EOF

print_success "README.md created successfully"

# Final message
print_section "Setup Complete!"

print_info "The Plate Order System with Floor Plan Management has been successfully set up."
print_info "To start the application, run:"
echo -e "${GREEN}    ./start.sh${NC}"
print_info "Then open your browser and navigate to:"
echo -e "${GREEN}    http://localhost:8000${NC}"

print_info "NOTE: For production use, please update the DEEPGRAM_API_KEY in the .env file"

echo -e "\n${BLUE}Thank you for using the Plate Order System - Enhanced Edition!${NC}\n"
