#!/bin/bash

# Task: Create Server View Template
# This script creates the server view template for iPad

echo "Starting task: Create Server View Template"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
TEMPLATES_DIR="$PROJECT_ROOT/app/templates"
SERVER_VIEW_TEMPLATE="$TEMPLATES_DIR/server-view.html"

# Create the server view template
echo "Creating server view template..."
cat > "$SERVER_VIEW_TEMPLATE" << 'EOF'
{% extends "base.html" %}

{% block title %}Server View - Plate Order System{% endblock %}

{% block meta_description %}Server view for managing tables and taking orders{% endblock %}

{% block head_extra %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/server-view.css') }}">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
{% endblock %}

{% block content %}
<div class="server-view">
    <!-- Header -->
    <header class="bg-white shadow-md p-4 mb-4 rounded-lg flex justify-between items-center">
        <h1 class="text-2xl font-bold">Server View</h1>
        <div class="flex space-x-2">
            <span class="text-gray-600">Server: <span class="font-semibold">John Doe</span></span>
            <button id="refresh-btn" class="btn btn-secondary text-sm py-1 px-3">
                <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
            </button>
        </div>
    </header>

    <!-- Main content -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Floor Plan Section -->
        <div class="md:col-span-2">
            <div class="bg-white shadow-md rounded-lg p-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Floor Plan</h2>
                    <div class="flex space-x-2">
                        <button id="zoom-in-btn" class="btn btn-secondary text-sm py-1 px-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                        <button id="zoom-out-btn" class="btn btn-secondary text-sm py-1 px-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="floor-plan-container" class="floor-plan h-96 relative">
                    <!-- Tables will be dynamically added here -->
                </div>
            </div>
        </div>

        <!-- Order Section -->
        <div class="md:col-span-1">
            <div class="bg-white shadow-md rounded-lg p-4">
                <h2 class="text-xl font-semibold mb-4">Current Order</h2>
                
                <div id="no-table-selected" class="text-center py-8 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>Select a table to start an order</p>
                </div>
                
                <div id="table-selected" class="hidden">
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="font-semibold">Table: </span>
                                <span id="selected-table-number">1</span>
                            </div>
                            <div>
                                <span class="font-semibold">Guests: </span>
                                <span id="selected-table-guests">4</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="font-semibold mb-2">Order Items</h3>
                        <ul id="order-items" class="space-y-2">
                            <!-- Order items will be dynamically added here -->
                        </ul>
                    </div>
                    
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold">Total:</span>
                            <span id="order-total" class="font-bold">$0.00</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button id="voice-order-btn" class="btn btn-primary flex-grow">
                            <svg class="w-5 h-5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                            </svg>
                            Voice Order
                        </button>
                        <button id="submit-order-btn" class="btn btn-secondary flex-grow">Submit Order</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Voice Recorder Modal -->
<div id="voice-recorder-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div class="flex justify-between items-center border-b px-6 py-4">
            <h3 class="text-lg font-semibold">Voice Order</h3>
            <button id="close-voice-modal" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div class="px-6 py-4">
            <div class="text-center mb-4">
                <div id="recording-indicator" class="w-24 h-24 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-2">
                    <div id="recording-pulse" class="w-16 h-16 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                    </div>
                </div>
                <p id="recording-status">Press the button to start recording</p>
            </div>
            
            <div id="transcription-container" class="mb-4 p-3 bg-gray-50 rounded-lg hidden">
                <h4 class="font-semibold mb-2">Transcription:</h4>
                <p id="transcription-text" class="text-gray-700"></p>
            </div>
            
            <div class="flex justify-center space-x-4">
                <button id="start-recording-btn" class="btn btn-primary">
                    <svg class="w-5 h-5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    Start Recording
                </button>
                <button id="stop-recording-btn" class="btn btn-secondary hidden">
                    <svg class="w-5 h-5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                    </svg>
                    Stop Recording
                </button>
            </div>
            
            <div class="mt-4 flex justify-end">
                <button id="add-to-order-btn" class="btn btn-primary hidden">Add to Order</button>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/components/floor-plan/FloorPlan.js') }}" type="module"></script>
<script src="{{ url_for('static', filename='js/components/voice/VoiceRecorder.js') }}" type="module"></script>
<script src="{{ url_for('static', filename='js/server-view.js') }}" type="module"></script>
{% endblock %}
EOF
echo "Server view template created."

# Add route to main.py if it doesn't exist
if ! grep -q "server-view" "$PROJECT_ROOT/main.py"; then
    echo "Adding server view route to main.py..."
    
    # Find the line number of the last route
    LAST_ROUTE_LINE=$(grep -n "@app.get" "$PROJECT_ROOT/main.py" | tail -1 | cut -d: -f1)
    
    # Insert the new route after the last route
    sed -i '' "${LAST_ROUTE_LINE}a\\
# Server view route\\
@app.get(\"/server-view\")\\
async def server_view(request: Request):\\
    return templates.TemplateResponse(\"server-view.html\", {\"request\": request})\\
" "$PROJECT_ROOT/main.py"
    
    echo "Server view route added to main.py."
fi

echo "Task completed: Create Server View Template"
exit 0