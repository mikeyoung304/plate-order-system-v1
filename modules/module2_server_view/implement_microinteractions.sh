#!/bin/bash

# Task: Implement Microinteractions
# This script adds microinteractions to the server view

echo "Starting task: Implement Microinteractions"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
CSS_DIR="$PROJECT_ROOT/app/static/css"
JS_DIR="$PROJECT_ROOT/app/static/js"
SERVER_VIEW_CSS="$CSS_DIR/server-view.css"
SERVER_VIEW_JS="$JS_DIR/server-view.js"
COMPONENTS_DIR="$JS_DIR/components"
FLOOR_PLAN_DIR="$COMPONENTS_DIR/floor-plan"
VOICE_DIR="$COMPONENTS_DIR/voice"
FLOOR_PLAN_JS="$FLOOR_PLAN_DIR/FloorPlan.js"
VOICE_RECORDER_JS="$VOICE_DIR/VoiceRecorder.js"

# Check if server-view.css exists
if [ ! -f "$SERVER_VIEW_CSS" ]; then
    echo "Error: server-view.css not found. Please run create_server_view_css.sh first."
    exit 1
fi

# Check if server-view.js exists
if [ ! -f "$SERVER_VIEW_JS" ]; then
    echo "Error: server-view.js not found. Please run implement_server_view_js.sh first."
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

# Add microinteractions to CSS
echo "Adding microinteractions to server-view.css..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Copy the existing CSS file to the temporary file
cp "$SERVER_VIEW_CSS" "$TMP_FILE"

# Add microinteractions CSS
cat >> "$TMP_FILE" << 'EOF'

/* Microinteractions */

/* Button hover and active states */
.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn:active {
  transform: translateY(0);
}

/* Table hover and selection animations */
.table {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table:hover {
  transform: scale(1.05);
  z-index: 10;
}

.table.selected {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

/* Voice recorder animations */
.recording-pulse {
  animation: recording-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes recording-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

/* Modal animations */
#voice-recorder-modal {
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

#voice-recorder-modal.fade-in {
  animation: fadeIn 0.3s ease forwards;
}

#voice-recorder-modal.fade-out {
  animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Order item animations */
.order-item {
  transition: background-color 0.2s ease;
}

.order-item:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

.order-item-new {
  animation: highlightNew 2s ease-out;
}

@keyframes highlightNew {
  0% {
    background-color: rgba(59, 130, 246, 0.2);
  }
  100% {
    background-color: transparent;
  }
}

/* Notification animations */
.notification {
  transform: translateY(100px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.notification.show {
  transform: translateY(0);
  opacity: 1;
}

/* Loading indicator */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Touch feedback for mobile */
@media (pointer: coarse) {
  .btn:active, .table:active {
    transform: scale(0.95);
  }
}

/* Ripple effect */
.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Table flash effect */
.table-flash {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(59, 130, 246, 0.3);
  border-radius: inherit;
  animation: flash 0.5s ease-out;
  pointer-events: none;
}

@keyframes flash {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
EOF

# Replace the original CSS file with the temporary file
mv "$TMP_FILE" "$SERVER_VIEW_CSS"

echo "Microinteractions added to server-view.css."

# Add microinteractions to FloorPlan.js
echo "Adding microinteractions to FloorPlan.js..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Copy the existing file to the temporary file
cp "$FLOOR_PLAN_JS" "$TMP_FILE"

# Update the selectTable method to add animation
sed -i '' '/selectTable(tableId)/,/^  }/c\
  /**\
   * Select a table\
   * @param {number|null} tableId - ID of table to select, or null to deselect\
   */\
  selectTable(tableId) {\
    this.selectedTable = tableId;\
    \
    // Update UI to reflect selection\
    const tableElements = this.container.querySelectorAll("[data-table-id]");\
    tableElements.forEach(el => {\
      const id = parseInt(el.dataset.tableId);\
      if (id === tableId) {\
        el.classList.add("ring-4", "ring-primary-500");\
        \
        // Add selection animation\
        const flash = document.createElement("div");\
        flash.className = "table-flash";\
        el.appendChild(flash);\
        \
        // Remove flash after animation\
        setTimeout(() => {\
          flash.remove();\
        }, 500);\
      } else {\
        el.classList.remove("ring-4", "ring-primary-500");\
      }\
    });\
    \
    // Find the selected table data\
    const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;\
    \
    // Call the onTableSelect callback if defined\
    if (typeof this.onTableSelect === "function") {\
      this.onTableSelect(selectedTableData);\
    }\
  }\
' "$TMP_FILE"

# Update the createTableElement method to add ripple effect
sed -i '' '/createTableElement(table)/,/^  }/c\
  /**\
   * Create a table DOM element\
   * @param {Object} table - Table data\
   * @returns {HTMLElement} - Table element\
   */\
  createTableElement(table) {\
    const { id, number, type, x, y, status } = table;\
    const { width, height, capacity, isRound } = this.options.tableTypes[type] || this.options.tableTypes["square-4"];\
    \
    // Create table element\
    const tableEl = document.createElement("div");\
    tableEl.className = `table absolute flex items-center justify-center font-bold text-lg \
                         ${status === "occupied" ? "bg-danger/20 border-danger" : "bg-success/10 border-success"} \
                         ${isRound ? "rounded-full" : "rounded-md"}\
                         ${this.selectedTable === id ? "ring-4 ring-primary-500" : ""}\
                         border-2 cursor-pointer hover:bg-secondary-200/50 transition-colors`;\
    tableEl.style.width = `${width}px`;\
    tableEl.style.height = `${height}px`;\
    tableEl.style.left = `${x}px`;\
    tableEl.style.top = `${y}px`;\
    tableEl.dataset.tableId = id;\
    tableEl.dataset.tableNumber = number;\
    tableEl.dataset.tableStatus = status;\
    tableEl.textContent = number;\
    \
    // Add click handler for table selection\
    tableEl.addEventListener("click", (e) => {\
      e.stopPropagation();\
      \
      // Add ripple effect\
      const rect = tableEl.getBoundingClientRect();\
      const ripple = document.createElement("div");\
      ripple.className = "ripple";\
      tableEl.appendChild(ripple);\
      \
      // Position the ripple\
      const size = Math.max(rect.width, rect.height);\
      ripple.style.width = ripple.style.height = `${size}px`;\
      ripple.style.left = `${0}px`;\
      ripple.style.top = `${0}px`;\
      \
      // Remove the ripple after animation\
      setTimeout(() => {\
        ripple.remove();\
      }, 600);\
      \
      this.selectTable(id);\
    });\
    \
    return tableEl;\
  }\
' "$TMP_FILE"

# Replace the original file with the temporary file
mv "$TMP_FILE" "$FLOOR_PLAN_JS"

echo "Microinteractions added to FloorPlan.js."

# Add microinteractions to VoiceRecorder.js
echo "Adding microinteractions to VoiceRecorder.js..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Copy the existing file to the temporary file
cp "$VOICE_RECORDER_JS" "$TMP_FILE"

# Update the startRecording method to add animation
sed -i '' '/startRecording()/,/^  }/c\
  /**\
   * Start recording\
   */\
  async startRecording() {\
    if (this.isRecording || this.recordButton.disabled) return;\
    \
    try {\
      // Request microphone access\
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });\
      \
      // Create media recorder\
      this.mediaRecorder = new MediaRecorder(this.stream);\
      \
      // Set up event handlers\
      this.mediaRecorder.ondataavailable = (e) => {\
        if (e.data.size > 0) {\
          this.audioChunks.push(e.data);\
        }\
      };\
      \
      // Clear previous chunks\
      this.audioChunks = [];\
      \
      // Start recording\
      this.mediaRecorder.start();\
      this.isRecording = true;\
      \
      // Update UI with animation\
      this.recordButton.classList.add("bg-danger", "animate-pulse");\
      this.recordButton.classList.remove("bg-primary-600", "hover:bg-primary-700");\
      this.statusElement.textContent = "Recording... (release to stop)";\
      \
      // Add pulse animation to button\
      this.recordButton.style.animation = "pulse 1.5s infinite";\
      \
      // Set maximum recording time\
      this.recordingTimer = setTimeout(() => {\
        if (this.isRecording) {\
          this.stopRecording();\
        }\
      }, this.options.maxRecordingTime);\
      \
      // Call the onRecordingStart callback if defined\
      if (typeof this.onRecordingStart === "function") {\
        this.onRecordingStart();\
      }\
    } catch (error) {\
      console.error("Error starting recording:", error);\
      this.statusElement.textContent = "Error: Could not access microphone";\
      \
      // Show error animation\
      this.recordButton.classList.add("shake");\
      setTimeout(() => {\
        this.recordButton.classList.remove("shake");\
      }, 500);\
    }\
  }\
' "$TMP_FILE"

# Add shake animation to CSS
cat >> "$SERVER_VIEW_CSS" << 'EOF'

/* Shake animation for errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
EOF

# Replace the original file with the temporary file
mv "$TMP_FILE" "$VOICE_RECORDER_JS"

echo "Microinteractions added to VoiceRecorder.js."

# Add microinteractions to server-view.js
echo "Adding microinteractions to server-view.js..."

# Create a temporary file
TMP_FILE=$(mktemp)

# Copy the existing file to the temporary file
cp "$SERVER_VIEW_JS" "$TMP_FILE"

# Add microinteractions helper functions
cat >> "$TMP_FILE" << 'EOF'

/**
 * Add microinteractions to the UI
 */
function addMicrointeractions() {
  addButtonFeedback();
  addModalTransitions();
  addOrderItemAnimations();
}

/**
 * Add tactile feedback to buttons
 */
function addButtonFeedback() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = '';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });
}

/**
 * Add transitions to modals
 */
function addModalTransitions() {
  const modals = document.querySelectorAll('.modal, #voice-recorder-modal');
  modals.forEach(modal => {
    // Add fade-in class when showing
    const originalClassListRemove = modal.classList.remove;
    modal.classList.remove = function(className) {
      if (className === 'hidden') {
        this.classList.add('fade-in');
      }
      return originalClassListRemove.apply(this, arguments);
    };
    
    // Add fade-out class when hiding
    const originalClassListAdd = modal.classList.add;
    modal.classList.add = function(className) {
      if (className === 'hidden') {
        this.classList.add('fade-out');
        setTimeout(() => {
          this.classList.remove('fade-out');
          originalClassListAdd.call(this, className);
        }, 300);
        return this;
      }
      return originalClassListAdd.apply(this, arguments);
    };
  });
}

/**
 * Add animations to order items
 */
function addOrderItemAnimations() {
  // This will be called when new order items are added
  window.animateNewOrderItems = () => {
    const items = document.querySelectorAll('.order-item:not(.animated)');
    items.forEach((item, index) => {
      item.classList.add('animated');
      item.style.animationDelay = `${index * 0.1}s`;
      item.classList.add('order-item-new');
      
      // Remove animation class after it completes
      setTimeout(() => {
        item.classList.remove('order-item-new');
      }, 2000 + (index * 100));
    });
  };
}

// Initialize microinteractions
document.addEventListener('DOMContentLoaded', () => {
  addMicrointeractions();
});
EOF

# Replace the original file with the temporary file
mv "$TMP_FILE" "$SERVER_VIEW_JS"

echo "Microinteractions added to server-view.js."

echo "Task completed: Implement Microinteractions"
exit 0