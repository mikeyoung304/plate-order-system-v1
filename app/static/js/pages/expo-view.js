/**
 * Expo View JavaScript
 * Handles the expo view functionality for all orders
 */

class ExpoView {
  constructor() {
    // DOM elements
    this.ordersGrid = document.getElementById('orders-grid');
    this.floorPlanContainer = document.getElementById('floor-plan-container');
    this.typeFilter = document.getElementById('type-filter');
    this.statusFilter = document.getElementById('status-filter');
    this.refreshBtn = document.getElementById('refresh-btn');
    this.notification = document.getElementById('notification');
    this.notificationTitle = document.querySelector('.notification-title');
    this.notificationMessage = document.querySelector('.notification-message');
    this.notificationClose = document.getElementById('notification-close');
    
    // Modal elements
    this.orderDetailsModal = document.getElementById('order-details-modal');
    this.modalTableName = document.getElementById('modal-table-name');
    this.modalSeatNumber = document.getElementById('modal-seat-number');
    this.modalOrderType = document.getElementById('modal-order-type');
    this.modalOrderStatus = document.getElementById('modal-order-status');
    this.modalOrderTime = document.getElementById('modal-order-time');
    this.modalOrderContent = document.getElementById('modal-order-content');
    this.modalDietaryNotes = document.getElementById('modal-dietary-notes');
    this.modalStartBtn = document.getElementById('modal-start-btn');
    this.modalCompleteBtn = document.getElementById('modal-complete-btn');
    
    // State variables
    this.orders = [];
    this.tables = [];
    this.currentOrder = null;
    this.refreshInterval = null;
    this.floorPlan = null;
    
    // Initialize the view
    this.init();
  }

  /**
   * Initialize the expo view
   */
  init() {
    console.log('Initializing Expo View...');
    
    // Load floor plan
    this.loadFloorPlan();
    
    // Load initial orders
    this.loadOrders();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up auto-refresh (every 30 seconds)
    this.refreshInterval = setInterval(() => {
      this.loadOrders();
    }, 30000);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Type filter change
    if (this.typeFilter) {
      this.typeFilter.addEventListener('change', () => {
        this.loadOrders();
      });
    }
    
    // Status filter change
    if (this.statusFilter) {
      this.statusFilter.addEventListener('change', () => {
        this.loadOrders();
      });
    }
    
    // Refresh button
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => {
        this.loadOrders();
        this.loadFloorPlan();
      });
    }
    
    // Notification close button
    if (this.notificationClose) {
      this.notificationClose.addEventListener('click', () => {
        this.hideNotification();
      });
    }
    
    // Modal buttons
    if (this.modalStartBtn) {
      this.modalStartBtn.addEventListener('click', () => {
        this.updateOrderStatus('in_progress');
      });
    }
    
    if (this.modalCompleteBtn) {
      this.modalCompleteBtn.addEventListener('click', () => {
        this.updateOrderStatus('completed');
      });
    }
  }

  /**
   * Load floor plan from the API
   */
  async loadFloorPlan() {
    try {
      // Show loading state
      this.floorPlanContainer.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading floor plan...</p>
        </div>
      `;
      
      // Fetch active floor plan
      const response = await fetch('/api/v1/floor-plans?is_active=true');
      
      if (!response.ok) {
        throw new Error('Failed to load floor plan');
      }
      
      const floorPlans = await response.json();
      
      // Get the active floor plan
      const activePlan = floorPlans.find(plan => plan.is_active) || floorPlans[0];
      
      if (!activePlan) {
        this.floorPlanContainer.innerHTML = `
          <div class="no-floor-plan-message">
            <p>No active floor plan found.</p>
          </div>
        `;
        return;
      }
      
      this.floorPlan = activePlan;
      
      // Load tables for this floor plan
      await this.loadTables(activePlan.id);
      
    } catch (error) {
      console.error('Error loading floor plan:', error);
      this.floorPlanContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading floor plan: ${error.message}</p>
        </div>
      `;
    }
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
      
      this.tables = await response.json();
      
      // Render floor plan
      this.renderFloorPlan();
      
    } catch (error) {
      console.error('Error loading tables:', error);
      this.floorPlanContainer.innerHTML = `
        <div class="error-message">
          <p>Error loading tables: ${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Render floor plan with tables
   */
  renderFloorPlan() {
    // Clear the container
    this.floorPlanContainer.innerHTML = '';
    
    // Create floor plan element
    const floorPlanElement = document.createElement('div');
    floorPlanElement.className = 'floor-plan';
    
    // If no tables, show message
    if (this.tables.length === 0) {
      floorPlanElement.innerHTML = `
        <div class="no-tables-message">
          <p>No tables found in this floor plan.</p>
        </div>
      `;
      this.floorPlanContainer.appendChild(floorPlanElement);
      return;
    }
    
    // Create tables container
    const tablesContainer = document.createElement('div');
    tablesContainer.className = 'tables-container';
    floorPlanElement.appendChild(tablesContainer);
    
    // Render each table
    this.tables.forEach(table => {
      const tableElement = this.createTableElement(table);
      tablesContainer.appendChild(tableElement);
    });
    
    // Add to container
    this.floorPlanContainer.appendChild(floorPlanElement);
    
    // Update table status based on orders
    this.updateTableStatus();
  }

  /**
   * Create a table element
   * @param {Object} table - The table data
   * @returns {HTMLElement} - The table element
   */
  createTableElement(table) {
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
    tableElement.addEventListener('click', () => {
      this.showTableOrders(table.id);
    });
    
    return tableElement;
  }

  /**
   * Update table status based on orders
   */
  updateTableStatus() {
    // Group orders by table
    const ordersByTable = {};
    this.orders.forEach(order => {
      if (!ordersByTable[order.table_id]) {
        ordersByTable[order.table_id] = [];
      }
      ordersByTable[order.table_id].push(order);
    });
    
    // Update each table element
    Object.keys(ordersByTable).forEach(tableId => {
      const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
      if (!tableElement) return;
      
      const tableOrders = ordersByTable[tableId];
      
      // Count orders by status
      const newOrders = tableOrders.filter(o => o.status === 'new').length;
      const inProgressOrders = tableOrders.filter(o => o.status === 'in_progress').length;
      const completedOrders = tableOrders.filter(o => o.status === 'completed').length;
      
      // Update table class based on order status
      tableElement.classList.remove('has-new-orders', 'has-in-progress-orders', 'has-completed-orders');
      
      if (newOrders > 0) {
        tableElement.classList.add('has-new-orders');
      } else if (inProgressOrders > 0) {
        tableElement.classList.add('has-in-progress-orders');
      } else if (completedOrders > 0) {
        tableElement.classList.add('has-completed-orders');
      }
      
      // Add order count badge
      const existingBadge = tableElement.querySelector('.order-count-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      const totalOrders = tableOrders.length;
      if (totalOrders > 0) {
        const badge = document.createElement('div');
        badge.className = 'order-count-badge';
        badge.textContent = totalOrders;
        tableElement.appendChild(badge);
      }
    });
  }

  /**
   * Show orders for a specific table
   * @param {string} tableId - The ID of the table
   */
  showTableOrders(tableId) {
    // Filter orders for this table
    const tableOrders = this.orders.filter(order => order.table_id === tableId);
    
    // If no orders, show message
    if (tableOrders.length === 0) {
      this.showNotification('Info', 'No orders found for this table', 'info');
      return;
    }
    
    // Apply table filter to orders grid
    this.renderOrders(tableOrders);
    
    // Highlight the table
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
      table.classList.remove('selected');
    });
    
    const selectedTable = document.querySelector(`[data-table-id="${tableId}"]`);
    if (selectedTable) {
      selectedTable.classList.add('selected');
    }
  }

  /**
   * Load orders from the API
   */
  async loadOrders() {
    try {
      // Show loading state
      this.ordersGrid.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading orders...</p>
        </div>
      `;
      
      // Get selected filters
      const typeFilter = this.typeFilter ? this.typeFilter.value : 'all';
      const statusFilter = this.statusFilter ? this.statusFilter.value : 'new';
      
      // Build query parameters
      let queryParams = new URLSearchParams();
      if (typeFilter !== 'all') {
        queryParams.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      // Fetch orders from API
      const response = await fetch(`/api/v1/orders?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      
      this.orders = await response.json();
      
      // Render orders
      this.renderOrders(this.orders);
      
      // Update table status
      this.updateTableStatus();
      
    } catch (error) {
      console.error('Error loading orders:', error);
      this.ordersGrid.innerHTML = `
        <div class="error-message">
          <p>Error loading orders: ${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Render orders in the grid
   * @param {Array} orders - The orders to render
   */
  renderOrders(orders) {
    // Clear the grid
    this.ordersGrid.innerHTML = '';
    
    // If no orders, show message
    if (orders.length === 0) {
      this.ordersGrid.innerHTML = `
        <div class="no-orders-message">
          <p>No orders found matching the current filters.</p>
        </div>
      `;
      return;
    }
    
    // Render each order
    orders.forEach(order => {
      const orderCard = this.createOrderCard(order);
      this.ordersGrid.appendChild(orderCard);
    });
  }

  /**
   * Create an order card element
   * @param {Object} order - The order data
   * @returns {HTMLElement} - The order card element
   */
  createOrderCard(order) {
    // Create card element
    const card = document.createElement('div');
    card.className = `order-card order-status-${order.status} order-type-${order.type}`;
    card.dataset.orderId = order.id;
    
    // Format time
    const orderTime = new Date(order.created_at);
    const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Extract dietary notes if present
    const dietaryNotes = this.extractDietaryNotes(order.content);
    const orderContent = this.removeDietaryNotes(order.content);
    
    // Create card content
    card.innerHTML = `
      <div class="order-header">
        <div class="order-info">
          <h3 class="order-table">Table ${order.table_id.split('-')[0]}</h3>
          <span class="order-seat">Seat ${order.seat_id.split('-')[0]}</span>
          <span class="order-type-badge ${order.type}">${order.type === 'food' ? 'Food' : 'Drink'}</span>
        </div>
        <div class="order-time">${formattedTime}</div>
      </div>
      <div class="order-content">
        <p>${orderContent}</p>
      </div>
      ${dietaryNotes.length > 0 ? `
        <div class="dietary-notes">
          ${dietaryNotes.map(note => `<div class="dietary-note">${note}</div>`).join('')}
        </div>
      ` : ''}
      <div class="order-footer">
        <div class="order-status">
          <span class="status-indicator"></span>
          <span class="status-text">${this.formatStatus(order.status)}</span>
        </div>
        <div class="order-actions">
          ${order.status === 'new' ? `
            <button class="btn btn-sm btn-primary start-btn" data-order-id="${order.id}">
              Start
            </button>
          ` : ''}
          ${order.status === 'in_progress' ? `
            <button class="btn btn-sm btn-success complete-btn" data-order-id="${order.id}">
              Complete
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline-secondary details-btn" data-order-id="${order.id}">
            Details
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const startBtn = card.querySelector('.start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleStartOrder(order.id);
      });
    }
    
    const completeBtn = card.querySelector('.complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCompleteOrder(order.id);
      });
    }
    
    const detailsBtn = card.querySelector('.details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showOrderDetails(order);
      });
    }
    
    // Make the entire card clickable
    card.addEventListener('click', () => {
      this.showOrderDetails(order);
    });
    
    return card;
  }

  /**
   * Extract dietary notes from order content
   * @param {string} content - The order content
   * @returns {string[]} - Array of dietary notes
   */
  extractDietaryNotes(content) {
    const notes = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('[DIETARY NOTE:')) {
        notes.push(line.replace('[DIETARY NOTE:', '').replace(']', '').trim());
      }
    }
    
    return notes;
  }

  /**
   * Remove dietary notes from order content
   * @param {string} content - The order content
   * @returns {string} - Order content without dietary notes
   */
  removeDietaryNotes(content) {
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.includes('[DIETARY NOTE:'));
    return filteredLines.join('\n');
  }

  /**
   * Format order status for display
   * @param {string} status - The order status
   * @returns {string} - Formatted status text
   */
  formatStatus(status) {
    switch (status) {
      case 'new':
        return 'New';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }

  /**
   * Format order type for display
   * @param {string} type - The order type
   * @returns {string} - Formatted type text
   */
  formatType(type) {
    switch (type) {
      case 'food':
        return 'Food';
      case 'drink':
        return 'Drink';
      default:
        return type;
    }
  }

  /**
   * Handle start order button click
   * @param {string} orderId - The order ID
   */
  handleStartOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      this.currentOrder = order;
      this.updateOrderStatus('in_progress');
    }
  }

  /**
   * Handle complete order button click
   * @param {string} orderId - The order ID
   */
  handleCompleteOrder(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      this.currentOrder = order;
      this.updateOrderStatus('completed');
    }
  }

  /**
   * Show order details in modal
   * @param {Object} order - The order data
   */
  showOrderDetails(order) {
    this.currentOrder = order;
    
    // Format time
    const orderTime = new Date(order.created_at);
    const formattedTime = orderTime.toLocaleString();
    
    // Extract dietary notes
    const dietaryNotes = this.extractDietaryNotes(order.content);
    const orderContent = this.removeDietaryNotes(order.content);
    
    // Update modal content
    this.modalTableName.textContent = order.table_id.split('-')[0];
    this.modalSeatNumber.textContent = order.seat_id.split('-')[0];
    this.modalOrderType.textContent = this.formatType(order.type);
    this.modalOrderStatus.textContent = this.formatStatus(order.status);
    this.modalOrderTime.textContent = formattedTime;
    this.modalOrderContent.textContent = orderContent;
    
    // Update dietary notes
    this.modalDietaryNotes.innerHTML = '';
    if (dietaryNotes.length > 0) {
      const notesTitle = document.createElement('h6');
      notesTitle.textContent = 'Dietary Notes:';
      this.modalDietaryNotes.appendChild(notesTitle);
      
      const notesList = document.createElement('ul');
      dietaryNotes.forEach(note => {
        const noteItem = document.createElement('li');
        noteItem.textContent = note;
        notesList.appendChild(noteItem);
      });
      this.modalDietaryNotes.appendChild(notesList);
    }
    
    // Show/hide action buttons based on status
    if (order.status === 'new') {
      this.modalStartBtn.style.display = 'block';
      this.modalCompleteBtn.style.display = 'none';
    } else if (order.status === 'in_progress') {
      this.modalStartBtn.style.display = 'none';
      this.modalCompleteBtn.style.display = 'block';
    } else {
      this.modalStartBtn.style.display = 'none';
      this.modalCompleteBtn.style.display = 'none';
    }
    
    // Show modal
    const modal = new bootstrap.Modal(this.orderDetailsModal);
    modal.show();
  }

  /**
   * Update order status
   * @param {string} status - The new status
   */
  async updateOrderStatus(status) {
    if (!this.currentOrder) {
      return;
    }
    
    try {
      // Update order status via API
      const response = await fetch(`/api/v1/orders/${this.currentOrder.id}/status/${status}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // Close modal if open
      const modalElement = this.orderDetailsModal;
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
      
      // Show success notification
      this.showNotification('Success', `Order status updated to ${this.formatStatus(status)}`, 'success');
      
      // Reload orders
      this.loadOrders();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      this.showNotification('Error', `Failed to update order status: ${error.message}`, 'error');
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

// Initialize the expo view when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const expoView = new ExpoView();
});
