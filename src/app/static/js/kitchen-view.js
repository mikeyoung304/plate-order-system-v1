/**
 * Enhanced Kitchen Display System (KDS) JavaScript
 * Handles the kitchen display system functionality with real-time updates
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the kitchen view
    initKitchenView();
});

/**
 * Initialize the kitchen view
 */
function initKitchenView() {
    console.log('Initializing Kitchen Display System');
    
    // Initialize UI elements
    initUIElements();
    
    // Load orders
    loadOrders();
    
    // Set up WebSocket connection for real-time updates
    setupWebSocket();
    
    // Set up auto-refresh every 30 seconds
    setInterval(loadOrders, 30000);
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
    refreshBtn.addEventListener('click', function() {
        showNotification('Refreshing orders...', 'info');
        loadOrders();
    });
    
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
    
    // Edit modal
    const editModal = document.getElementById('edit-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    const confirmEdit = document.getElementById('confirm-edit');
    
    if (closeEditModal) {
        closeEditModal.addEventListener('click', function() {
            editModal.classList.add('hidden');
        });
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', function() {
            editModal.classList.add('hidden');
        });
    }
    
    if (confirmEdit) {
        confirmEdit.addEventListener('click', function() {
            const orderId = editModal.dataset.orderId;
            const details = document.getElementById('edit-transcription').value;
            
            updateOrderDetails(orderId, details);
            editModal.classList.add('hidden');
        });
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Refresh on F5 or Ctrl+R
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            loadOrders();
        }
        
        // Toggle fullscreen on F11
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Close modals on Escape
        if (e.key === 'Escape') {
            if (!flagModal.classList.contains('hidden')) {
                flagModal.classList.add('hidden');
            }
            if (editModal && !editModal.classList.contains('hidden')) {
                editModal.classList.add('hidden');
            }
        }
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
    fetch('/api/orders/active')
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
    
    // Sort orders by status and time
    orders.sort((a, b) => {
        // First by status priority
        const statusPriority = {
            'pending': 0,
            'in_progress': 1,
            'ready': 2,
            'completed': 3
        };
        
        const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by creation time (newest first for pending, oldest first for others)
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        
        if (a.status === 'pending') {
            return bTime - aTime; // Newest pending orders first
        } else {
            return aTime - bTime; // Oldest in-progress/ready orders first
        }
    });
    
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
    
    // Set header info with table and seat
    const tableText = order.table_id ? `Table ${order.table_id}` : 'No Table';
    const seatText = order.seat ? ` - Seat ${order.seat}` : '';
    orderCard.querySelector('.order-table').textContent = tableText + seatText;
    
    // Format time and calculate time elapsed
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - orderTime) / 60000);
    
    let timeDisplay = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (elapsedMinutes > 0) {
        timeDisplay += ` (${elapsedMinutes}m ago)`;
        
        // Add warning class if order is taking too long
        if ((order.status === 'pending' && elapsedMinutes > 5) || 
            (order.status === 'in_progress' && elapsedMinutes > 15)) {
            orderCard.classList.add('time-warning');
        }
    }
    
    orderCard.querySelector('.order-time').textContent = timeDisplay;
    
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
    
    // Add edit button for all orders
    addButton(footer, 'Edit', 'btn-secondary', () => showEditModal(order));
    
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
 * Enhanced to handle different formats from voice transcription
 */
function parseOrderItems(details) {
    if (!details) return ['No details available'];
    
    // Try to intelligently parse the order details
    // Split by common separators and clean up
    let items = [];
    
    // First try to split by newlines
    if (details.includes('\n')) {
        items = details.split('\n').filter(item => item.trim() !== '');
    } 
    // Then try to split by periods at the end of sentences
    else if (details.includes('. ')) {
        items = details.split('. ').filter(item => item.trim() !== '');
        // Add period back to each item except the last one if it doesn't have one
        items = items.map((item, index) => {
            if (index < items.length - 1 && !item.endsWith('.')) {
                return item + '.';
            }
            return item;
        });
    }
    // Then try to split by "and" or commas
    else if (details.includes(' and ') || details.includes(', ')) {
        // Replace " and " with ", " for consistent splitting
        const normalizedDetails = details.replace(/ and /g, ', ');
        items = normalizedDetails.split(', ').filter(item => item.trim() !== '');
    }
    // If no clear separators, just use the whole text
    else {
        items = [details];
    }
    
    // Clean up items
    return items.map(item => {
        // Capitalize first letter
        return item.trim().charAt(0).toUpperCase() + item.trim().slice(1);
    });
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, status) {
    console.log(`Updating order ${orderId} to ${status}`);
    
    fetch(`/api/orders/${orderId}`, {
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
        const statusText = status.replace('_', ' ');
        showNotification(`Order ${orderId} updated to ${statusText}`, 'success');
        
        // Play sound based on status
        playStatusSound(status);
    })
    .catch(error => {
        console.error('Error updating order:', error);
        showNotification(`Error: ${error.message}`, 'error');
    });
}

/**
 * Update order details
 */
function updateOrderDetails(orderId, details) {
    console.log(`Updating order ${orderId} details`);
    
    fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            details: details
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update order details');
        }
        return response.json();
    })
    .then(updatedOrder => {
        // Reload orders to reflect changes
        loadOrders();
        
        // Show notification
        showNotification(`Order ${orderId} details updated`, 'success');
    })
    .catch(error => {
        console.error('Error updating order details:', error);
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
    
    // Focus on notes field
    setTimeout(() => {
        document.getElementById('flag-notes').focus();
    }, 100);
}

/**
 * Show edit modal for an order
 */
function showEditModal(order) {
    const editModal = document.getElementById('edit-modal');
    if (!editModal) return;
    
    editModal.dataset.orderId = order.id;
    editModal.classList.remove('hidden');
    
    // Set current details
    const editTranscription = document.getElementById('edit-transcription');
    editTranscription.value = order.details || '';
    
    // Focus on text area
    setTimeout(() => {
        editTranscription.focus();
    }, 100);
}

/**
 * Flag an order
 */
function flagOrder(orderId, reason, notes) {
    console.log(`Flagging order ${orderId}: ${reason} - ${notes}`);
    
    // Format the flag text based on reason
    let flagText = '';
    switch (reason) {
        case 'out-of-stock':
            flagText = 'Out of Stock';
            break;
        case 'clarification-needed':
            flagText = 'Needs Clarification';
            break;
        case 'special-request':
            flagText = 'Special Request';
            break;
        case 'other':
            flagText = 'Issue';
            break;
    }
    
    if (notes) {
        flagText += `: ${notes}`;
    }
    
    fetch(`/api/orders/${orderId}`, {
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
        showNotification(`Order ${orderId} flagged: ${reason}`, 'warning');
        
        // Play alert sound
        playSound('alert');
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
    
    // Update document title with counts
    document.title = `KDS (${pendingCount}/${inProgressCount}/${readyCount})`;
    
    // Flash title if there are new orders
    if (pendingCount > 0) {
        flashTitle(`KDS (${pendingCount} New)`);
    }
}

/**
 * Flash the page title to draw attention
 */
function flashTitle(newTitle) {
    const originalTitle = 'Kitchen Display System';
    let titleInterval;
    
    // Only start flashing if we're not already flashing
    if (!window.isTitleFlashing) {
        window.isTitleFlashing = true;
        
        titleInterval = setInterval(() => {
            document.title = document.title === originalTitle ? newTitle : originalTitle;
        }, 1000);
        
        // Stop flashing when the window gets focus
        window.addEventListener('focus', function stopFlashing() {
            clearInterval(titleInterval);
            document.title = originalTitle;
            window.isTitleFlashing = false;
            window.removeEventListener('focus', stopFlashing);
        });
    }
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
            showNotification('Could not enter fullscreen mode', 'error');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Play a sound based on status change
 */
function playStatusSound(status) {
    switch (status) {
        case 'in_progress':
            playSound('start');
            break;
        case 'ready':
            playSound('ready');
            break;
        case 'completed':
            playSound('complete');
            break;
    }
}

/**
 * Play a sound effect
 */
function playSound(soundType) {
    // Check if audio is supported and enabled
    if (!window.Audio) return;
    
    // Create audio element if it doesn't exist
    if (!window.kdsAudio) {
        window.kdsAudio = new Audio();
    }
    
    // Set the source based on sound type
    switch (soundType) {
        case 'start':
            window.kdsAudio.src = '/static/sounds/start.mp3';
            break;
        case 'ready':
            window.kdsAudio.src = '/static/sounds/ready.mp3';
            break;
        case 'complete':
            window.kdsAudio.src = '/static/sounds/complete.mp3';
            break;
        case 'alert':
            window.kdsAudio.src = '/static/sounds/alert.mp3';
            break;
        default:
            window.kdsAudio.src = '/static/sounds/notification.mp3';
    }
    
    // Play the sound
    window.kdsAudio.play().catch(e => {
        console.log('Could not play audio:', e);
    });
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
        
        try {
            const data = JSON.parse(event.data);
            
            // Handle different message types
            if (data.type === 'order_update') {
                // Reload orders
                loadOrders();
                
                // Show notification
                showNotification(`Order ${data.order_id} updated`, 'info');
                
                // Play notification sound
                playSound('notification');
            } else if (data.type === 'new_order') {
                // Reload orders
                loadOrders();
                
                // Show notification
                showNotification('New order received!', 'success');
                
                // Play notification sound
                playSound('start');
            }
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
            
            // Fallback for non-JSON messages
            if (event.data.includes('order_update')) {
                loadOrders();
                showNotification('Order updated', 'info');
            } else if (event.data.includes('new_order')) {
                loadOrders();
                showNotification('New order received!', 'success');
            }
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