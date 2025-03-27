#!/bin/bash

# Module 1 Implementation Script for Plate Order System
# This script implements the Project Structure and Foundation module

echo "Starting Module 1 Implementation: Project Structure and Foundation"
echo "==============================================================="

# Step 1: Clean up duplicate directory structure
echo "Step 1: Cleaning up duplicate directory structure..."
if [ -d "plate-order-system" ]; then
    echo "Removing duplicate plate-order-system directory..."
    rm -rf plate-order-system
    echo "Duplicate directory removed."
else
    echo "No duplicate directory found, skipping cleanup."
fi

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
pip install -r requirements.txt
npm init -y
npm install tailwindcss@latest postcss@latest autoprefixer@latest

# Step 3: Set up Tailwind CSS
echo "Step 3: Setting up Tailwind CSS..."
mkdir -p app/static/css/build

# Create tailwind.config.js
echo "Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/templates/**/*.html",
    "./app/static/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
EOF

# Create postcss.config.js
echo "Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOF

# Create base Tailwind CSS file
echo "Creating base Tailwind CSS file..."
mkdir -p app/static/css
cat > app/static/css/tailwind.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply bg-secondary-200 text-secondary-800 hover:bg-secondary-300 focus:ring-secondary-300;
  }
  
  .btn-success {
    @apply bg-success text-white hover:bg-success/90 focus:ring-success/50;
  }
  
  .btn-danger {
    @apply bg-danger text-white hover:bg-danger/90 focus:ring-danger/50;
  }
  
  .btn-sm {
    @apply px-2 py-1 text-sm;
  }
  
  .btn-lg {
    @apply px-6 py-3 text-lg;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .form-input {
    @apply w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  
  .form-label {
    @apply block text-sm font-medium text-secondary-700 mb-1;
  }
}
EOF

# Create package.json scripts for Tailwind
echo "Updating package.json with Tailwind build scripts..."
cat > package.json << 'EOF'
{
  "name": "plate-order-system",
  "version": "1.0.0",
  "description": "Restaurant voice ordering platform",
  "scripts": {
    "build:css": "tailwindcss -i ./app/static/css/tailwind.css -o ./app/static/css/build/styles.css",
    "watch:css": "tailwindcss -i ./app/static/css/tailwind.css -o ./app/static/css/build/styles.css --watch",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "restaurant",
    "ordering",
    "voice"
  ],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.3.1"
  }
}
EOF

# Step 4: Create modular file structure for frontend components
echo "Step 4: Creating modular file structure for frontend components..."
mkdir -p app/static/js/components
mkdir -p app/static/js/utils
mkdir -p app/static/js/services

# Create component base files
echo "Creating component base files..."
cat > app/static/js/components/index.js << 'EOF'
// Component exports
export * from './ui/Button';
export * from './ui/Card';
export * from './ui/Modal';
export * from './ui/Table';
export * from './ui/Form';
export * from './layout/Header';
export * from './layout/Footer';
export * from './layout/Sidebar';
export * from './floor-plan/FloorPlan';
export * from './orders/OrderCard';
export * from './voice/VoiceRecorder';
EOF

# Create component directories
mkdir -p app/static/js/components/ui
mkdir -p app/static/js/components/layout
mkdir -p app/static/js/components/floor-plan
mkdir -p app/static/js/components/orders
mkdir -p app/static/js/components/voice

# Create utility files
cat > app/static/js/utils/index.js << 'EOF'
// Utility exports
export * from './api';
export * from './date';
export * from './format';
export * from './validation';
EOF

# Create utility base files
cat > app/static/js/utils/api.js << 'EOF'
/**
 * API utility functions
 */

/**
 * Fetch API wrapper with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Get data from API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - Response data
 */
export function getData(endpoint) {
  return fetchApi(endpoint);
}

/**
 * Post data to API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @returns {Promise<any>} - Response data
 */
export function postData(endpoint, data) {
  return fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update data via API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @returns {Promise<any>} - Response data
 */
export function updateData(endpoint, data) {
  return fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete data via API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - Response data
 */
export function deleteData(endpoint) {
  return fetchApi(endpoint, {
    method: 'DELETE',
  });
}
EOF

cat > app/static/js/utils/date.js << 'EOF'
/**
 * Date utility functions
 */

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export function formatDate(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Format time to locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time
 */
export function formatTime(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} - Relative time
 */
export function getRelativeTime(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay < 30) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  }
  
  // For older dates, return formatted date
  return formatDate(dateObj);
}
EOF

# Step 5: Establish API router organization
echo "Step 5: Establishing API router organization..."
mkdir -p app/api/routers

# Create main API router file
cat > app/api/router.py << 'EOF'
from fastapi import APIRouter
from app.api.routers import orders, residents, tables, auth, admin

# Main API router
api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(residents.router, prefix="/residents", tags=["residents"])
api_router.include_router(tables.router, prefix="/tables", tags=["tables"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
EOF

# Create router files
for router in orders residents tables auth admin; do
    mkdir -p app/api/routers
    cat > app/api/routers/${router}.py << EOF
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db

router = APIRouter()

# ${router^} routes will be implemented here
EOF
done

# Update main.py to use the new router
echo "Updating main.py to use the new router..."
cat > main.py.new << 'EOF'
import os
import logging
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from app.api.router import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Plate Order System",
    description="Restaurant voice ordering platform",
    version="1.0.0",
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates configuration
templates = Jinja2Templates(directory="app/templates")

# Include API router
app.include_router(api_router, prefix="/api")

# API key from environment variable
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set in environment variables")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Home page route
@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Server view route
@app.get("/server")
async def server_view(request: Request):
    return templates.TemplateResponse("server-view.html", {"request": request})

# Kitchen view route
@app.get("/kitchen")
async def kitchen_view(request: Request):
    return templates.TemplateResponse("kitchen-view.html", {"request": request})

# Admin view route
@app.get("/admin")
async def admin_view(request: Request):
    return templates.TemplateResponse("admin-view.html", {"request": request})

# Main entry point
if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Log startup info
    logger.info(f"Starting server on port {port} in {os.environ.get('ENVIRONMENT', 'development')} mode")
    
    # Run the app
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
EOF

# Replace main.py with the new version
mv main.py.new main.py

# Create basic template files
echo "Creating basic template files..."
mkdir -p app/templates

# Create server view template
cat > app/templates/server-view.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server View - Plate Order System</title>
    <link rel="stylesheet" href="/static/css/build/styles.css">
</head>
<body class="bg-secondary-100">
    <div class="max-w-[1024px] mx-auto bg-white min-h-screen shadow-lg">
        <header class="bg-primary-600 text-white p-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Plate Order System</h1>
            <div class="flex items-center space-x-4">
                <button class="btn btn-secondary">
                    <span>Server View</span>
                </button>
            </div>
        </header>
        
        <main class="p-4">
            <h2 class="text-2xl font-bold mb-4">Server View</h2>
            <p>Server view content will be implemented here.</p>
        </main>
    </div>
    
    <script src="/static/js/components/index.js" type="module"></script>
</body>
</html>
EOF

# Create kitchen view template
cat > app/templates/kitchen-view.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen View - Plate Order System</title>
    <link rel="stylesheet" href="/static/css/build/styles.css">
</head>
<body class="bg-secondary-100">
    <div class="max-w-[1024px] mx-auto bg-white min-h-screen shadow-lg">
        <header class="bg-primary-600 text-white p-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Plate Order System</h1>
            <div class="flex items-center space-x-4">
                <button class="btn btn-secondary">
                    <span>Kitchen View</span>
                </button>
            </div>
        </header>
        
        <main class="p-4">
            <h2 class="text-2xl font-bold mb-4">Kitchen View</h2>
            <p>Kitchen view content will be implemented here.</p>
        </main>
    </div>
    
    <script src="/static/js/components/index.js" type="module"></script>
</body>
</html>
EOF

# Create admin view template
cat > app/templates/admin-view.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin View - Plate Order System</title>
    <link rel="stylesheet" href="/static/css/build/styles.css">
</head>
<body class="bg-secondary-100">
    <div class="w-full mx-auto bg-white min-h-screen">
        <header class="bg-primary-600 text-white p-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Plate Order System</h1>
            <div class="flex items-center space-x-4">
                <button class="btn btn-secondary">
                    <span>Admin View</span>
                </button>
            </div>
        </header>
        
        <main class="p-4">
            <h2 class="text-2xl font-bold mb-4">Admin View</h2>
            <p>Admin view content will be implemented here.</p>
        </main>
    </div>
    
    <script src="/static/js/components/index.js" type="module"></script>
</body>
</html>
EOF

# Build Tailwind CSS
echo "Building Tailwind CSS..."
npx tailwindcss -i ./app/static/css/tailwind.css -o ./app/static/css/build/styles.css

echo "==============================================================="
echo "Module 1 implementation complete!"
echo "Project structure and foundation have been set up."
echo "You can now run the application with: python main.py"
echo "==============================================================="