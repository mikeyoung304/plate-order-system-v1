#!/bin/bash

# Task: Implement Order Card Component
# This script creates the JavaScript component for order cards in the kitchen view

echo "Starting task: Implement Order Card Component"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js/components/orders"
ORDER_CARD_JS="$JS_DIR/OrderCard.js"

# Create the components directory if it doesn't exist
mkdir -p "$JS_DIR"

# Create the order card component
echo "Creating order card component..."
cat > "$ORDER_CARD_JS" << 'EOF'
/**
 * OrderCard Component
 * Handles the creation and management of order cards in the kitchen view
 */
export class OrderCard {
    /**
     * Create a new OrderCard instance
     * @param {Object} orderData - The order data from the API
     * @param {Function} onStatusChange - Callback for when order status changes
     * @param {Function} onFlagOrder - Callback for when order is flagged
     */
    constructor(orderData, onStatusChange, onFlagOrder) {
        this.orderData = orderData;
        this.onStatusChange = onStatusChange;
        this.onFlagOrder = onFlagOrder;
        this.element = null;
    }

    /**
     * Create the order card DOM element
     * @returns {HTMLElement} The order card element
     */
    render() {
        // Clone the template
        const template = document.getElementById('order-card-template');
        const card = template.content.cloneNode(true).querySelector('.order-card');
        
        // Set data attributes
        card.dataset.orderId = this.orderData.id;
        card.dataset.status = this.orderData.status;
        
        // Format timestamps
        const createdAt = new Date(this.orderData.created_at);
        const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate time elapsed
        const now = new Date();
        const elapsedMinutes = Math.floor((now - createdAt) / 60000);
        let timeClass = '';
        
        if (elapsedMinutes >= 15) {
            timeClass = 'time-critical';
        } else if (elapsedMinutes >= 10) {
            timeClass = 'time-warning';
        }
        
        // Get table number from order details
        let tableNumber = 'N/A';
        const tableMatch = this.orderData.details?.match(/Table (\d+):/);
        if (tableMatch) {
            tableNumber = tableMatch[1];
        }
        
        // Format status for display
        const statusDisplay = this.orderData.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // Set header content
        const header = card.querySelector('.order-card-header');
        header.querySelector('.order-table').textContent = `Table ${tableNumber}`;
        
        const timeElement = header.querySelector('.order-time');
        timeElement.textContent = `${timeString} (${elapsedMinutes}m)`;
        if (timeClass) {
            timeElement.classList.add(timeClass);
        }
        
        const statusElement = header.querySelector('.order-status');
        statusElement.textContent = statusDisplay;
        statusElement.dataset.status = this.orderData.status;
        
        // Set body content
        const body = card.querySelector('.order-card-body');
        
        // Add flag note if present
        const flagNote = body.querySelector('.order-flag-note');
        if (this.orderData.flagged) {
            flagNote.textContent = this.orderData.flagged;
            flagNote.classList.remove('hidden');
        }
        
        // Format the order items
        const orderItems = body.querySelector('.order-items');
        let orderDetails = this.orderData.details || '';
        
        // Remove table prefix if present
        if (tableMatch) {
            orderDetails = orderDetails.replace(tableMatch[0], '').trim();
        }
        
        // Parse and format order items
        const items = this.parseOrderItems(orderDetails);
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            
            const itemText = document.createElement('div');
            itemText.innerHTML = `<span class="order-item-quantity">${item.quantity}x</span> ${item.name}`;
            itemElement.appendChild(itemText);
            
            if (item.notes) {
                const notesElement = document.createElement('div');
                notesElement.className = 'order-item-notes';
                notesElement.textContent = item.notes;
                itemElement.appendChild(notesElement);
            }
            
            orderItems.appendChild(itemElement);
        });
        
        // Set footer content with appropriate action buttons
        const footer = card.querySelector('.order-card-footer');
        footer.innerHTML = this.getActionButtons();
        
        // Add event listeners to buttons
        this.addEventListeners(card);
        
        this.element = card;
        return card;
    }
    
    /**
     * Parse order details text into structured items
     * @param {string} orderDetails - The order details text
     * @returns {Array} Array of order item objects
     */
    parseOrderItems(orderDetails) {
        if (!orderDetails) return [];
        
        // Split by line breaks or commas
        const lines = orderDetails.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);
        
        return lines.map(line => {
            // Try to extract quantity
            const quantityMatch = line.match(/^(\d+)x?\s+(.+)$/);
            let quantity = 1;
            let itemText = line;
            
            if (quantityMatch) {
                quantity = parseInt(quantityMatch[1], 10);
                itemText = quantityMatch[2].trim();
            }
            
            // Check for notes in parentheses or after dash/colon
            const notesMatch = itemText.match(/(.+?)(?:\s*[-:]\s*|\s*\()(.*?)(?:\))?$/);
            let name = itemText;
            let notes = '';
            
            if (notesMatch) {
                name = notesMatch[1].trim();
                notes = notesMatch[2].trim();
            }
            
            return { quantity, name, notes };
        });
    }
    
    /**
     * Get the HTML for action buttons based on order status
     * @returns {string} HTML string for action buttons
     */
    getActionButtons() {
        switch (this.orderData.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-primary start-btn" data-action="start">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Start
                    </button>
                    <button class="btn btn-sm btn-danger flag-btn" data-action="flag">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                        </svg>
                        Flag
                    </button>
                `;
            case 'in_progress':
                return `
                    <button class="btn btn-sm btn-success ready-btn" data-action="ready">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Ready
                    </button>
                    <button class="btn btn-sm btn-danger flag-btn" data-action="flag">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                        </svg>
                        Flag
                    </button>
                `;
            case 'ready':
                return `
                    <button class="btn btn-sm btn-info complete-btn" data-action="complete">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Complete
                    </button>
                    <button class="btn btn-sm btn-warning revert-btn" data-action="revert">
                        <svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                        Revert
                    </button>
                `;
            default:
                return '';
        }
    }
    
    /**
     * Add event listeners to the card buttons
     * @param {HTMLElement} card - The order card element
     */
    addEventListeners(card) {
        const buttons = card.querySelectorAll('button[data-action]');
        
        buttons.forEach(button => {
            const action = button.dataset.action;
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                switch (action) {
                    case 'start':
                        this.onStatusChange(this.orderData.id, 'in_progress');
                        break;
                    case 'ready':
                        this.onStatusChange(this.orderData.id, 'ready');
                        break;
                    case 'complete':
                        this.onStatusChange(this.orderData.id, 'completed');
                        break;
                    case 'revert':
                        this.onStatusChange(this.orderData.id, 'in_progress');
                        break;
                    case 'flag':
                        this.onFlagOrder(this.orderData.id);
                        break;
                }
            });
        });
    }
    
    /**
     * Update the order card with new data
     * @param {Object} newData - The updated order data
     */
    update(newData) {
        this.orderData = newData;
        
        if (this.element) {
            // Update status
            this.element.dataset.status = newData.status;
            
            // Update status display
            const statusElement = this.element.querySelector('.order-status');
            const statusDisplay = newData.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
            statusElement.textContent = statusDisplay;
            statusElement.dataset.status = newData.status;
            
            // Update flag note
            const flagNote = this.element.querySelector('.order-flag-note');
            if (newData.flagged) {
                flagNote.textContent = newData.flagged;
                flagNote.classList.remove('hidden');
            } else {
                flagNote.classList.add('hidden');
            }
            
            // Update footer buttons
            const footer = this.element.querySelector('.order-card-footer');
            footer.innerHTML = this.getActionButtons();
            
            // Re-add event listeners
            this.addEventListeners(this.element);
        }
    }
}
EOF
echo "Order card component created."

echo "Task completed: Implement Order Card Component"
exit 0