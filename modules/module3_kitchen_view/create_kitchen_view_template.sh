#!/bin/bash

# Task: Create Kitchen View Template
# This script creates the kitchen view template for iPad

echo "Starting task: Create Kitchen View Template"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
TEMPLATES_DIR="$PROJECT_ROOT/app/templates"
KITCHEN_VIEW_TEMPLATE="$TEMPLATES_DIR/kitchen-view.html"

# Create the kitchen view template
echo "Creating kitchen view template..."
cat > "$KITCHEN_VIEW_TEMPLATE" << 'EOF'
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
<script src="{{ url_for('static', filename='js/components/orders/OrderCard.js') }}" type="module"></script>
<script src="{{ url_for('static', filename='js/components/orders/OrderFilters.js') }}" type="module"></script>
<script src="{{ url_for('static', filename='js/kitchen-view.js') }}" type="module"></script>
{% endblock %}
EOF
echo "Kitchen view template created."

# Add route to main.py if it doesn't exist
if ! grep -q "kitchen-view" "$PROJECT_ROOT/main.py"; then
    echo "Adding kitchen view route to main.py..."
    
    # Find the line number of the last route
    LAST_ROUTE_LINE=$(grep -n "@app.get" "$PROJECT_ROOT/main.py" | tail -1 | cut -d: -f1)
    
    # Insert the new route after the last route
    sed -i '' "${LAST_ROUTE_LINE}a\\
# Kitchen view route\\
@app.get(\"/kitchen-view\")\\
async def kitchen_view(request: Request):\\
    return templates.TemplateResponse(\"kitchen-view.html\", {\"request\": request})\\
" "$PROJECT_ROOT/main.py"
    
    echo "Kitchen view route added to main.py."
fi

echo "Task completed: Create Kitchen View Template"
exit 0