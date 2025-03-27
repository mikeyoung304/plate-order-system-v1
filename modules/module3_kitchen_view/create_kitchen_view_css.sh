#!/bin/bash

# Task: Create Kitchen View CSS
# This script creates the CSS styles for the kitchen view

echo "Starting task: Create Kitchen View CSS"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
CSS_DIR="$PROJECT_ROOT/app/static/css"
KITCHEN_VIEW_CSS="$CSS_DIR/kitchen-view.css"

# Create the kitchen view CSS
echo "Creating kitchen view CSS..."
cat > "$KITCHEN_VIEW_CSS" << 'EOF'
/* Kitchen View CSS */

/* Layout */
.kitchen-view {
    min-height: calc(100vh - 64px);
    padding-bottom: 80px; /* Space for footer */
    position: relative;
}

/* Order Container Layouts */
.orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
    padding-bottom: 1rem;
}

.orders-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.orders-list .order-card {
    display: flex;
    flex-direction: row;
    height: auto;
}

.orders-list .order-card-header {
    flex: 0 0 180px;
    border-right: 1px solid #e5e7eb;
    border-bottom: none;
}

.orders-list .order-card-body {
    flex: 1;
    padding: 0.75rem;
}

.orders-list .order-card-footer {
    flex: 0 0 200px;
    border-top: none;
    border-left: 1px solid #e5e7eb;
    justify-content: flex-end;
}

/* Empty state */
.orders-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    grid-column: 1 / -1;
}

/* Order Cards */
.order-card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.order-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Card status indicators */
.order-card[data-status="pending"] {
    border-left: 4px solid var(--color-warning);
}

.order-card[data-status="in-progress"] {
    border-left: 4px solid var(--color-primary);
}

.order-card[data-status="ready"] {
    border-left: 4px solid var(--color-success);
}

.order-card[data-status="completed"] {
    border-left: 4px solid var(--color-info);
    opacity: 0.7;
}

/* Card Header */
.order-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

.order-table {
    font-weight: 600;
    font-size: 1.125rem;
}

.order-time {
    font-size: 0.875rem;
    color: #6b7280;
}

.order-time.time-warning {
    color: var(--color-warning);
}

.order-time.time-critical {
    color: var(--color-danger);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.order-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    text-transform: capitalize;
    background-color: #f3f4f6;
}

.order-status[data-status="pending"] {
    background-color: #fef3c7;
    color: #92400e;
}

.order-status[data-status="in-progress"] {
    background-color: #e0e7ff;
    color: #4338ca;
}

.order-status[data-status="ready"] {
    background-color: #d1fae5;
    color: #065f46;
}

.order-status[data-status="completed"] {
    background-color: #e5e7eb;
    color: #374151;
}

/* Card Body */
.order-card-body {
    padding: 1rem;
    flex-grow: 1;
}

.order-flag-note {
    background-color: #fee2e2;
    border-left: 3px solid #ef4444;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    color: #b91c1c;
}

.order-items {
    font-size: 0.9375rem;
    line-height: 1.5;
}

.order-item {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px dashed #e5e7eb;
}

.order-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.order-item-quantity {
    font-weight: 600;
    margin-right: 0.25rem;
}

.order-item-notes {
    font-size: 0.8125rem;
    color: #6b7280;
    margin-top: 0.25rem;
    margin-left: 1.5rem;
    font-style: italic;
}

/* Card Footer */
.order-card-footer {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

/* Footer Stats */
footer.fixed {
    background-color: white;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
    z-index: 10;
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 600;
}

.stat-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.text-warning {
    color: var(--color-warning);
}

.text-primary {
    color: var(--color-primary);
}

.text-success {
    color: var(--color-success);
}

/* View Toggle Buttons */
.btn-view-toggle {
    background-color: transparent;
    color: #6b7280;
    transition: all 0.2s ease;
}

.btn-view-toggle.active {
    background-color: #4f46e5;
    color: white;
}

/* Notification */
.kitchen-notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 1rem;
    z-index: 50;
    max-width: 24rem;
    transform: translateY(-1rem);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.kitchen-notification.show {
    transform: translateY(0);
    opacity: 1;
}

.kitchen-notification.success {
    border-left: 4px solid var(--color-success);
}

.kitchen-notification.error {
    border-left: 4px solid var(--color-danger);
}

.kitchen-notification.info {
    border-left: 4px solid var(--color-info);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .orders-grid {
        grid-template-columns: 1fr;
    }
    
    .orders-list .order-card {
        flex-direction: column;
    }
    
    .orders-list .order-card-header,
    .orders-list .order-card-body,
    .orders-list .order-card-footer {
        width: 100%;
        border: none;
    }
    
    .orders-list .order-card-header {
        border-bottom: 1px solid #e5e7eb;
    }
    
    .orders-list .order-card-footer {
        border-top: 1px solid #e5e7eb;
        justify-content: space-between;
    }
    
    footer .flex {
        flex-wrap: wrap;
    }
    
    .stat {
        margin-right: 1rem;
    }
}

/* CSS Variables */
:root {
    --color-primary: #4f46e5;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-info: #3b82f6;
}
EOF
echo "Kitchen view CSS created."

echo "Task completed: Create Kitchen View CSS"
exit 0