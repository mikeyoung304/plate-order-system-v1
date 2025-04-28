/**
 * Server View JavaScript
 * Handles the server view functionality with dynamic seat tracking
 */

class ServerView {
  constructor() {
    // DOM elements
    this.floorPlanContainer = document.getElementById('floor-plan');
    this.selectedTableNumber = document.getElementById('selected-table-number');
    this.tableNotSelectedDiv = document.getElementById('table-not-selected');
    this.tableSelectedDiv = document.getElementById('table-selected');
    this.transcriptionResult = document.getElementById('transcription-result');
    this.transcriptionText = document.getElementById('transcription-text');
    this.submitOrderBtn = document.getElementById('submit-order-btn');
    this.notification = document.getElementById('notification');
    this.notificationTitle = document.querySelector('.notification-title');
    this.notificationMessage = document.querySelector('.notification-message');
    this.notificationClose = document.getElementById('notification-close');

    // State variables
    this.currentFloorPlan = null;
    this.selectedTable = null;
    this.selectedSeat = null; // Keep track of selected seat for ordering
    this.zoomLevel = 1;
    this.orderType = null; // 'food' or 'drink'

    // Initialize the view
    this.init();
  }

  /**
   * Initialize the server view
   */
  init() {
    console.log('Initializing Server View...');

    // Load the active floor plan
    this.loadActiveFloorPlan();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize voice recorder
    this.initVoiceRecorder();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Zoom controls
    document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoom(1.2));
    document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoom(0.8));

    // Submit order button
    if (this.submitOrderBtn) {
      this.submitOrderBtn.addEventListener('click', this.submitOrder.bind(this));
    }

    // Notification close button
    if (this.notificationClose) {
      this.notificationClose.addEventListener('click', () => {
        this.hideNotification();
      });
    }
  }

  /**
   * Initialize the voice recorder
   */
  initVoiceRecorder() {
    // Initialize the VoiceRecorder component
    try {
      this.voiceRecorder = new VoiceRecorder({
        recordButtonId: 'record-button',
        statusElementId: 'record-status',
        visualizerId: 'audio-visualizer',
        transcriptionResultId: 'transcription-result',
        transcriptionTextId: 'transcription-text',
        useWebSocket: true,
        onTranscriptionComplete: this.handleTranscriptionComplete.bind(this),
        onError: this.handleVoiceRecorderError.bind(this)
      });
    } catch (error) {
      console.error('Error initializing voice recorder:', error);
    }
  }

  /**
   * Load the active floor plan
   */
  async loadActiveFloorPlan() {
    try {
      // Show loading state
      this.floorPlanContainer.innerHTML = '<div class="loading-indicator">Loading floor plan...</div>';

      // Fetch the active floor plan from the API
      const response = await fetch('/api/v1/floor-plans?is_active=true');

      if (!response.ok) {
        throw new Error('Failed to load active floor plan');
      }

      const floorPlans = await response.json();
      console.log('Loaded floor plans:', floorPlans);

      // Get the active floor plan (should be only one)
      const activePlan = floorPlans.find(plan => plan.is_active) || floorPlans[0];

      if (!activePlan) {
        this.showNoFloorPlanMessage();
        return;
      }

      this.currentFloorPlan = activePlan;
      console.log('Active floor plan:', activePlan);

      // Load tables for this floor plan
      await this.loadTables(activePlan.id);

    } catch (error) {
      console.error('Error loading floor plan:', error);
      this.floorPlanContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading floor plan: ${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Show message when no floor plan is available
   */
  showNoFloorPlanMessage() {
    this.floorPlanContainer.innerHTML = `
      <div class="no-floor-plan-message">
        <p>No active floor plan found. Please create a floor plan in the admin view.</p>
        <a href="/admin/floor-plan" class="btn btn-primary mt-3">Go to Floor Plan Designer</a>
      </div>
    `;
  }

  /**
   * Load tables for a floor plan
   * @param {string} floorPlanId - The ID of the floor plan
   */
  async loadTables(floorPlanId) {
    try {
      console.log(`Loading tables for floor plan ID: ${floorPlanId}`);
      
      // Fetch tables for this floor plan
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`);

      if (!response.ok) {
        throw new Error('Failed to load tables');
      }

      const tables = await response.json();
      console.log('Loaded tables:', tables);

      // Clear the floor plan container
      this.floorPlanContainer.innerHTML = '';

      // If no tables, show message
      if (tables.length === 0) {
        this.floorPlanContainer.innerHTML = `
          <div class="no-tables-message">
            <p>No tables found in this floor plan. Please add tables in the admin view.</p>
            <a href="/admin/floor-plan" class="btn btn-primary mt-3">Go to Floor Plan Designer</a>
          </div>
        `;
        return;
      }

      // Create a container for the tables
      const tablesContainer = document.createElement('div');
      tablesContainer.className = 'tables-container'; // Use this for potential scaling/panning later
      this.floorPlanContainer.appendChild(tablesContainer);

      // Render each table
      for (const table of tables) {
        this.renderTable(table, tablesContainer);
      }

    } catch (error) {
      console.error('Error loading tables:', error);
      this.floorPlanContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading tables: ${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Render a table on the floor plan
   * @param {Object} table - The table data from the backend
   * @param {HTMLElement} container - The container element for tables
   */
  renderTable(table, container) {
    console.log(`Rendering table:`, table);
    
    // Create table element
    const tableElement = document.createElement('div');
    
    // Use shape field from backend
    tableElement.className = `table table-${table.shape} table-${table.status}`;
    tableElement.dataset.tableId = table.id;
    tableElement.dataset.tableName = table.name;

    // Set position and dimensions using backend fields
    tableElement.style.position = 'absolute';
    tableElement.style.left = `${table.position_x}px`;
    tableElement.style.top = `${table.position_y}px`;
    tableElement.style.width = `${table.width}px`;
    tableElement.style.height = `${table.height}px`;
    tableElement.style.transform = `rotate(${table.rotation || 0}deg)`;

    // Add table label
    const tableLabel = document.createElement('div');
    tableLabel.className = 'table-label';
    tableLabel.textContent = table.name;
    tableElement.appendChild(tableLabel);

    // Add visual feedback for hover state
    tableElement.addEventListener('mouseenter', () => {
      tableElement.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
      tableElement.style.transform = `rotate(${table.rotation || 0}deg) scale(1.02)`;
    });
    
    tableElement.addEventListener('mouseleave', () => {
      tableElement.style.boxShadow = '';
      tableElement.style.transform = `rotate(${table.rotation || 0}deg)`;
    });

    // Add click event listener with enhanced visual feedback
    tableElement.addEventListener('click', (e) => {
      // Add click animation
      tableElement.style.transform = `rotate(${table.rotation || 0}deg) scale(0.95)`;
      tableElement.style.boxShadow = '0 0 15px rgba(13, 110, 253, 0.7)';
      
      // Reset transform after animation
      setTimeout(() => {
        tableElement.style.transform = `rotate(${table.rotation || 0}deg) scale(1)`;
        // Don't reset boxShadow here - will be handled by highlightSelectedTable
      }, 150);
      
      // Play a subtle "tap" sound for better feedback
      try {
        const tapSound = new Audio('data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//uSwAAABEwTb4UwwAC4AK3w1hgAVE5hdGlvbmFsIEFudGhlbSBwbGF5ZWQgYnkgdGhlIFJveWFsIE1hcmluZXMAAAAA');
        tapSound.volume = 0.2;
        tapSound.play();
      } catch (error) {
        // Ignore audio errors - not critical
      }
      
      // Add debugging
      console.log('Table clicked - calling handleTableClick with table:', table);
      
      // Call the handler
      this.handleTableClick(table);
      
      // Prevent event bubbling
      e.stopPropagation();
    });

    // Add to container
    container.appendChild(tableElement);
  }

  /**
   * Handle table click
   * @param {Object} table - The clicked table
   */
  handleTableClick(table) {
    console.log('Table clicked with data:', table);
    
    // Store the selected table
    this.selectedTable = table;
    
    // Update UI to show selected table
    if (this.selectedTableNumber) {
      this.selectedTableNumber.textContent = table.name;
      console.log('Updated table number display to:', table.name);
    } else {
      console.warn('selectedTableNumber element not found');
    }
    
    // Hide "table not selected" message and show order interface
    if (this.tableNotSelectedDiv && this.tableSelectedDiv) {
      this.tableNotSelectedDiv.classList.add('hidden');
      this.tableSelectedDiv.classList.remove('hidden');
      console.log('Showing table selected UI');
    } else {
      console.warn('Table selection UI elements not found');
    }
    
    // Highlight the selected table
    this.highlightSelectedTable(table.id);
    
    // Show a success notification for better feedback
    this.showNotification('Table Selected', `Table ${table.name} is now active`, 'success');
    
    // Reset any previous transcription
    this.resetOrderUI();
    
    // Focus on record button if it exists
    const recordButton = document.getElementById('record-button');
    if (recordButton) {
      setTimeout(() => recordButton.focus(), 300);
    }
  }

  /**
   * Highlight the selected table
   * @param {number} tableId - The ID of the table to highlight
   */
  highlightSelectedTable(tableId) {
    console.log('Highlighting table:', tableId);
    
    // Stop any existing animations first to prevent conflicts
    const animations = document.getAnimations();
    animations.forEach(animation => {
      if (animation.effect && animation.effect.target &&
          animation.effect.target.classList &&
          animation.effect.target.classList.contains('table')) {
        animation.cancel();
      }
    });
    
    // Remove highlight from all tables
    document.querySelectorAll('.table').forEach(el => {
      el.classList.remove('table-selected');
      // Remove any inline styles that might interfere
      el.style.boxShadow = '';
      
      // Restore original transform (just rotation)
      const rotation = el.style.transform.match(/rotate\(([^)]+)\)/);
      if (rotation && rotation[1]) {
        el.style.transform = `rotate(${rotation[1]})`;
      }
    });
    
    // Add highlight to the selected table
    const selectedElement = document.querySelector(`.table[data-table-id="${tableId}"]`);
    if (selectedElement) {
      console.log('Selected element found:', selectedElement);
      selectedElement.classList.add('table-selected');
      
      // Apply a distinct border first for immediate feedback
      selectedElement.style.border = '3px solid rgba(13, 110, 253, 0.8)';
      selectedElement.style.boxShadow = '0 0 10px rgba(13, 110, 253, 0.6)';
      
      // Add a pulsing animation for better visibility
      const pulseAnimation = selectedElement.animate([
        { boxShadow: '0 0 5px 3px rgba(13, 110, 253, 0.7)' },
        { boxShadow: '0 0 12px 6px rgba(13, 110, 253, 0.3)' },
        { boxShadow: '0 0 5px 3px rgba(13, 110, 253, 0.7)' }
      ], {
        duration: 2000,
        iterations: Infinity,
        composite: 'add',      // Use 'add' to ensure the animation doesn't override other properties
        fill: 'forwards'       // Keep the last keyframe state after animation completes
      });
      
      // Store animation reference on element to manage it later
      selectedElement.pulseAnimation = pulseAnimation;
      
      // Ensure the element remains interactive
      selectedElement.style.pointerEvents = 'auto';
      selectedElement.style.zIndex = '100';  // Ensure it's above other elements
      
      // Scroll to selected table if needed
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      console.warn(`Table element with ID ${tableId} not found`);
    }
  }

  /**
   * Handle transcription complete
   * @param {Object} result - The transcription result
   */
  handleTranscriptionComplete(result) {
    console.log('Transcription complete:', result);
    if (this.transcriptionText) {
      this.transcriptionText.textContent = result.text;
    }
    if (this.transcriptionResult) {
      this.transcriptionResult.classList.remove('hidden');
    }
  }

  /**
   * Handle voice recorder error
   * @param {Error} error - The error object
   */
  handleVoiceRecorderError(error) {
    console.error('Voice recorder error:', error);
    this.showNotification('Error', 'Failed to record voice. Please try again.', 'error');
  }

  /**
   * Submit the order
   */
  async submitOrder() {
    if (!this.selectedTable) {
      this.showNotification('Error', 'Please select a table first', 'error');
      return;
    }
    
    if (!this.transcriptionText.textContent.trim()) {
      this.showNotification('Error', 'Please record an order first', 'error');
      return;
    }
    
    try {
      // Show loading state
      this.submitOrderBtn.disabled = true;
      this.submitOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
      
      // Prepare order data
      const orderData = {
        table_id: this.selectedTable.id,
        content: this.transcriptionText.textContent.trim(),
        type: 'voice', // This is a voice order
        status: 'pending'
      };
      
      // Submit to API
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit order');
      }
      
      const result = await response.json();
      
      // Show success notification
      this.showNotification('Success', 'Order submitted successfully', 'success');
      
      // Reset the order UI
      this.resetOrderUI();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      this.showNotification('Error', 'Failed to submit order. Please try again.', 'error');
    } finally {
      // Reset button state
      this.submitOrderBtn.disabled = false;
      this.submitOrderBtn.innerHTML = 'Submit Order';
    }
  }

  /**
   * Reset the order UI
   */
  resetOrderUI() {
    // Clear transcription
    if (this.transcriptionText) {
      this.transcriptionText.textContent = '';
    }
    
    // Hide transcription result
    if (this.transcriptionResult) {
      this.transcriptionResult.classList.add('hidden');
    }
    
    // Reset voice recorder (if needed)
    if (this.voiceRecorder && typeof this.voiceRecorder.reset === 'function') {
      this.voiceRecorder.reset();
    }
  }

  /**
   * Zoom the floor plan
   * @param {number} factor - The zoom factor
   */
  zoom(factor) {
    // Update zoom level
    this.zoomLevel *= factor;
    
    // Clamp zoom level to reasonable values
    this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
    
    // Apply zoom to tables container
    const tablesContainer = document.querySelector('.tables-container');
    if (tablesContainer) {
      tablesContainer.style.transform = `scale(${this.zoomLevel})`;
      tablesContainer.style.transformOrigin = 'top left';
    }
  }

  /**
   * Show a notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} type - The notification type (info, success, warning, error)
   */
  showNotification(title, message, type = 'info') {
    // Set notification content
    this.notificationTitle.textContent = title;
    this.notificationMessage.textContent = message;
    
    // Set notification type class
    this.notification.className = `notification notification-${type}`;
    
    // Show notification
    this.notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  /**
   * Hide the notification
   */
  hideNotification() {
    this.notification.style.display = 'none';
  }
}

// Initialize the server view when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const serverView = new ServerView();
});
