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
    this.selectedSeat = null;
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
      
      // Get the active floor plan (should be only one)
      const activePlan = floorPlans.find(plan => plan.is_active) || floorPlans[0];
      
      if (!activePlan) {
        this.showNoFloorPlanMessage();
        return;
      }
      
      this.currentFloorPlan = activePlan;
      
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
      // Fetch tables for this floor plan
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`);
      
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }
      
      const tables = await response.json();
      
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
      tablesContainer.className = 'tables-container';
      this.floorPlanContainer.appendChild(tablesContainer);
      
      // Render each table
      for (const table of tables) {
        await this.renderTable(table, tablesContainer);
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
   * @param {Object} table - The table data
   * @param {HTMLElement} container - The container element
   */
  async renderTable(table, container) {
    // Create table element
    const tableElement = document.createElement('div');
    tableElement.className = `table table-${table.shape} table-${table.status}`;
    tableElement.dataset.tableId = table.id;
    tableElement.dataset.tableName = table.name;
    
    // Set position and dimensions
    tableElement.style.left = `${table.position_x}px`;
    tableElement.style.top = `${table.position_y}px`;
    tableElement.style.width = `${table.width}px`;
    tableElement.style.height = `${table.height}px`;
    tableElement.style.transform = `rotate(${table.rotation}deg)`;
    
    // Add table label
    const tableLabel = document.createElement('div');
    tableLabel.className = 'table-label';
    tableLabel.textContent = table.name;
    tableElement.appendChild(tableLabel);
    
    // Add click event listener
    tableElement.addEventListener('click', () => this.handleTableClick(table));
    
    // Add to container
    container.appendChild(tableElement);
    
    // Load and render seats for this table
    await this.loadSeats(table.id, tableElement);
  }

  /**
   * Load seats for a table
   * @param {string} tableId - The ID of the table
   * @param {HTMLElement} tableElement - The table element
   */
  async loadSeats(tableId, tableElement) {
    try {
      // Fetch seats for this table
      const response = await fetch(`/api/v1/tables/${tableId}/seats`);
      
      if (!response.ok) {
        throw new Error('Failed to load seats');
      }
      
      const seats = await response.json();
      
      // Render each seat
      for (const seat of seats) {
        this.renderSeat(seat, tableElement);
      }
      
    } catch (error) {
      console.error(`Error loading seats for table ${tableId}:`, error);
    }
  }

  /**
   * Render a seat on a table
   * @param {Object} seat - The seat data
   * @param {HTMLElement} tableElement - The table element
   */
  renderSeat(seat, tableElement) {
    // Create seat element
    const seatElement = document.createElement('div');
    seatElement.className = `seat seat-${seat.status}`;
    seatElement.dataset.seatId = seat.id;
    seatElement.dataset.seatNumber = seat.number;
    
    // Set position
    seatElement.style.left = `${seat.position_x}px`;
    seatElement.style.top = `${seat.position_y}px`;
    
    // Add seat number
    const seatNumber = document.createElement('span');
    seatNumber.className = 'seat-number';
    seatNumber.textContent = seat.number;
    seatElement.appendChild(seatNumber);
    
    // Add click event listener
    seatElement.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering table click
      this.handleSeatClick(seat, tableElement);
    });
    
    // Add to table element
    tableElement.appendChild(seatElement);
  }

  /**
   * Handle table click
   * @param {Object} table - The table data
   */
  handleTableClick(table) {
    // Set selected table
    this.selectedTable = table;
    this.selectedSeat = null;
    
    // Update UI
    this.selectedTableNumber.textContent = table.name.replace('Table ', '');
    this.tableNotSelectedDiv.classList.add('hidden');
    this.tableSelectedDiv.classList.remove('hidden');
    
    // Hide transcription result
    this.transcriptionResult.classList.add('hidden');
    
    // Highlight selected table
    this.highlightSelectedTable(table.id);
    
    // Zoom to table
    this.zoomToTable(table.id);
  }

  /**
   * Handle seat click
   * @param {Object} seat - The seat data
   * @param {HTMLElement} tableElement - The table element
   */
  handleSeatClick(seat, tableElement) {
    // Set selected seat
    this.selectedSeat = seat;
    
    // Highlight selected seat
    this.highlightSelectedSeat(seat.id);
    
    // Show order type selection modal
    this.showOrderTypeModal(seat);
  }

  /**
   * Show order type selection modal
   * @param {Object} seat - The seat data
   */
  showOrderTypeModal(seat) {
    // Create modal if it doesn't exist
    if (!document.getElementById('order-type-modal')) {
      const modal = document.createElement('div');
      modal.id = 'order-type-modal';
      modal.className = 'modal fade';
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-labelledby', 'order-type-modal-label');
      modal.setAttribute('aria-hidden', 'true');
      
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="order-type-modal-label">Select Order Type</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Table ${this.selectedTable.name}, Seat ${seat.number}</p>
              <p>Select order type:</p>
              <div class="d-grid gap-2">
                <button id="food-order-btn" class="btn btn-lg btn-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2">
                    <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 1V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 1V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 1V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Food Order
                </button>
                <button id="drink-order-btn" class="btn btn-lg btn-info text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2">
                    <path d="M17.5 2H6.5C5.83696 2 5.20107 2.26339 4.73223 2.73223C4.26339 3.20107 4 3.83696 4 4.5C4 5.16304 4.26339 5.79893 4.73223 6.26777C5.20107 6.73661 5.83696 7 6.5 7H17.5C18.163 7 18.7989 6.73661 19.2678 6.26777C19.7366 5.79893 20 5.16304 20 4.5C20 3.83696 19.7366 3.20107 19.2678 2.73223C18.7989 2.26339 18.163 2 17.5 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17.5 7V16C17.5 16.663 17.2366 17.2989 16.7678 17.7678C16.2989 18.2366 15.663 18.5 15 18.5H9C8.33696 18.5 7.70107 18.2366 7.23223 17.7678C6.76339 17.2989 6.5 16.663 6.5 16V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 18.5V20.5C9 21.163 9.26339 21.7989 9.73223 22.2678C10.2011 22.7366 10.837 23 11.5 23H12.5C13.163 23 13.7989 22.7366 14.2678 22.2678C14.7366 21.7989 15 21.163 15 20.5V18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Drink Order
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      document.getElementById('food-order-btn').addEventListener('click', () => {
        this.orderType = 'food';
        this.hideOrderTypeModal();
        this.startVoiceRecording();
      });
      
      document.getElementById('drink-order-btn').addEventListener('click', () => {
        this.orderType = 'drink';
        this.hideOrderTypeModal();
        this.startVoiceRecording();
      });
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('order-type-modal'));
    modal.show();
  }

  /**
   * Hide order type modal
   */
  hideOrderTypeModal() {
    const modalElement = document.getElementById('order-type-modal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }

  /**
   * Start voice recording
   */
  startVoiceRecording() {
    // Update UI to show recording state
    const recordButton = document.getElementById('record-button');
    if (recordButton) {
      recordButton.click();
    }
  }

  /**
   * Handle transcription complete
   * @param {Object} result - The transcription result
   */
  handleTranscriptionComplete(result) {
    // Show transcription result
    this.transcriptionResult.classList.remove('hidden');
    
    // Update transcription text
    if (this.transcriptionText) {
      this.transcriptionText.textContent = result.text || 'No transcription available';
    }
  }

  /**
   * Handle voice recorder error
   * @param {string} error - The error message
   */
  handleVoiceRecorderError(error) {
    console.error('Voice recorder error:', error);
    this.showNotification('Error', `Voice recording error: ${error}`, 'error');
  }

  /**
   * Submit the order
   */
  async submitOrder() {
    if (!this.selectedTable || !this.selectedSeat || !this.orderType) {
      this.showNotification('Error', 'Please select a table, seat, and order type', 'error');
      return;
    }
    
    const orderContent = this.transcriptionText ? this.transcriptionText.textContent : '';
    
    if (!orderContent) {
      this.showNotification('Error', 'No order content available', 'error');
      return;
    }
    
    try {
      // Create order object
      const order = {
        table_id: this.selectedTable.id,
        seat_id: this.selectedSeat.id,
        resident_id: this.selectedSeat.resident_id,
        type: this.orderType,
        content: orderContent,
        status: 'new'
      };
      
      // Submit order to API
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit order');
      }
      
      // Update seat status
      await this.updateSeatStatus(this.selectedSeat.id, 'occupied_with_order');
      
      // Show success notification
      this.showNotification('Success', 'Order submitted successfully', 'success');
      
      // Reset UI
      this.resetOrderUI();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      this.showNotification('Error', `Failed to submit order: ${error.message}`, 'error');
    }
  }

  /**
   * Update seat status
   * @param {string} seatId - The ID of the seat
   * @param {string} status - The new status
   */
  async updateSeatStatus(seatId, status) {
    try {
      const response = await fetch(`/api/v1/seats/${seatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update seat status');
      }
      
      // Update seat element
      const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
      if (seatElement) {
        // Remove old status classes
        seatElement.classList.remove('seat-empty', 'seat-occupied_with_order', 'seat-occupied_without_order');
        // Add new status class
        seatElement.classList.add(`seat-${status}`);
      }
      
      // Update local seat data
      if (this.selectedSeat && this.selectedSeat.id === seatId) {
        this.selectedSeat.status = status;
      }
      
    } catch (error) {
      console.error('Error updating seat status:', error);
    }
  }

  /**
   * Reset order UI
   */
  resetOrderUI() {
    // Hide transcription result
    this.transcriptionResult.classList.add('hidden');
    
    // Reset selected seat
    this.selectedSeat = null;
    
    // Reset order type
    this.orderType = null;
    
    // Reset transcription text
    if (this.transcriptionText) {
      this.transcriptionText.textContent = '';
    }
    
    // Remove seat highlight
    const highlightedSeats = document.querySelectorAll('.seat.selected');
    highlightedSeats.forEach(seat => {
      seat.classList.remove('selected');
    });
  }

  /**
   * Highlight selected table
   * @param {string} tableId - The ID of the table
   */
  highlightSelectedTable(tableId) {
    // Remove highlight from all tables
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      table.classList.remove('selected');
    });
    
    // Add highlight to selected table
    const selectedTable = document.querySelector(`[data-table-id="${tableId}"]`);
    if (selectedTable) {
      selectedTable.classList.add('selected');
    }
  }

  /**
   * Highlight selected seat
   * @param {string} seatId - The ID of the seat
   */
  highlightSelectedSeat(seatId) {
    // Remove highlight from all seats
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
      seat.classList.remove('selected');
    });
    
    // Add highlight to selected seat
    const selectedSeat = document.querySelector(`[data-seat-id="${seatId}"]`);
    if (selectedSeat) {
      selectedSeat.classList.add('selected');
    }
  }

  /**
   * Zoom to a table
   * @param {string} tableId - The ID of the table
   */
  zoomToTable(tableId) {
    const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
    if (!tableElement) return;
    
    // Reset zoom
    this.zoomLevel = 1;
    this.floorPlanContainer.style.transform = `scale(${this.zoomLevel})`;
    
    // Get table position
    const tableRect = tableElement.getBoundingClientRect();
    const containerRect = this.floorPlanContainer.getBoundingClientRect();
    
    // Calculate center position
    const centerX = tableRect.left + tableRect.width / 2 - containerRect.left;
    const centerY = tableRect.top + tableRect.height / 2 - containerRect.top;
    
    // Calculate translation
    const translateX = (containerRect.width / 2) - centerX;
    const translateY = (containerRect.height / 2) - centerY;
    
    // Apply translation
    this.floorPlanContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${this.zoomLevel})`;
  }

  /**
   * Zoom the floor plan
   * @param {number} factor - The zoom factor
   */
  zoom(factor) {
    this.zoomLevel *= factor;
    
    // Limit zoom level
    if (this.zoomLevel > 3) this.zoomLevel = 3;
    if (this.zoomLevel < 0.5) this.zoomLevel = 0.5;
    
    // Apply zoom
    const currentTransform = this.floorPlanContainer.style.transform;
    
    if (currentTransform.includes('translate')) {
      // Extract current translation
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      if (translateMatch && translateMatch[1]) {
        const translate = translateMatch[1];
        this.floorPlanContainer.style.transform = `translate(${translate}) scale(${this.zoomLevel})`;
      } else {
        this.floorPlanContainer.style.transform = `scale(${this.zoomLevel})`;
      }
    } else {
      this.floorPlanContainer.style.transform = `scale(${this.zoomLevel})`;
    }
  }

  /**
   * Show notification
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {string} type - The notification type (success, error, warning, info)
   */
  showNotification(title, message, type = 'info') {
    if (!this.notification) return;
    
    // Set notification content
    this.notificationTitle.textContent = title;
    this.notificationMessage.textContent = message;
    
    // Remove previous type classes
    this.notification.classList.remove('notification-success', 'notification-error', 'notification-warning', 'notification-info');
    
    // Add type class
    this.notification.classList.add(`notification-${type}`);
    
    // Show notification
    this.notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  /**
   * Hide notification
   */
  hideNotification() {
    if (this.notification) {
      this.notification.style.display = 'none';
    }
  }
}

// Initialize the server view when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const serverView = new ServerView();
});
