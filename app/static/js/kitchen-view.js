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
    
    // Order filter
    const orderFilter = document.getElementById('order-filter');
    orderFilter.addEventListener('change', function() {
        filterOrders(orderFilter.value);
        localStorage.setItem('kitchen-filter', orderFilter.value);
    });
    
    // Restore filter preference from localStorage
    const savedFilter = localStorage.getItem('kitchen-filter');
    if (savedFilter) {
        orderFilter.value = savedFilter;
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.addEventListener('click', loadOrders);
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Flag modal
    const flagModal = document.getElementById('flag-modal');
    const closeFlagModal = document.getElementById('close-flag-modal');
    const cancelFlag = document.getElementById('cancel-flag');
    const confirmFlag = document.getElementById('confirm-flag');
    
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

/**
 * Load orders from the API
 */
function loadOrders() {
    console.log('Loading orders');
    
    // Show loading state
    const ordersContainer = document.getElementById('orders-container');
    ordersContainer.innerHTML = '<div class="loading">Loading orders...</div>';
    
    // Fetch orders from API
    fetch('/orders/active')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load orders');
            }
            return response.json();
        })
        .then(orders => {
            displayOrders(orders);
            updateOrderCounts(orders);
            
            // Apply current filter
            const orderFilter = document.getElementById('order-filter');
            filterOrders(orderFilter.value);
            
            // Show empty state if no orders
            const emptyState = document.querySelector('.orders-empty');
            if (orders.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersContainer.innerHTML = `<div class="error">Error loading orders: ${error.message}</div>`;
        });
}

/**
 * Display orders in the container
 */
function displayOrders(orders) {
    const ordersContainer = document.getElementById('orders-container');
    const template = document.getElementById('order-card-template');
    
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
    
    fetch(`/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status: status
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update order');
        }
        return response.json();
    })
    .then(updatedOrder => {
        // Reload orders to reflect changes
        loadOrders();
        
        // Show notification
        showNotification(`Order ${orderId} updated to ${status.replace('_', ' ')}`);
    })
    .catch(error => {
        console.error('Error updating order:', error);
        showNotification(`Error: ${error.message}`, 'error');
    });
}

/**
 * Show flag modal for an order
 */
function showFlagModal(orderId) {
    const flagModal = document.getElementById('flag-modal');
    flagModal.dataset.orderId = orderId;
    flagModal.classList.remove('hidden');
    
    // Reset form
    document.getElementById('flag-reason').value = 'out-of-stock';
    document.getElementById('flag-notes').value = '';
}

/**
 * Flag an order
 */
function flagOrder(orderId, reason, notes) {
    console.log(`Flagging order ${orderId}: ${reason} - ${notes}`);
    
    const flagText = notes ? `${reason}: ${notes}` : reason;
    
    fetch(`/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            flagged: flagText
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to flag order');
        }
        return response.json();
    })
    .then(updatedOrder => {
        // Reload orders to reflect changes
        loadOrders();
        
        // Show notification
        showNotification(`Order ${orderId} flagged: ${reason}`);
    })
    .catch(error => {
        console.error('Error flagging order:', error);
        showNotification(`Error: ${error.message}`, 'error');
    });
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
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('in-progress-count').textContent = inProgressCount;
    document.getElementById('ready-count').textContent = readyCount;
    document.getElementById('total-count').textContent = totalCount;
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
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = function(e) {
        console.log('WebSocket connection established');
        connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Connected';
        connectionStatus.className = 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800';
    };
    
    socket.onmessage = function(event) {
        console.log('Message from server:', event.data);
        
        // Check if it's an order update
        if (event.data.includes('order_update')) {
            loadOrders();
            showNotification('Order updated');
        }
    };
    
    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`);
        } else {
            console.error('WebSocket connection died');
        }
        
        connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Disconnected';
        connectionStatus.className = 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
        
        // Try to reconnect after a delay
        setTimeout(setupWebSocket, 5000);
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Error';
        connectionStatus.className = 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
    };
}

/**
 * Show a notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}