document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const kdsGrid = document.getElementById('kds-grid');
    const kdsFilter = document.getElementById('kds-filter');
    const kdsRefresh = document.getElementById('kds-refresh');
    const kdsStatus = document.getElementById('kds-status');
    const kdsFullscreen = document.getElementById('kds-fullscreen');
    const viewButtons = document.querySelectorAll('.kds-view-selector button');
    const pendingCount = document.getElementById('pending-count');
    const inProgressCount = document.getElementById('in-progress-count');
    const readyCount = document.getElementById('ready-count');
    const totalCount = document.getElementById('total-count');
    const flagModal = document.getElementById('flag-modal');
    const flagReason = document.getElementById('flag-reason');
    const flagNotes = document.getElementById('flag-notes');
    const confirmFlag = document.getElementById('confirm-flag');
    const cancelFlag = document.getElementById('cancel-flag');

    // State
    let orders = [];
    let currentOrderToFlag = null;
    let socket = null;
    
    // Initialize the KDS
    function init() {
        loadOrders();
        setupEventListeners();
        setupWebSocketConnection();
        
        // Auto-refresh every 60 seconds
        setInterval(loadOrders, 60000);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Filter change
        kdsFilter.addEventListener('change', () => {
            renderOrders();
        });
        
        // Manual refresh
        kdsRefresh.addEventListener('click', loadOrders);
        
        // Fullscreen toggle
        kdsFullscreen.addEventListener('click', toggleFullscreen);
        
        // View selector buttons
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const view = button.dataset.view;
                kdsGrid.className = `kds-${view}`;
                
                // Save preference
                localStorage.setItem('kds-view', view);
            });
        });
        
        // Flag modal events
        confirmFlag.addEventListener('click', submitFlagOrder);
        cancelFlag.addEventListener('click', closeFlagModal);
        
        // Close flag modal when clicking outside
        flagModal.addEventListener('click', (e) => {
            if (e.target === flagModal) {
                closeFlagModal();
            }
        });
    }
    
    // Load orders from API
    function loadOrders() {
        // Fetch orders based on filter
        let url = '/api/orders';
        const filter = kdsFilter.value;
        
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
                orders = data;
                renderOrders();
                updateStats();
                kdsStatus.textContent = 'Updated: ' + new Date().toLocaleTimeString();
                kdsStatus.className = 'status-success';
            })
            .catch(error => {
                console.error('Error loading orders:', error);
                kdsStatus.textContent = 'Error loading orders';
                kdsStatus.className = 'status-error';
            });
    }
    
    // Render orders in KDS grid
    function renderOrders() {
        kdsGrid.innerHTML = '';
        
        const filter = kdsFilter.value;
        let filteredOrders = orders;
        
        // Apply filter
        if (filter !== 'all') {
            const statusMap = {
                'pending': 'pending',
                'in-progress': 'in_progress',
                'ready': 'ready'
            };
            filteredOrders = orders.filter(order => order.status === statusMap[filter]);
        }
        
        // Display message if no orders
        if (filteredOrders.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'kds-empty';
            emptyMessage.textContent = 'No orders to display';
            kdsGrid.appendChild(emptyMessage);
            return;
        }
        
        // Sort orders: pending first, then in_progress, then ready
        const sortOrder = { 'pending': 0, 'in_progress': 1, 'ready': 2 };
        filteredOrders.sort((a, b) => {
            // First by status
            const statusDiff = sortOrder[a.status] - sortOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            
            // Then by created time (oldest first)
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        // Create cards for each order
        filteredOrders.forEach(order => {
            const card = createOrderCard(order);
            kdsGrid.appendChild(card);
        });
    }
    
    // Create an order card element
    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'kds-card';
        card.dataset.orderId = order.id;
        card.dataset.status = order.status;
        
        // Add status class
        card.classList.add(`status-${order.status.replace('_', '-')}`);
        
        // Format timestamps
        const createdAt = new Date(order.created_at);
        const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate time elapsed
        const now = new Date();
        const elapsedMinutes = Math.floor((now - createdAt) / 60000);
        let elapsedClass = '';
        
        if (elapsedMinutes >= 15) {
            elapsedClass = 'time-critical';
        } else if (elapsedMinutes >= 10) {
            elapsedClass = 'time-warning';
        }
        
        // Get table number from order details
        let tableNumber = 'N/A';
        const tableMatch = order.details.match(/Table (\d+):/);
        if (tableMatch) {
            tableNumber = tableMatch[1];
        }
        
        // Format status for display
        const statusDisplay = order.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // Format the details for display
        let orderDetails = order.details;
        if (tableMatch) {
            orderDetails = orderDetails.replace(tableMatch[0], '').trim();
        }
        
        // Create card HTML
        card.innerHTML = `
            <div class="kds-card-header">
                <span class="kds-table">Table ${tableNumber}</span>
                <span class="kds-time ${elapsedClass}">${timeString} (${elapsedMinutes}m)</span>
                <span class="kds-status">${statusDisplay}</span>
            </div>
            <div class="kds-card-body">
                ${order.flagged ? `<div class="kds-flag-note">${order.flagged}</div>` : ''}
                <p>${orderDetails}</p>
            </div>
            <div class="kds-card-footer">
                ${getActionButtons(order)}
            </div>
        `;
        
        // Add event listeners to action buttons
        addCardEventListeners(card, order);
        
        return card;
    }
    
    // Get appropriate action buttons based on order status
    function getActionButtons(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm kds-btn-start" data-action="start" data-id="${order.id}">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="btn btn-sm kds-btn-flag" data-action="flag" data-id="${order.id}">
                        <i class="fas fa-flag"></i> Flag
                    </button>
                `;
            case 'in_progress':
                return `
                    <button class="btn btn-sm kds-btn-ready" data-action="ready" data-id="${order.id}">
                        <i class="fas fa-check"></i> Ready
                    </button>
                    <button class="btn btn-sm kds-btn-flag" data-action="flag" data-id="${order.id}">
                        <i class="fas fa-flag"></i> Flag
                    </button>
                `;
            case 'ready':
                return `
                    <button class="btn btn-sm kds-btn-complete" data-action="complete" data-id="${order.id}">
                        <i class="fas fa-check-double"></i> Complete
                    </button>
                    <button class="btn btn-sm kds-btn-revert" data-action="revert" data-id="${order.id}">
                        <i class="fas fa-undo"></i> Revert
                    </button>
                `;
            default:
                return '';
        }
    }
    
    // Add event listeners to card action buttons
    function addCardEventListeners(card, order) {
        const buttons = card.querySelectorAll('button[data-action]');
        
        buttons.forEach(button => {
            const action = button.dataset.action;
            const orderId = button.dataset.id;
            
            button.addEventListener('click', () => {
                switch (action) {
                    case 'start':
                        updateOrderStatus(orderId, 'in_progress');
                        break;
                    case 'ready':
                        updateOrderStatus(orderId, 'ready');
                        break;
                    case 'complete':
                        updateOrderStatus(orderId, 'completed');
                        break;
                    case 'revert':
                        updateOrderStatus(orderId, 'in_progress');
                        break;
                    case 'flag':
                        openFlagModal(orderId);
                        break;
                }
            });
        });
    }
    
    // Update order statistics
    function updateStats() {
        // Count orders by status
        const counts = {
            pending: 0,
            in_progress: 0,
            ready: 0,
            total: orders.length
        };
        
        orders.forEach(order => {
            if (order.status === 'pending') counts.pending++;
            if (order.status === 'in_progress') counts.in_progress++;
            if (order.status === 'ready') counts.ready++;
        });
        
        // Update counter elements
        pendingCount.textContent = counts.pending;
        inProgressCount.textContent = counts.in_progress;
        readyCount.textContent = counts.ready;
        totalCount.textContent = counts.total;
    }
    
    // Update order status
    function updateOrderStatus(orderId, status) {
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
            const index = orders.findIndex(o => o.id === parseInt(orderId));
            if (index !== -1) {
                orders[index] = data;
            }
            
            // Re-render orders
            renderOrders();
            updateStats();
            
            // Send update via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'order_update',
                    order_id: orderId,
                    status: status
                }));
            }
        })
        .catch(error => {
            console.error('Error updating order:', error);
            showNotification('Error updating order status. Please try again.', 'error');
        });
    }
    
    // Open flag modal
    function openFlagModal(orderId) {
        currentOrderToFlag = orderId;
        flagReason.selectedIndex = 0;
        flagNotes.value = '';
        flagModal.classList.remove('hidden');
    }
    
    // Close flag modal
    function closeFlagModal() {
        flagModal.classList.add('hidden');
        currentOrderToFlag = null;
    }
    
    // Submit flag for order
    function submitFlagOrder() {
        if (!currentOrderToFlag) return;
        
        const reason = flagReason.value;
        const notes = flagNotes.value.trim();
        let flagMessage = reason.replace('-', ' ');
        
        if (notes) {
            flagMessage += `: ${notes}`;
        }
        
        fetch(`/api/orders/${currentOrderToFlag}`, {
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
            const index = orders.findIndex(o => o.id === parseInt(currentOrderToFlag));
            if (index !== -1) {
                orders[index] = data;
            }
            
            // Close modal
            closeFlagModal();
            
            // Re-render orders
            renderOrders();
            
            // Show notification
            showNotification('Order flagged successfully');
            
            // Send update via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'order_flag',
                    order_id: currentOrderToFlag,
                    flag: flagMessage
                }));
            }
        })
        .catch(error => {
            console.error('Error flagging order:', error);
            showNotification('Error flagging order. Please try again.', 'error');
        });
    }
    
    // Toggle fullscreen mode
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                showNotification('Error entering fullscreen mode: ' + err.message, 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    // WebSocket connection for real-time updates
    function setupWebSocketConnection() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/kds`;
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
            kdsStatus.textContent = 'Connected';
            kdsStatus.className = 'status-success';
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle different message types
                if (data.type === 'order_update' || data.type === 'order_flag') {
                    // Refresh orders data
                    loadOrders();
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        };
        
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            kdsStatus.textContent = 'Disconnected';
            kdsStatus.className = 'status-error';
            
            // Try to reconnect after 5 seconds
            setTimeout(setupWebSocketConnection, 5000);
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            kdsStatus.textContent = 'Connection Error';
            kdsStatus.className = 'status-error';
        };
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        // Create notification element if doesn't exist
        let notification = document.querySelector('.kds-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'kds-notification';
            document.body.appendChild(notification);
        }
        
        // Set type class
        notification.className = `kds-notification notification-${type}`;
        
        // Set message
        notification.textContent = message;
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Restore view preference
    function restoreViewPreference() {
        const savedView = localStorage.getItem('kds-view');
        if (savedView) {
            viewButtons.forEach(button => {
                if (button.dataset.view === savedView) {
                    button.click();
                }
            });
        }
    }
    
    // Initialize
    init();
    restoreViewPreference();
});
