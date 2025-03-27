#!/bin/bash

# Task: Implement Server View JavaScript
# This script finalizes the server view JavaScript implementation

echo "Starting task: Implement Server View JavaScript"
echo "============================================="

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js"
SERVER_VIEW_JS="$JS_DIR/server-view.js"
COMPONENTS_DIR="$JS_DIR/components"
FLOOR_PLAN_DIR="$COMPONENTS_DIR/floor-plan"
VOICE_DIR="$COMPONENTS_DIR/voice"
FLOOR_PLAN_JS="$FLOOR_PLAN_DIR/FloorPlan.js"
VOICE_RECORDER_JS="$VOICE_DIR/VoiceRecorder.js"

# Check if server-view.js exists
if [ ! -f "$SERVER_VIEW_JS" ]; then
    echo "Error: server-view.js not found. Please run implement_floor_plan_component.sh and implement_voice_recorder_component.sh first."
    exit 1
fi

# Check if component files exist
if [ ! -f "$FLOOR_PLAN_JS" ]; then
    echo "Error: FloorPlan.js not found. Please run implement_floor_plan_component.sh first."
    exit 1
fi

if [ ! -f "$VOICE_RECORDER_JS" ]; then
    echo "Error: VoiceRecorder.js not found. Please run implement_voice_recorder_component.sh first."
    exit 1
fi

# Create utils directory and API utility
echo "Creating API utility..."
mkdir -p "$JS_DIR/utils"
cat > "$JS_DIR/utils/api.js" << 'EOF'
/**
 * API Utilities
 */

/**
 * Fetch data from the API
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - The response data
 */
export async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Post data to the API
 * @param {string} url - The URL to post to
 * @param {Object} data - The data to post
 * @returns {Promise<any>} - The response data
 */
export async function postData(url, data) {
  return fetchData(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Put data to the API
 * @param {string} url - The URL to put to
 * @param {Object} data - The data to put
 * @returns {Promise<any>} - The response data
 */
export async function putData(url, data) {
  return fetchData(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Delete data from the API
 * @param {string} url - The URL to delete from
 * @returns {Promise<any>} - The response data
 */
export async function deleteData(url) {
  return fetchData(url, {
    method: 'DELETE'
  });
}
EOF
echo "API utility created."

# Add additional functionality to server-view.js
echo "Adding additional functionality to server-view.js..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Copy the existing file to the temporary file
cp "$SERVER_VIEW_JS" "$TMP_FILE"

# Update the import section to include the API utility
sed -i '' "s/import { FloorPlan } from '.\/components\/floor-plan\/FloorPlan.js';/import { FloorPlan } from '.\/components\/floor-plan\/FloorPlan.js';\nimport { postData, fetchData } from '.\/utils\/api.js';/" "$TMP_FILE"

# Add utility functions
cat >> "$TMP_FILE" << 'EOF'

// Utility functions

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @returns {string} - The formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Show notification
 * @param {string} message - The message to show
 * @param {string} type - The notification type (success, error, warning, info)
 */
function showNotification(message, type = 'success') {
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Set type class
  notification.className = `notification notification-${type}`;
  
  // Set message
  notification.textContent = message;
  
  // Show notification
  notification.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Parse order items from transcription
 * @param {string} text - The transcription text
 * @returns {Array} - The parsed order items
 */
function parseOrderFromTranscription(text) {
  if (!text) return [];
  
  // This is a simplified implementation
  // In a real app, this would use NLP or a more sophisticated algorithm
  
  // Split by lines or sentences
  const lines = text.split(/[\n\.]+/).filter(line => line.trim().length > 0);
  
  // Extract items
  const items = [];
  
  lines.forEach(line => {
    // Look for quantity patterns like "2 burgers" or "a burger"
    const quantityMatch = line.match(/^(\d+|a|an)\s+(.+)$/i);
    
    if (quantityMatch) {
      const quantity = quantityMatch[1].toLowerCase() === "a" || quantityMatch[1].toLowerCase() === "an" ? 1 : parseInt(quantityMatch[1]);
      const itemName = quantityMatch[2].trim();
      
      // Simple price assignment (in a real app, would look up in a menu database)
      const price = 9.99;
      
      items.push({
        name: itemName,
        quantity: quantity,
        price: price,
        notes: ""
      });
    }
  });
  
  return items;
}
EOF

# Replace the original file with the temporary file
mv "$TMP_FILE" "$SERVER_VIEW_JS"

echo "Additional functionality added to server-view.js."

# Create a main.js file if it doesn't exist
if [ ! -f "$JS_DIR/main.js" ]; then
    echo "Creating main.js..."
    cat > "$JS_DIR/main.js" << 'EOF'
/**
 * Main JavaScript file for the Plate Order System
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && !mobileMenu.classList.contains('hidden') && 
            !mobileMenu.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
    
    // Add notification styles if they don't exist
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 1000;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification-success {
            background-color: #4CAF50;
        }
        
        .notification-error {
            background-color: #F44336;
        }
        
        .notification-warning {
            background-color: #FF9800;
        }
        
        .notification-info {
            background-color: #2196F3;
        }
    `;
    document.head.appendChild(notificationStyles);
});
EOF
    echo "main.js created."
fi

echo "Task completed: Implement Server View JavaScript"
exit 0