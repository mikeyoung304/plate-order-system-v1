#!/bin/bash

# Task: Setup Tailwind CSS
# This script sets up Tailwind CSS with a custom configuration

echo "Starting task: Setup Tailwind CSS"
echo "================================"

# Create necessary directories
echo "Creating necessary directories..."
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

# Update package.json with Tailwind build scripts
echo "Updating package.json with Tailwind build scripts..."
# Check if package.json exists
if [ -f "package.json" ]; then
    # Use temporary file for manipulation
    cat package.json | jq '.scripts += {"build:css": "tailwindcss -i ./app/static/css/tailwind.css -o ./app/static/css/build/styles.css", "watch:css": "tailwindcss -i ./app/static/css/tailwind.css -o ./app/static/css/build/styles.css --watch"}' > package.json.tmp
    mv package.json.tmp package.json
    echo "Updated package.json with Tailwind build scripts"
else
    # Create new package.json if it doesn't exist
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
    echo "Created new package.json with Tailwind build scripts"
fi

# Verify the setup
echo "Verifying Tailwind CSS setup..."
if [ -f "tailwind.config.js" ] && [ -f "postcss.config.js" ] && [ -f "app/static/css/tailwind.css" ]; then
    echo "Tailwind CSS setup verified successfully"
else
    echo "Error: Tailwind CSS setup verification failed"
    exit 1
fi

echo "Task completed: Setup Tailwind CSS"
exit 0