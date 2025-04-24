/**
 * Kitchen View JavaScript
 * Handles the kitchen view functionality for food orders
 */

class KitchenView {
  constructor() {
    // DOM elements
    this.ordersGrid = document.getElementById('orders-grid');
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
    this.modalOrderTime = document.getElementById('modal-order-time');
    this.modalOrderContent = document.getElementById('modal-order-content');
    this.modalDietaryNotes = document.getElementById('modal-dietary-notes');
    this.modalStartBtn = document.getElementById('modal-start-btn');
    this.modalCompleteBtn = document.getElementById('modal-complete-btn');
    
    // State variables
    this.orders = [];
    this.currentOrder = null;
    this.refreshInterval = null;
    
    // Initialize the view
    this.init();
  }

  /**
   * Initialize the kitchen view
   */
  init() {
    console.log('Initializing Kitchen View...');
    
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
      
      // Get selected status filter
      const statusFilter = this.statusFilter ? this.statusFilter.value : 'new';
      
      // Build query parameters
      let queryParams = new URLSearchParams();
      queryParams.append('type', 'food'); // Only food orders for kitchen view
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
      this.renderOrders();
      
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
   */
  renderOrders() {
    // Clear the grid
    this.ordersGrid.innerHTML = '';
    
    // If no orders, show message
    if (this.orders.length === 0) {
      this.ordersGrid.innerHTML = `
        <div class="no-orders-message">
          <p>No food orders found.</p>
        </div>
      `;
      return;
    }
    
    // Render each order
    this.orders.forEach(order => {
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
    card.className = `order-card order-status-${order.status}`;
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

// Initialize the kitchen view when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const kitchenView = new KitchenView();
});
