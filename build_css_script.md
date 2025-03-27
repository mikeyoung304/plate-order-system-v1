# Build CSS Script

This document contains the script content for `modules/module1_foundation/build_css.sh`, which will be used to build and optimize the CSS for the Plate Order System.

## Script Content

```bash
#!/bin/bash

# Task: Build CSS
# This script builds and optimizes Tailwind CSS for the application

echo "Starting task: Build CSS"
echo "======================="

# Check if Node.js and npm are installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Set up variables
PROJECT_ROOT="$(pwd)"
CSS_INPUT_DIR="$PROJECT_ROOT/app/static/css"
CSS_OUTPUT_DIR="$PROJECT_ROOT/app/static/css"
TAILWIND_INPUT="$CSS_INPUT_DIR/tailwind.src.css"
TAILWIND_OUTPUT="$CSS_OUTPUT_DIR/tailwind.css"
CUSTOM_CSS_INPUT="$CSS_INPUT_DIR/style.src.css"
CUSTOM_CSS_OUTPUT="$CSS_OUTPUT_DIR/style.css"

# Create PostCSS config if it doesn't exist
if [ ! -f "$PROJECT_ROOT/postcss.config.js" ]; then
    echo "Creating PostCSS configuration..."
    cat > "$PROJECT_ROOT/postcss.config.js" << 'EOF'
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production'
      ? [require('cssnano')({ preset: 'default' })]
      : [])
  ],
};
EOF
    echo "PostCSS configuration created."
fi

# Create Tailwind config if it doesn't exist
if [ ! -f "$PROJECT_ROOT/tailwind.config.js" ]; then
    echo "Creating Tailwind CSS configuration..."
    cat > "$PROJECT_ROOT/tailwind.config.js" << 'EOF'
module.exports = {
  content: [
    './app/templates/**/*.html',
    './app/static/js/**/*.js',
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
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
EOF
    echo "Tailwind CSS configuration created."
fi

# Create source CSS files if they don't exist
if [ ! -f "$TAILWIND_INPUT" ]; then
    echo "Creating Tailwind CSS source file..."
    mkdir -p "$CSS_INPUT_DIR"
    cat > "$TAILWIND_INPUT" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50;
  }
  
  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply btn bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
}
EOF
    echo "Tailwind CSS source file created."
fi

if [ ! -f "$CUSTOM_CSS_INPUT" ]; then
    echo "Creating custom CSS source file..."
    mkdir -p "$CSS_INPUT_DIR"
    cat > "$CUSTOM_CSS_INPUT" << 'EOF'
/* Custom styles for Plate Order System */

/* Global styles */
html, body {
  height: 100%;
}

/* Layout styles */
.container {
  max-width: 1280px;
  margin: 0 auto;
}

/* Server view specific styles */
.server-view {
  max-width: 1024px;
  margin: 0 auto;
}

/* Kitchen view specific styles */
.kitchen-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Order card styles */
.order-card {
  border-left: 4px solid transparent;
}

.order-card.new {
  border-left-color: #3b82f6; /* blue-500 */
}

.order-card.in-progress {
  border-left-color: #f59e0b; /* amber-500 */
}

.order-card.ready {
  border-left-color: #10b981; /* emerald-500 */
}

.order-card.delivered {
  border-left-color: #6b7280; /* gray-500 */
}

/* Floor plan styles */
.floor-plan {
  position: relative;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.table {
  position: absolute;
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.table.occupied {
  background-color: #fee2e2;
  border-color: #ef4444;
}

.table.available {
  background-color: #ecfdf5;
  border-color: #10b981;
}
EOF
    echo "Custom CSS source file created."
fi

# Install required npm packages if not already installed
echo "Checking for required npm packages..."
if [ ! -d "$PROJECT_ROOT/node_modules/tailwindcss" ] || [ ! -d "$PROJECT_ROOT/node_modules/postcss" ] || [ ! -d "$PROJECT_ROOT/node_modules/autoprefixer" ] || [ ! -d "$PROJECT_ROOT/node_modules/cssnano" ]; then
    echo "Installing required npm packages..."
    npm install --save-dev tailwindcss postcss postcss-cli autoprefixer cssnano
    echo "Packages installed."
else
    echo "Required packages already installed."
fi

# Determine environment (development or production)
if [ "$1" == "production" ]; then
    echo "Building CSS for production environment..."
    export NODE_ENV=production
    EXTRA_ARGS="--minify"
else
    echo "Building CSS for development environment..."
    export NODE_ENV=development
    EXTRA_ARGS=""
fi

# Build Tailwind CSS
echo "Building Tailwind CSS..."
npx tailwindcss -i "$TAILWIND_INPUT" -o "$TAILWIND_OUTPUT" $EXTRA_ARGS

# Process custom CSS with PostCSS
echo "Processing custom CSS..."
npx postcss "$CUSTOM_CSS_INPUT" -o "$CUSTOM_CSS_OUTPUT"

# Check if the build was successful
if [ -f "$TAILWIND_OUTPUT" ] && [ -f "$CUSTOM_CSS_OUTPUT" ]; then
    echo "CSS build completed successfully!"
    
    # Get file sizes
    TAILWIND_SIZE=$(du -h "$TAILWIND_OUTPUT" | cut -f1)
    CUSTOM_SIZE=$(du -h "$CUSTOM_CSS_OUTPUT" | cut -f1)
    
    echo "Tailwind CSS size: $TAILWIND_SIZE"
    echo "Custom CSS size: $CUSTOM_SIZE"
else
    echo "Error: CSS build failed."
    exit 1
fi

echo "Task completed: Build CSS"
exit 0
```

## Usage

To use this script:

1. Save the content above to `modules/module1_foundation/build_css.sh`
2. Make the script executable:
   ```bash
   chmod +x modules/module1_foundation/build_css.sh
   ```
3. Run the script:
   ```bash
   ./modules/module1_foundation/build_css.sh
   ```
4. For production builds with minification:
   ```bash
   ./modules/module1_foundation/build_css.sh production
   ```

## Notes

- This script creates the necessary configuration files if they don't exist
- It installs required npm packages (tailwindcss, postcss, autoprefixer, cssnano)
- It creates source CSS files with initial content if they don't exist
- It supports both development and production builds
- For production builds, CSS is minified and optimized