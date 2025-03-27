#!/bin/bash

# Task: Create Server View CSS
# This script creates the CSS for the server view

echo "Starting task: Create Server View CSS"
echo "==================================="

# Set up variables
PROJECT_ROOT="$(pwd)"
CSS_DIR="$PROJECT_ROOT/app/static/css"
SERVER_VIEW_CSS="$CSS_DIR/server-view.css"

# Create the CSS directory if it doesn't exist
mkdir -p "$CSS_DIR"

# Create the server view CSS
echo "Creating server view CSS..."
cat > "$SERVER_VIEW_CSS" << 'EOF'
/* Server View CSS */

/* Main container */
.server-view {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1rem;
}

/* Floor plan styles */
.floor-plan {
  position: relative;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.3s ease;
}

/* Table styles */
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
  user-select: none;
}

.table:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.table.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.table.available {
  background-color: #ecfdf5;
  border-color: #10b981;
}

.table.occupied {
  background-color: #fee2e2;
  border-color: #ef4444;
}

.table.reserved {
  background-color: #fef3c7;
  border-color: #f59e0b;
}

.table-number {
  font-weight: 600;
  font-size: 1rem;
}

.table-capacity {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Voice recorder styles */
#recording-indicator {
  transition: all 0.3s ease;
}

#recording-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

/* Order item styles */
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.order-item:last-child {
  border-bottom: none;
}

.order-item-name {
  font-weight: 500;
}

.order-item-price {
  font-weight: 600;
}

.order-item-notes {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Responsive styles for iPad */
@media (max-width: 1024px) {
  .server-view {
    padding: 0.5rem;
  }
  
  .grid {
    gap: 0.5rem;
  }
  
  .p-4 {
    padding: 0.75rem;
  }
  
  .h-96 {
    height: 20rem;
  }
}

/* Zoom controls */
.zoom-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  z-index: 20;
}

.zoom-btn {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.zoom-btn:hover {
  background-color: #f3f4f6;
}

.zoom-btn:first-child {
  border-bottom: 1px solid #e5e7eb;
}

/* Microinteractions */
.btn {
  transition: all 0.2s ease;
}

.btn:active {
  transform: scale(0.95);
}

.table.dragging {
  opacity: 0.8;
  cursor: grabbing;
}

/* Voice recorder modal animations */
#voice-recorder-modal {
  transition: opacity 0.3s ease;
}

#voice-recorder-modal.fade-in {
  opacity: 1;
}

#voice-recorder-modal.fade-out {
  opacity: 0;
}

/* Prevent scrolling when modal is open */
body.modal-open {
  overflow: hidden;
}

/* Touch-friendly styles for iPad */
@media (pointer: coarse) {
  .btn, .table, .zoom-btn {
    min-height: 44px; /* Minimum touch target size */
  }
  
  .table {
    min-width: 44px;
  }
}
EOF
echo "Server view CSS created."

echo "Task completed: Create Server View CSS"
exit 0