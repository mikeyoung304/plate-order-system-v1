#!/bin/bash

# Script to automatically fix issues and restart the server

echo "Starting auto-fix and restart script..."

# Function to restart the server
restart_server() {
    echo "Restarting server..."
    # Kill any existing server processes
    pkill -f "python run.py" || true
    # Start the server in the background
    python run.py &
    # Wait for server to start
    sleep 5
    echo "Server restarted."
}

# Function to fix main.py
fix_main_py() {
    echo "Fixing main.py..."
    # Create a backup
    cp main.py main.py.bak
    
    # Fix the route handlers
    sed -i '' '84,90c\
# Residents route\
@app.get("/residents")\
async def residents(request: Request):\
    return templates.TemplateResponse("residents.html", {"request": request})\
\
# Server view route\
@app.get("/server-view")\
async def server_view(request: Request):\
    return templates.TemplateResponse("server-view.html", {"request": request})\
\
# Kitchen view route\
@app.get("/kitchen-view")\
async def kitchen_view(request: Request):\
    return templates.TemplateResponse("kitchen-view.html", {"request": request})' main.py
    
    echo "main.py fixed."
}

# Function to create kitchen-view.html if it doesn't exist
create_kitchen_view_html() {
    if [ ! -f "app/templates/kitchen-view.html" ]; then
        echo "Creating kitchen-view.html..."
        mkdir -p app/templates
        cat > app/templates/kitchen-view.html << 'EOF'
{% extends "base.html" %}

{% block title %}Kitchen View - Plate Order System{% endblock %}

{% block meta_description %}Kitchen display system for managing and tracking orders{% endblock %}

{% block head_extra %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/kitchen-view.css') }}">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
{% endblock %}

{% block content %}
<div class="kitchen-view">
    <!-- Header -->
    <header class="bg-white shadow-md p-4 mb-4 rounded-lg flex flex-col md:flex-row justify-between items-center">
        <h1 class="text-2xl font-bold mb-2 md:mb-0">Kitchen Display System</h1>
        <div class="flex flex-wrap gap-2 items-center">
            <div class="flex bg-gray-100 rounded-lg overflow-hidden">
                <button id="grid-view-btn" class="btn-view-toggle active px-3 py-1.5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                    </svg>
                </button>
                <button id="list-view-btn" class="btn-view-toggle px-3 py-1.5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
            <select id="order-filter" class="bg-gray-100 border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="all">All Orders</option>
                <option value="pending" selected>Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="ready">Ready</option>
            </select>
            <button id="fullscreen-btn" class="btn btn-secondary text-sm py-1.5 px-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
                </svg>
            </button>
            <button id="refresh-btn" class="btn btn-primary text-sm py-1.5 px-3">
                <svg class="w-5 h-5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
            </button>
        </div>
    </header>

    <!-- Main content -->
    <div id="orders-container" class="orders-grid">
        <!-- Orders will be dynamically added here -->
        <div class="orders-empty hidden">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-center text-gray-500">No orders to display</p>
        </div>
    </div>

    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white shadow-md-up p-3 flex justify-between items-center">
        <div class="flex space-x-6">
            <div class="stat">
                <span id="pending-count" class="stat-value text-warning">0</span>
                <span class="stat-label">Pending</span>
            </div>
            <div class="stat">
                <span id="in-progress-count" class="stat-value text-primary">0</span>
                <span class="stat-label">In Progress</span>
            </div>
            <div class="stat">
                <span id="ready-count" class="stat-value text-success">0</span>
                <span class="stat-label">Ready</span>
            </div>
            <div class="stat">
                <span id="total-count" class="stat-value">0</span>
                <span class="stat-label">Total</span>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <span id="connection-status" class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Connected
            </span>
        </div>
    </footer>
</div>

<!-- Flag Order Modal -->
<div id="flag-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div class="flex justify-between items-center border-b px-6 py-4">
            <h3 class="text-lg font-semibold">Flag Order</h3>
            <button id="close-flag-modal" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div class="px-6 py-4">
            <p class="mb-4">Please provide a reason for flagging this order:</p>
            <select id="flag-reason" class="w-full p-2 border border-gray-300 rounded-md mb-4">
                <option value="out-of-stock">Item Out of Stock</option>
                <option value="clarification">Need Clarification</option>
                <option value="substitution">Substitution Required</option>
                <option value="dietary-concern">Dietary Concern</option>
                <option value="other">Other</option>
            </select>
            <textarea id="flag-notes" class="w-full p-2 border border-gray-300 rounded-md mb-4" placeholder="Additional notes..." rows="3"></textarea>
            <div class="flex justify-end space-x-2">
                <button id="cancel-flag" class="btn btn-secondary">Cancel</button>
                <button id="confirm-flag" class="btn btn-primary">Confirm</button>
            </div>
        </div>
    </div>
</div>

<!-- Order Card Template (hidden, used for cloning) -->
<template id="order-card-template">
    <div class="order-card" data-order-id="" data-status="">
        <div class="order-card-header">
            <span class="order-table">Table 1</span>
            <span class="order-time">12:34 PM</span>
            <span class="order-status">Pending</span>
        </div>
        <div class="order-card-body">
            <div class="order-flag-note hidden"></div>
            <div class="order-items"></div>
        </div>
        <div class="order-card-footer">
            <!-- Buttons will be added dynamically based on status -->
        </div>
    </div>
</template>
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/kitchen-view.js') }}"></script>
{% endblock %}
EOF
        echo "kitchen-view.html created."
    else
        echo "kitchen-view.html already exists."
    fi
}

# Function to create kitchen-view.js if it doesn't exist
create_kitchen_view_js() {
    if [ ! -f "app/static/js/kitchen-view.js" ]; then
        echo "Creating kitchen-view.js..."
        mkdir -p app/static/js
        cat > app/static/js/kitchen-view.js << 'EOF'
/**
 * Kitchen View JavaScript
 * Handles the kitchen display system functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the kitchen view
    initKitchenView();
});

/**
 * Initialize the kitchen view
 */
function initKitchenView() {
    console.log('Initializing Kitchen View');
    
    // Initialize UI elements
    initUIElements();
    
    // Load orders
    loadOrders();
    
    // Set up WebSocket connection for real-time updates
    setupWebSocket();
}

/**
 * Initialize UI elements and event listeners
 */
function initUIElements() {
    // View toggle buttons
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const ordersContainer = document.getElementById('orders-container');
    
    if (gridViewBtn && listViewBtn && ordersContainer) {
        gridViewBtn.addEventListener('click', function() {
            ordersContainer.className = 'orders-grid';
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            localStorage.setItem('kitchen-view-mode', 'grid');
        });
        
        listViewBtn.addEventListener('click', function() {
            ordersContainer.className = 'orders-list';
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            localStorage.setItem('kitchen-view-mode', 'list');
        });
        
        // Restore view preference from localStorage
        const viewMode = localStorage.getItem('kitchen-view-mode');
        if (viewMode === 'list') {
            listViewBtn.click();
        }
    }
    
    // Order filter
    const orderFilter = document.getElementById('order-filter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function() {
            filterOrders(orderFilter.value);
            localStorage.setItem('kitchen-filter', orderFilter.value);
        });
        
        // Restore filter preference from localStorage
        const savedFilter = localStorage.getItem('kitchen-filter');
        if (savedFilter) {
            orderFilter.value = savedFilter;
        }
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrders);
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Flag modal
    const flagModal = document.getElementById('flag-modal');
    const closeFlagModal = document.getElementById('close-flag-modal');
    const cancelFlag = document.getElementById('cancel-flag');
    const confirmFlag = document.getElementById('confirm-flag');
    
    if (flagModal && closeFlagModal && cancelFlag && confirmFlag) {
        closeFlagModal.addEventListener('click', function() {
            flagModal.classList.add('hidden');
        });
        
        cancelFlag.addEventListener('click', function() {
            flagModal.classList.add('hidden');
        });
        
        confirmFlag.addEventListener('click', function() {
            const orderId = flagModal.dataset.orderId;
            const reason = document.getElementById('flag-reason').value;
            const notes = document.getElementById('flag-notes').value;
            
            flagOrder(orderId, reason, notes);
            flagModal.classList.add('hidden');
        });
    }
}

/**
 * Load orders from the API
 */
function loadOrders() {
    console.log('Loading orders');
    
    // Show loading state
    const ordersContainer = document.getElementById('orders-container');
    if (ordersContainer) {
        ordersContainer.innerHTML = '<div class="loading">Loading orders...</div>';
    }
    
    // For MVP, create some sample orders
    const sampleOrders = [
        {
            id: 1,
            table_id: 3,
            status: 'pending',
            details: 'Table 3:\n1 cheeseburger with fries\n1 chicken sandwich\n1 diet coke',
            created_at: new Date(Date.now() - 5 * 60000).toISOString(),
            flagged: null
        },
        {
            id: 2,
            table_id: 5,
            status: 'in_progress',
            details: 'Table 5:\n2 grilled chicken salads\n1 water',
            created_at: new Date(Date.now() - 15 * 60000).toISOString(),
            flagged: null
        },
        {
            id: 3,
            table_id: 8,
            status: 'ready',
            details: 'Table 8:\n1 soup of the day\n1 fish special\n2 iced teas',
            created_at: new Date(Date.now() - 25 * 60000).toISOString(),
            flagged: null
        },
        {
            id: 4,
            table_id: 2,
            status: 'pending',
            details: 'Table 2:\n1 veggie burger no onions\n1 side salad with dressing on the side\n1 lemonade',
            created_at: new Date(Date.now() - 2 * 60000).toISOString(),
            flagged: 'dietary-concern: Customer has gluten allergy'
        }
    ];
    
    // Display the sample orders
    displayOrders(sampleOrders);
    updateOrderCounts(sampleOrders);
    
    // Apply current filter
    const orderFilter = document.getElementById('order-filter');
    if (orderFilter) {
        filterOrders(orderFilter.value);
    }
    
    // Show empty state if no orders
    const emptyState = document.querySelector('.orders-empty');
    if (emptyState) {
        if (sampleOrders.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }
}

/**
 * Display orders in the container
 */
function displayOrders(orders) {
    const ordersContainer = document.getElementById('orders-container');
    const template = document.getElementById('order-card-template');
    
    if (!ordersContainer || !template) {
        console.error('Missing required elements');
        return;
    }
    
    // Clear container
    ordersContainer.innerHTML = '';
    
    // Add each order
    orders.forEach(order => {
        const orderCard = createOrderCard(order, template);
        ordersContainer.appendChild(orderCard);
    });
}

/**
 * Create an order card from template
 */
function createOrderCard(order, template) {
    // Clone the template
    const orderCard = template.content.cloneNode(true).querySelector('.order-card');
    
    // Set order data
    orderCard.dataset.orderId = order.id;
    orderCard.dataset.status = order.status;
    orderCard.classList.add(`status-${order.status}`);
    
    // Set header info
    orderCard.querySelector('.order-table').textContent = order.table_id ? `Table ${order.table_id}` : 'No Table';
    
    // Format time
    const orderTime = new Date(order.created_at);
    orderCard.querySelector('.order-time').textContent = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Set status
    const statusText = order.status.replace('_', ' ');
    orderCard.querySelector('.order-status').textContent = statusText.charAt(0).toUpperCase() + statusText.slice(1);
    
    // Set order items
    const orderItems = orderCard.querySelector('.order-items');
    const items = parseOrderItems(order.details);
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.textContent = item;
        orderItems.appendChild(itemElement);
    });
    
    // Set flag note if flagged
    if (order.flagged) {
        const flagNote = orderCard.querySelector('.order-flag-note');
        flagNote.textContent = order.flagged;
        flagNote.classList.remove('hidden');
    }
    
    // Add action buttons based on status
    const footer = orderCard.querySelector('.order-card-footer');
    
    if (order.status === 'pending') {
        addButton(footer, 'Start', 'btn-primary', () => updateOrderStatus(order.id, 'in_progress'));
        addButton(footer, 'Flag', 'btn-warning', () => showFlagModal(order.id));
    } else if (order.status === 'in_progress') {
        addButton(footer, 'Ready', 'btn-success', () => updateOrderStatus(order.id, 'ready'));
        addButton(footer, 'Flag', 'btn-warning', () => showFlagModal(order.id));
    } else if (order.status === 'ready') {
        addButton(footer, 'Complete', 'btn-success', () => updateOrderStatus(order.id, 'completed'));
        addButton(footer, 'Back', 'btn-secondary', () => updateOrderStatus(order.id, 'in_progress'));
    }
    
    return orderCard;
}

/**
 * Add a button to an element
 */
function addButton(parent, text, className, clickHandler) {
    const button = document.createElement('button');
    button.className = `btn ${className}`;
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    parent.appendChild(button);
}

/**
 * Parse order details into items
 */
function parseOrderItems(details) {
    // Simple parsing - split by newlines
    return details.split('\n').filter(item => item.trim() !== '');
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, status) {
    console.log(`Updating order ${orderId} to ${status}`);
    
    // For MVP, just reload orders
    setTimeout(() => {
        loadOrders();
        showNotification(`Order ${orderId} updated to ${status.replace('_', ' ')}`);
    }, 500);
}

/**
 * Show flag modal for an order
 */
function showFlagModal(orderId) {
    const flagModal = document.getElementById('flag-modal');
    if (flagModal) {
        flagModal.dataset.orderId = orderId;
        flagModal.classList.remove('hidden');
        
        // Reset form
        const flagReason = document.getElementById('flag-reason');
        const flagNotes = document.getElementById('flag-notes');
        if (flagReason) flagReason.value = 'out-of-stock';
        if (flagNotes) flagNotes.value = '';
    }
}

/**
 * Flag an order
 */
function flagOrder(orderId, reason, notes) {
    console.log(`Flagging order ${orderId}: ${reason} - ${notes}`);
    
    // For MVP, just reload orders
    setTimeout(() => {
        loadOrders();
        showNotification(`Order ${orderId} flagged: ${reason}`);
    }, 500);
}

/**
 * Filter orders by status
 */
function filterOrders(status) {
    console.log(`Filtering orders by status: ${status}`);
    
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        if (status === 'all' || card.dataset.status === status.replace('-', '_')) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Update order counts in the footer
 */
function updateOrderCounts(orders) {
    const pendingCount = orders.filter(order => order.status === 'pending').length;
    const inProgressCount = orders.filter(order => order.status === 'in_progress').length;
    const readyCount = orders.filter(order => order.status === 'ready').length;
    const totalCount = orders.length;
    
    const pendingCountEl = document.getElementById('pending-count');
    const inProgressCountEl = document.getElementById('in-progress-count');
    const readyCountEl = document.getElementById('ready-count');
    const totalCountEl = document.getElementById('total-count');
    
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;
    if (readyCountEl) readyCountEl.textContent = readyCount;
    if (totalCountEl) totalCountEl.textContent = totalCount;
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Set up WebSocket connection for real-time updates
 */
function setupWebSocket() {
    const connectionStatus = document.getElementById('connection-status');
    
    // For MVP, simulate connected status
    if (connectionStatus) {
        connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Connected';
        connectionStatus.className = 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800';
    }
    
    // Simulate occasional updates
    setInterval(() => {
        if (Math.random() > 0.7) {
            loadOrders();
            showNotification('Order updated');
        }
    }, 30000);
}

/**
 * Show a notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '1rem';
    notification.style.right = '1rem';
    notification.style.padding = '0.75rem 1rem';
    notification.style.backgroundColor = 'white';
    notification.style.borderRadius = '0.375rem';
    notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    notification.style.borderLeft = type === 'info' ? '4px solid #3b82f6' : 
                                   type === 'success' ? '4px solid #10b981' : 
                                   '4px solid #ef4444';
    notification.style.transform = 'translateX(110%)';
    notification.style.transition = 'transform 0.3s ease-out';
    notification.style.zIndex = '100';
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(110%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
EOF
        echo "kitchen-view.js created."
    else
        echo "kitchen-view.js already exists."
    fi
}

# Function to create kitchen-view.css if it doesn't exist
create_kitchen_view_css() {
    if [ ! -f "app/static/css/kitchen-view.css" ]; then
        echo "Creating kitchen-view.css..."
        mkdir -p app/static/css
        cat > app/static/css/kitchen-view.css << 'EOF'
/**
 * Kitchen View CSS
 * Styles for the kitchen display system
 */

/* Layout */
.kitchen-view {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-bottom: 60px; /* Space for footer */
}

/* Orders Grid Layout */
.orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

/* Orders List Layout */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
}

.orders-list .order-card {
    max-width: 100%;
}

/* Order Card */
.order-card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.order-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Order Card Header */
.order-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.order-table {
    font-weight: 600;
}

.order-time {
    font-size: 0.875rem;
    color: #6b7280;
}

.order-status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
}

/* Order Card Body */
.order-card-body {
    padding: 1rem;
}

.order-flag-note {
    background-color: #fef2f2;
    color: #b91c1c;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.order-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.order-item {
    padding: 0.25rem 0;
    border-bottom: 1px dashed #e5e7eb;
}

.order-item:last-child {
    border-bottom: none;
