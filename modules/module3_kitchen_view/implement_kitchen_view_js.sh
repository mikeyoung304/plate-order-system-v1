#!/bin/bash

# Task: Implement Kitchen View JavaScript
# This script creates the main JavaScript file for the kitchen view

echo "Starting task: Implement Kitchen View JavaScript"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js"
KITCHEN_VIEW_JS="$JS_DIR/kitchen-view.js"

# Create the kitchen view JavaScript
echo "Creating kitchen view JavaScript..."
cat > "$KITCHEN_VIEW_JS" << 'EOF'
/**
 * Kitchen View JavaScript
 * Main controller for the kitchen display system
 */
import { OrderCard } from './components/orders/OrderCard.js';
import { OrderFilters } from './components/orders/OrderFilters.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the kitchen view
    const kitchenView = new KitchenView();
    kitchenView.init();
});

class KitchenView {
    constructor() {
        // State
        this.orders = [];
        this.orderElements = new Map(); // Map of order ID to OrderCard instance
        this.socket = null;
        
        // DOM elements
        this.ordersContainer = document.getElementById('orders-container');
        this.emptyMessage = document.querySelector('.orders-empty');
        this.connectionStatus = document.getElementById('connection-status');
        
        // Flag modal elements
        this.flagModal = document.getElementById('flag-modal');
        this.flagReason = document.getElementById('flag-reason');
        this.flagNotes = document.getElementById('flag-notes');
        this.confirmFlagBtn = document.getElementById('confirm-flag');
        this.cancelFlagBtn = document.getElementById('close-flag-modal');
        this.currentOrderToFlag = null;
        
        // Initialize filters
        this.filters = new OrderFilters(
            this.handleFilterChange.bind(this),
            this.handleViewChange.bind(this),
            this.loadOrders.bind(this)
        );
    }
    
    /**
     * Initialize the kitchen view
     */
    init() {
        this.setupEventListeners();
        this.loadOrders();
        this.setupWebSocketConnection();
        
        // Auto-refresh every 60 seconds
        setInterval(() => this.loadOrders(), 60000);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Flag modal events
        if (this.confirmFlagBtn) {
            this.confirmFlagBtn.addEventListener('click', this.submitFlagOrder.bind(this));
        }
        
        if (this.cancelFlagBtn) {
            this.cancelFlagBtn.addEventListener('click', this.closeFlagModal.bind(this));
        }
        
        // Close flag modal when clicking outside
        if (this.flagModal) {
            this.flagModal.addEventListener('click', (e) => {
                if (e.target === this.flagModal) {
                    this.closeFlagModal();
                }
            });
        }
    }
    
    /**
     * Load orders from the API
     */
    loadOrders() {
        // Show loading state
        this.updateConnectionStatus('Loading...', 'loading');
        
        // Fetch orders based on filter
        let url = '/api/orders';
        const filter = this.filters.getCurrentFilter();
        
        if (filter !== 'all') {
            url += `?status=${filter}`;
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                this.orders = data;
                this.renderOrders();
                this.updateStats();
                this.updateConnectionStatus('Connected', 'connected');
            })
            .catch(error => {
                console.error('Error loading orders:', error);
                this.updateConnectionStatus('Error loading orders', 'error');
                this.showNotification('Error loading orders. Please try again.', 'error');
            });
    }
    
    /**
     * Render orders in the container
     */
    renderOrders() {
        // Clear existing orders
        while (this.ordersContainer.firstChild) {
            this.ordersContainer.removeChild(this.ordersContainer.firstChild);
        }
        
        // Reset order elements map
        this.orderElements.clear();
        
        // Filter orders based on current filter
        const filter = this.filters.getCurrentFilter();
        let filteredOrders = this.orders;
        
        if (filter !== 'all') {
            const statusMap = {
                'pending': 'pending',
                'in-progress': 'in_progress',
                'ready': 'ready'
            };
            filteredOrders = this.orders.filter(order => order.status === statusMap[filter]);
        }
        
        // Display message if no orders
        if (filteredOrders.length === 0) {
            this.emptyMessage.classList.remove('hidden');
            return;
        } else {
            this.emptyMessage.classList.add('hidden');
        }
        
        // Sort orders: pending first, then in_progress, then ready
        const sortOrder = { 'pending': 0, 'in_progress': 1, 'ready': 2, 'completed': 3 };
        filteredOrders.sort((a, b) => {
            // First by status
            const statusDiff = sortOrder[a.status] - sortOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            
            // Then by created time (oldest first)
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        // Create cards for each order
        filteredOrders.forEach(order => {
            const orderCard = new OrderCard(
                order,
                this.updateOrderStatus.bind(this),
                this.openFlagModal.bind(this)
            );
            
            const cardElement = orderCard.render();
            this.ordersContainer.appendChild(cardElement);
            
            // Store reference to the order card
            this.orderElements.set(order.id, orderCard);
        });
    }
    
    /**
     * Update order statistics
     */
    updateStats() {
        // Count orders by status
        const counts = {
            pending: 0,
            in_progress: 0,
            ready: 0,
            total: this.orders.length
        };
        
        this.orders.forEach(order => {
            if (order.status === 'pending') counts.pending++;
            if (order.status === 'in_progress') counts.in_progress++;
            if (order.status === 'ready') counts.ready++;
        });
        
        // Update counter elements
        this.filters.updateCounts(counts);
    }
    
    /**
     * Update order status
     * @param {number} orderId - The ID of the order to update
     * @param {string} status - The new status
     */
    updateOrderStatus(orderId, status) {
        fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the order in local array
            const index = this.orders.findIndex(o => o.id === parseInt(orderId));
            if (index !== -1) {
                this.orders[index] = data;
            }
            
            // Update the order card if it exists
            const orderCard = this.orderElements.get(parseInt(orderId));
            if (orderCard) {
                orderCard.update(data);
            }
            
            // Re-render orders and update stats
            this.renderOrders();
            this.updateStats();
            
            // Show notification
            this.showNotification(`Order #${orderId} status updated to ${status.replace('_', ' ')}`);
        })
        .catch(error => {
            console.error('Error updating order:', error);
            this.showNotification('Error updating order status. Please try again.', 'error');
        });
    }
    
    /**
     * Open flag modal
     * @param {number} orderId - The ID of the order to flag
     */
    openFlagModal(orderId) {
        this.currentOrderToFlag = orderId;
        this.flagReason.selectedIndex = 0;
        this.flagNotes.value = '';
        this.flagModal.classList.remove('hidden');
    }
    
    /**
     * Close flag modal
     */
    closeFlagModal() {
        this.flagModal.classList.add('hidden');
        this.currentOrderToFlag = null;
    }
    
    /**
     * Submit flag for order
     */
    submitFlagOrder() {
        if (!this.currentOrderToFlag) return;
        
        const reason = this.flagReason.value;
        const notes = this.flagNotes.value.trim();
        let flagMessage = reason.replace('-', ' ');
        
        if (notes) {
            flagMessage += `: ${notes}`;
        }
        
        fetch(`/api/orders/${this.currentOrderToFlag}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flagged: flagMessage
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the order in local array
            const index = this.orders.findIndex(o => o.id === parseInt(this.currentOrderToFlag));
            if (index !== -1) {
                this.orders[index] = data;
            }
            
            // Update the order card if it exists
            const orderCard = this.orderElements.get(parseInt(this.currentOrderToFlag));
            if (orderCard) {
                orderCard.update(data);
            }
            
            // Close modal
            this.closeFlagModal();
            
            // Show notification
            this.showNotification('Order flagged successfully');
        })
        .catch(error => {
            console.error('Error flagging order:', error);
            this.showNotification('Error flagging order. Please try again.', 'error');
        });
    }
    
    /**
     * Handle filter change
     * @param {string} filter - The new filter value
     */
    handleFilterChange(filter) {
        this.renderOrders();
    }
    
    /**
     * Handle view mode change
     * @param {string} viewMode - The new view mode ('grid' or 'list')
     */
    handleViewChange(viewMode) {
        if (this.ordersContainer) {
            this.ordersContainer.className = viewMode === 'grid' ? 'orders-grid' : 'orders-list';
        }
    }
    
    /**
     * Update connection status indicator
     * @param {string} message - Status message to display
     * @param {string} state - Status state ('connected', 'error', 'loading')
     */
    updateConnectionStatus(message, state) {
        if (!this.connectionStatus) return;
        
        this.connectionStatus.textContent = message;
        
        // Remove all state classes
        this.connectionStatus.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
        
        // Add appropriate state class
        switch (state) {
            case 'connected':
                this.connectionStatus.classList.add('bg-green-100', 'text-green-800');
                this.connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Connected';
                break;
            case 'error':
                this.connectionStatus.classList.add('bg-red-100', 'text-red-800');
                this.connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Error';
                break;
            case 'loading':
                this.connectionStatus.classList.add('bg-yellow-100', 'text-yellow-800');
                this.connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Loading...';
                break;
            default:
                this.connectionStatus.classList.add('bg-gray-100', 'text-gray-800');
        }
    }
    
    /**
     * Show notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type ('success', 'error', 'info')
     */
    showNotification(message, type = 'success') {
        // Create notification element if doesn't exist
        let notification = document.querySelector('.kitchen-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'kitchen-notification';
            document.body.appendChild(notification);
        }
        
        // Set type class
        notification.className = `kitchen-notification ${type}`;
        
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
     * Set up WebSocket connection for real-time updates
     * This will be implemented in the realtime_updates task
     */
    setupWebSocketConnection() {
        // This is a placeholder that will be implemented in the realtime_updates task
        console.log('WebSocket connection will be implemented in the realtime_updates task');
    }
}
EOF
echo "Kitchen view JavaScript created."

echo "Task completed: Implement Kitchen View JavaScript"
exit 0