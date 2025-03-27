#!/bin/bash

# Module 2 Implementation Script for Plate Order System
# This script implements the Server View UI/UX for iPad

echo "Starting Module 2 Implementation: Server View UI/UX for iPad"
echo "==============================================================="

# Step 1: Create responsive layout with 1024px fixed width
echo "Step 1: Creating responsive layout with 1024px fixed width..."

# Update server-view.html template
echo "Updating server-view.html template..."
cat > app/templates/server-view.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server View - Plate Order System</title>
    <link rel="stylesheet" href="/static/css/build/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-secondary-100">
    <div class="max-w-[1024px] mx-auto bg-white min-h-screen shadow-lg flex flex-col">
        <!-- Header -->
        <header class="bg-primary-600 text-white p-4 flex justify-between items-center">
            <div class="flex items-center">
                <h1 class="text-xl font-bold">Plate</h1>
            </div>
            <div class="flex items-center space-x-4">
                <button class="btn btn-sm bg-white/10 hover:bg-white/20 text-white">
                    <i class="fas fa-bell mr-2"></i>
                    <span>Notifications</span>
                </button>
                <div class="flex items-center space-x-2">
                    <span class="text-sm">John Doe</span>
                    <div class="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-sm font-medium">
                        JD
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Role Switcher -->
        <div class="bg-primary-700 text-white flex">
            <button class="px-6 py-3 bg-primary-800 font-medium">Server</button>
            <button class="px-6 py-3 hover:bg-primary-800/50 transition-colors">Kitchen</button>
            <button class="px-6 py-3 hover:bg-primary-800/50 transition-colors">Admin</button>
        </div>
        
        <!-- Main Content -->
        <main class="flex flex-1 overflow-hidden">
            <!-- Floor Plan Section -->
            <div class="w-2/3 p-4 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Floor Plan</h2>
                    <div class="flex space-x-2">
                        <button class="btn btn-sm btn-secondary">
                            <i class="fas fa-sync-alt mr-1"></i>
                            <span>Refresh</span>
                        </button>
                        <button class="btn btn-sm btn-primary">
                            <i class="fas fa-utensils mr-1"></i>
                            <span>Dine In</span>
                        </button>
                    </div>
                </div>
                
                <!-- Floor Plan Container -->
                <div id="floor-plan-container" class="flex-1 bg-secondary-50 rounded-lg border border-secondary-200 relative overflow-hidden">
                    <!-- Tables will be dynamically added here by JavaScript -->
                </div>
            </div>
            
            <!-- Order Panel -->
            <div class="w-1/3 border-l border-secondary-200 flex flex-col">
                <!-- Order Details -->
                <div class="p-4 border-b border-secondary-200">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="text-lg font-bold" id="selected-table">No Table Selected</h3>
                            <div class="text-sm text-secondary-500" id="table-status"></div>
                        </div>
                        <button class="btn btn-sm btn-secondary" id="edit-order-btn" disabled>
                            <i class="fas fa-edit mr-1"></i>
                            <span>Edit</span>
                        </button>
                    </div>
                    
                    <!-- Order Items -->
                    <div id="order-items" class="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                        <!-- Order items will be dynamically added here -->
                        <div class="text-secondary-500 text-sm italic">No items in this order</div>
                    </div>
                    
                    <!-- Order Total -->
                    <div class="flex justify-between items-center font-bold">
                        <span>Total</span>
                        <span id="order-total">$0.00</span>
                    </div>
                </div>
                
                <!-- Voice Recording Interface -->
                <div class="p-4 flex-1 flex flex-col justify-center items-center bg-secondary-50">
                    <button id="record-button" class="w-32 h-32 rounded-full bg-primary-600 text-white flex flex-col items-center justify-center mb-4 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        <i class="fas fa-microphone text-3xl mb-2"></i>
                        <span class="text-sm">Hold to Record</span>
                    </button>
                    <div id="record-status" class="text-center text-secondary-600">
                        Select a table to start recording
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- Modal for Order Confirmation -->
    <div id="order-confirmation-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center hidden">
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 class="text-xl font-bold mb-4">Confirm Order</h3>
            <div id="confirmation-content" class="mb-4">
                <!-- Confirmation content will be added here -->
            </div>
            <div class="flex justify-end space-x-2">
                <button id="cancel-order-btn" class="btn btn-secondary">Cancel</button>
                <button id="confirm-order-btn" class="btn btn-primary">Confirm Order</button>
            </div>
        </div>
    </div>
    
    <script src="/static/js/components/floor-plan/FloorPlan.js" type="module"></script>
    <script src="/static/js/components/voice/VoiceRecorder.js" type="module"></script>
    <script src="/static/js/server-view.js" type="module"></script>
</body>
</html>
EOF

# Step 2: Implement floor plan visualization with table management
echo "Step 2: Implementing floor plan visualization with table management..."

# Create floor plan component
mkdir -p app/static/js/components/floor-plan
cat > app/static/js/components/floor-plan/FloorPlan.js << 'EOF'
/**
 * Floor Plan Component
 * Handles the visualization and interaction with restaurant tables
 */

export class FloorPlan {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    this.options = {
      tableTypes: {
        'square-2': { width: 80, height: 80, capacity: 2 },
        'square-4': { width: 100, height: 100, capacity: 4 },
        'rectangle-4': { width: 120, height: 80, capacity: 4 },
        'rectangle-6': { width: 160, height: 80, capacity: 6 },
        'round-2': { width: 80, height: 80, capacity: 2, isRound: true },
        'round-4': { width: 100, height: 100, capacity: 4, isRound: true },
        'round-6': { width: 120, height: 120, capacity: 6, isRound: true },
        'round-8': { width: 140, height: 140, capacity: 8, isRound: true },
      },
      ...options
    };
    
    this.tables = [];
    this.selectedTable = null;
    this.onTableSelect = null;
    
    this.init();
  }
  
  /**
   * Initialize the floor plan
   */
  init() {
    // Set container styles
    this.container.style.position = 'relative';
    
    // Fetch tables from API
    this.fetchTables();
    
    // Add event listener for container clicks (deselection)
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.selectTable(null);
      }
    });
  }
  
  /**
   * Fetch tables from API
   */
  async fetchTables() {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockTables = [
        { id: 1, number: 1, type: 'square-4', x: 50, y: 50, status: 'available' },
        { id: 2, number: 2, type: 'square-4', x: 200, y: 50, status: 'available' },
        { id: 3, number: 3, type: 'square-4', x: 350, y: 50, status: 'available' },
        { id: 4, number: 4, type: 'rectangle-6', x: 50, y: 200, status: 'available' },
        { id: 5, number: 5, type: 'rectangle-6', x: 250, y: 200, status: 'occupied' },
        { id: 6, number: 6, type: 'round-4', x: 500, y: 50, status: 'available' },
        { id: 7, number: 7, type: 'round-4', x: 500, y: 200, status: 'occupied' },
        { id: 8, number: 8, type: 'round-6', x: 200, y: 350, status: 'occupied' },
      ];
      
      this.tables = mockTables;
      this.renderTables();
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  }
  
  /**
   * Render tables on the floor plan
   */
  renderTables() {
    // Clear existing tables
    this.container.innerHTML = '';
    
    // Create and add each table
    this.tables.forEach(table => {
      const tableEl = this.createTableElement(table);
      this.container.appendChild(tableEl);
    });
  }
  
  /**
   * Create a table DOM element
   * @param {Object} table - Table data
   * @returns {HTMLElement} - Table element
   */
  createTableElement(table) {
    const { id, number, type, x, y, status } = table;
    const { width, height, capacity, isRound } = this.options.tableTypes[type] || this.options.tableTypes['square-4'];
    
    // Create table element
    const tableEl = document.createElement('div');
    tableEl.className = `absolute flex items-center justify-center font-bold text-lg 
                         ${status === 'occupied' ? 'bg-danger/20 border-danger' : 'bg-success/10 border-success'} 
                         ${isRound ? 'rounded-full' : 'rounded-md'}
                         ${this.selectedTable === id ? 'ring-4 ring-primary-500' : ''}
                         border-2 cursor-pointer hover:bg-secondary-200/50 transition-colors`;
    tableEl.style.width = `${width}px`;
    tableEl.style.height = `${height}px`;
    tableEl.style.left = `${x}px`;
    tableEl.style.top = `${y}px`;
    tableEl.dataset.tableId = id;
    tableEl.dataset.tableNumber = number;
    tableEl.dataset.tableStatus = status;
    tableEl.textContent = number;
    
    // Add click event
    tableEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectTable(id);
    });
    
    return tableEl;
  }
  
  /**
   * Select a table
   * @param {number|null} tableId - ID of table to select, or null to deselect
   */
  selectTable(tableId) {
    this.selectedTable = tableId;
    
    // Update UI to reflect selection
    const tableElements = this.container.querySelectorAll('[data-table-id]');
    tableElements.forEach(el => {
      const id = parseInt(el.dataset.tableId);
      if (id === tableId) {
        el.classList.add('ring-4', 'ring-primary-500');
      } else {
        el.classList.remove('ring-4', 'ring-primary-500');
      }
    });
    
    // Find the selected table data
    const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;
    
    // Call the onTableSelect callback if defined
    if (typeof this.onTableSelect === 'function') {
      this.onTableSelect(selectedTableData);
    }
  }
  
  /**
   * Set callback for table selection
   * @param {Function} callback - Function to call when a table is selected
   */
  setOnTableSelect(callback) {
    this.onTableSelect = callback;
  }
  
  /**
   * Update table status
   * @param {number} tableId - ID of table to update
   * @param {string} status - New status ('available' or 'occupied')
   */
  updateTableStatus(tableId, status) {
    // Find the table
    const tableIndex = this.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    // Update status
    this.tables[tableIndex].status = status;
    
    // Re-render tables
    this.renderTables();
    
    // Re-select the table if it was selected
    if (this.selectedTable === tableId) {
      this.selectTable(tableId);
    }
  }
}
EOF

# Step 3: Design voice order recording interface
echo "Step 3: Designing voice order recording interface..."

# Create voice recorder component
mkdir -p app/static/js/components/voice
cat > app/static/js/components/voice/VoiceRecorder.js << 'EOF'
/**
 * Voice Recorder Component
 * Handles recording voice orders using the Web Audio API
 */

export class VoiceRecorder {
  constructor(options = {}) {
    this.options = {
      recordButtonId: 'record-button',
      statusElementId: 'record-status',
      maxRecordingTime: 30000, // 30 seconds
      ...options
    };
    
    this.recordButton = document.getElementById(this.options.recordButtonId);
    this.statusElement = document.getElementById(this.options.statusElementId);
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.stream = null;
    
    this.onRecordingComplete = null;
    this.onRecordingStart = null;
    this.onRecordingCancel = null;
    
    if (this.recordButton && this.statusElement) {
      this.init();
    } else {
      console.error('Voice recorder elements not found');
    }
  }
  
  /**
   * Initialize the voice recorder
   */
  init() {
    // Add event listeners for record button
    this.recordButton.addEventListener('mousedown', () => this.startRecording());
    this.recordButton.addEventListener('touchstart', () => this.startRecording());
    this.recordButton.addEventListener('mouseup', () => this.stopRecording());
    this.recordButton.addEventListener('touchend', () => this.stopRecording());
    this.recordButton.addEventListener('mouseleave', () => {
      if (this.isRecording) {
        this.cancelRecording();
      }
    });
  }
  
  /**
   * Enable the recorder
   */
  enable() {
    this.recordButton.disabled = false;
    this.statusElement.textContent = 'Ready to record';
  }
  
  /**
   * Disable the recorder
   */
  disable() {
    this.recordButton.disabled = true;
    this.statusElement.textContent = 'Select a table to start recording';
    if (this.isRecording) {
      this.cancelRecording();
    }
  }
  
  /**
   * Start recording
   */
  async startRecording() {
    if (this.isRecording || this.recordButton.disabled) return;
    
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      // Clear previous chunks
      this.audioChunks = [];
      
      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Update UI
      this.recordButton.classList.add('bg-danger', 'animate-pulse');
      this.recordButton.classList.remove('bg-primary-600', 'hover:bg-primary-700');
      this.statusElement.textContent = 'Recording... (release to stop)';
      
      // Set maximum recording time
      this.recordingTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.options.maxRecordingTime);
      
      // Call the onRecordingStart callback if defined
      if (typeof this.onRecordingStart === 'function') {
        this.onRecordingStart();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      this.statusElement.textContent = 'Error: Could not access microphone';
    }
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording) return;
    
    // Stop the media recorder
    this.mediaRecorder.stop();
    
    // Stop all tracks in the stream
    this.stream.getTracks().forEach(track => track.stop());
    
    // Clear the recording timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-danger', 'animate-pulse');
    this.recordButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
    this.statusElement.textContent = 'Processing recording...';
    
    // Process the recording after a short delay to ensure all data is available
    setTimeout(() => {
      this.processRecording();
    }, 500);
  }
  
  /**
   * Cancel recording
   */
  cancelRecording() {
    if (!this.isRecording) return;
    
    // Stop the media recorder
    this.mediaRecorder.stop();
    
    // Stop all tracks in the stream
    this.stream.getTracks().forEach(track => track.stop());
    
    // Clear the recording timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-danger', 'animate-pulse');
    this.recordButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
    this.statusElement.textContent = 'Recording cancelled';
    
    // Call the onRecordingCancel callback if defined
    if (typeof this.onRecordingCancel === 'function') {
      this.onRecordingCancel();
    }
  }
  
  /**
   * Process the recording
   */
  processRecording() {
    if (this.audioChunks.length === 0) {
      this.statusElement.textContent = 'No audio recorded';
      return;
    }
    
    // Create a blob from the audio chunks
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1]; // Remove the data URL prefix
      
      // Call the onRecordingComplete callback if defined
      if (typeof this.onRecordingComplete === 'function') {
        this.onRecordingComplete(base64Audio);
      }
      
      this.statusElement.textContent = 'Recording complete';
    };
  }
  
  /**
   * Set callback for recording completion
   * @param {Function} callback - Function to call when recording is complete
   */
  setOnRecordingComplete(callback) {
    this.onRecordingComplete = callback;
  }
  
  /**
   * Set callback for recording start
   * @param {Function} callback - Function to call when recording starts
   */
  setOnRecordingStart(callback) {
    this.onRecordingStart = callback;
  }
  
  /**
   * Set callback for recording cancellation
   * @param {Function} callback - Function to call when recording is cancelled
   */
  setOnRecordingCancel(callback) {
    this.onRecordingCancel = callback;
  }
}
EOF

# Step 4: Create main server view JavaScript file
echo "Step 4: Creating main server view JavaScript file..."

cat > app/static/js/server-view.js << 'EOF'
/**
 * Server View
 * Main JavaScript file for the server view
 */

import { FloorPlan } from './components/floor-plan/FloorPlan.js';
import { VoiceRecorder } from './components/voice/VoiceRecorder.js';
import { postData } from './utils/api.js';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize floor plan
  const floorPlan = new FloorPlan('floor-plan-container');
  
  // Initialize voice recorder
  const voiceRecorder = new VoiceRecorder();
  
  // Get UI elements
  const selectedTableElement = document.getElementById('selected-table');
  const tableStatusElement = document.getElementById('table-status');
  const orderItemsElement = document.getElementById('order-items');
  const orderTotalElement = document.getElementById('order-total');
  const editOrderButton = document.getElementById('edit-order-btn');
  const confirmationModal = document.getElementById('order-confirmation-modal');
  const confirmationContent = document.getElementById('confirmation-content');
  const cancelOrderButton = document.getElementById('cancel-order-btn');
  const confirmOrderButton = document.getElementById('confirm-order-btn');
  
  // Current order data
  let currentOrder = null;
  
  // Handle table selection
  floorPlan.setOnTableSelect((table) => {
    if (table) {
      // Update UI with selected table info
      selectedTableElement.textContent = `Table ${table.number}`;
      tableStatusElement.textContent = table.status === 'occupied' ? 'Has active order' : 'Available';
      tableStatusElement.className = table.status === 'occupied' ? 'text-sm text-danger' : 'text-sm text-success';
      
      // Enable/disable voice recorder based on table status
      if (table.status === 'occupied') {
        // If table is occupied, we might want to fetch the current order
        fetchTableOrder(table.id);
        editOrderButton.disabled = false;
        voiceRecorder.disable();
      } else {
        // Clear order items if table is available
        orderItemsElement.innerHTML = '<div class="text-secondary-500 text-sm italic">No items in this order</div>';
        orderTotalElement.textContent = '$0.00';
        editOrderButton.disabled = true;
        voiceRecorder.enable();
      }
    } else {
      // No table selected
      selectedTableElement.textContent = 'No Table Selected';
      tableStatusElement.textContent = '';
      orderItemsElement.innerHTML = '<div class="text-secondary-500 text-sm italic">No items in this order</div>';
      orderTotalElement.textContent = '$0.00';
      editOrderButton.disabled = true;
      voiceRecorder.disable();
    }
  });
  
  // Handle voice recording completion
  voiceRecorder.setOnRecordingComplete((audioData) => {
    // In a real implementation, this would send the audio to the server for processing
    // For now, we'll simulate a response
    processVoiceOrder(audioData);
  });
  
  // Fetch order for a table
  async function fetchTableOrder(tableId) {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockOrder = {
        id: 123,
        tableId: tableId,
        items: [
          { name: 'Grilled Salmon', price: 24.99, notes: 'No onions, extra sauce' },
          { name: 'Caesar Salad', price: 12.99, notes: 'Dressing on the side' },
          { name: 'Sparkling Water', price: 4.99, notes: 'With lemon' }
        ],
        status: 'in_progress',
        total: 42.97
      };
      
      // Update UI with order details
      displayOrder(mockOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  }
  
  // Display order in the UI
  function displayOrder(order) {
    currentOrder = order;
    
    // Clear existing items
    orderItemsElement.innerHTML = '';
    
    // Add each item
    order.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'border-b border-secondary-100 pb-2';
      itemElement.innerHTML = `
        <div class="flex justify-between">
          <div class="font-medium">${item.name}</div>
          <div>$${item.price.toFixed(2)}</div>
        </div>
        <div class="text-sm text-secondary-600">${item.notes || ''}</div>
      `;
      orderItemsElement.appendChild(itemElement);
    });
    
    // Update total
    orderTotalElement.textContent = `$${order.total.toFixed(2)}`;
  }
  
  // Process voice order
  function processVoiceOrder(audioData) {
    // In a real implementation, this would send the audio to the server
    // For now, we'll simulate a response with a timeout
    setTimeout(() => {
      // Mock processed order
      const processedOrder = {
        transcription: "I'd like a grilled chicken sandwich with fries and a diet coke.",
        items: [
          { name: 'Grilled Chicken Sandwich', price: 14.99, notes: '' },
          { name: 'French Fries', price: 4.99, notes: '' },
          { name: 'Diet Coke', price: 2.99, notes: '' }
        ],
        total: 22.97
      };
      
      // Show confirmation modal
      showOrderConfirmation(processedOrder);
    }, 1500);
  }
  
  // Show order confirmation modal
  function showOrderConfirmation(processedOrder) {
    // Update confirmation content
    confirmationContent.innerHTML = `
      <p class="mb-2"><strong>Transcription:</strong></p>
      <p class="mb-4 text-secondary-600 italic">"${processedOrder.transcription}"</p>
      <p class="mb-2"><strong>Items:</strong></p>
      <ul class="mb-4 space-y-2">
        ${processedOrder.items.map(item => `
          <li class="flex justify-between">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
          </li>
        `).join('')}
      </ul>
      <div class="flex justify-between font-bold">
        <span>Total:</span>
        <span>$${processedOrder.total.toFixed(2)}</span>
      </div>
    `;
    
    // Store the processed order for later use
    currentOrder = {
      tableId: floorPlan.selectedTable,
      items: processedOrder.items,
      total: processedOrder.total,
      transcription: processedOrder.transcription
    };
    
    // Show the modal
    confirmationModal.classList.remove('hidden');
  }
  
  // Handle order confirmation
  confirmOrderButton.addEventListener('click', () => {
    // Hide the modal
    confirmationModal.classList.add('hidden');
    
    // Submit the order
    submitOrder();
  });
  
  // Handle order cancellation
  cancelOrderButton.addEventListener('click', () => {
    // Hide the modal
    confirmationModal.classList.add('hidden');
    
    // Reset the voice recorder status
    voiceRecorder.statusElement.textContent = 'Ready to record';
  });
  
  // Submit the order
  async function submitOrder() {
    try {
      // In a real implementation, this would send to the API
      // For now, we'll just update the UI
      
      // Update the table status
      floorPlan.updateTableStatus(floorPlan.selectedTable, 'occupied');
      
      // Update the order display
      displayOrder({
        ...currentOrder,
        id: Math.floor(Math.random() * 1000),
        status: 'pending'
      });
      
      // Update UI elements
      tableStatusElement.textContent = 'Has active order';
      tableStatusElement.className = 'text-sm text-danger';
      editOrderButton.disabled = false;
      voiceRecorder.disable();
      
      // Show success message
      voiceRecorder.statusElement.textContent = 'Order submitted successfully';
    } catch (error) {
      console.error('Error submitting order:', error);
      voiceRecorder.statusElement.textContent = 'Error submitting order';
    }
  }
  
  // Handle edit order button
  editOrderButton.addEventListener('click', () => {
    // In a real implementation, this would open an edit interface
    alert('Edit order functionality would be implemented here');
  });
});
EOF

# Step 5: Add microinteractions and state transitions
