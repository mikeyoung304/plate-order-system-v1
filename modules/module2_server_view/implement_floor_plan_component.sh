#!/bin/bash

# Task: Implement Floor Plan Component
# This script creates the JavaScript for the floor plan component in the server view

echo "Starting task: Implement Floor Plan Component"
echo "==========================================="

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js"
COMPONENTS_DIR="$JS_DIR/components"
FLOOR_PLAN_DIR="$COMPONENTS_DIR/floor-plan"
FLOOR_PLAN_JS="$FLOOR_PLAN_DIR/FloorPlan.js"
SERVER_VIEW_JS="$JS_DIR/server-view.js"

# Create the JS directories if they don't exist
mkdir -p "$FLOOR_PLAN_DIR"

# Create the floor plan component
echo "Creating floor plan component..."
cat > "$FLOOR_PLAN_JS" << 'EOF'
/**
 * Floor Plan Component
 * Handles the visualization and interaction with restaurant tables
 */

export class FloorPlan {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    this.options = {
      tableTypes: {
        'square-2': { width: 80, height: 80, capacity: 2 },
        'square-4': { width: 100, height: 100, capacity: 4 },
        'rectangle-4': { width: 120, height: 80, capacity: 4 },
        'rectangle-6': { width: 160, height: 80, capacity: 6 },
        'round-2': { width: 80, height: 80, capacity: 2, isRound: true },
        'round-4': { width: 100, height: 100, capacity: 4, isRound: true },
        'round-6': { width: 120, height: 120, capacity: 6, isRound: true },
        'round-8': { width: 140, height: 140, capacity: 8, isRound: true },
      },
      ...options
    };
    
    this.tables = [];
    this.selectedTable = null;
    this.onTableSelect = null;
    
    this.init();
  }
  
  /**
   * Initialize the floor plan
   */
  init() {
    // Set container styles
    this.container.style.position = 'relative';
    
    // Fetch tables from API
    this.fetchTables();
    
    // Add event listener for container clicks (deselection)
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.selectTable(null);
      }
    });
  }
  
  /**
   * Fetch tables from API
   */
  async fetchTables() {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockTables = [
        { id: 1, number: 1, type: 'square-4', x: 50, y: 50, status: 'available' },
        { id: 2, number: 2, type: 'square-4', x: 200, y: 50, status: 'available' },
        { id: 3, number: 3, type: 'square-4', x: 350, y: 50, status: 'available' },
        { id: 4, number: 4, type: 'rectangle-6', x: 50, y: 200, status: 'available' },
        { id: 5, number: 5, type: 'rectangle-6', x: 250, y: 200, status: 'occupied' },
        { id: 6, number: 6, type: 'round-4', x: 500, y: 50, status: 'available' },
        { id: 7, number: 7, type: 'round-4', x: 500, y: 200, status: 'occupied' },
        { id: 8, number: 8, type: 'round-6', x: 200, y: 350, status: 'occupied' },
      ];
      
      this.tables = mockTables;
      this.renderTables();
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  }
  
  /**
   * Render tables on the floor plan
   */
  renderTables() {
    // Clear existing tables
    this.container.innerHTML = '';
    
    // Create and add each table
    this.tables.forEach(table => {
      const tableEl = this.createTableElement(table);
      this.container.appendChild(tableEl);
    });
  }
  
  /**
   * Create a table DOM element
   * @param {Object} table - Table data
   * @returns {HTMLElement} - Table element
   */
  createTableElement(table) {
    const { id, number, type, x, y, status } = table;
    const { width, height, capacity, isRound } = this.options.tableTypes[type] || this.options.tableTypes['square-4'];
    
    // Create table element
    const tableEl = document.createElement('div');
    tableEl.className = `table absolute flex items-center justify-center font-bold text-lg 
                         ${status === 'occupied' ? 'bg-danger/20 border-danger' : 'bg-success/10 border-success'} 
                         ${isRound ? 'rounded-full' : 'rounded-md'}
                         ${this.selectedTable === id ? 'ring-4 ring-primary-500' : ''}
                         border-2 cursor-pointer hover:bg-secondary-200/50 transition-colors`;
    tableEl.style.width = `${width}px`;
    tableEl.style.height = `${height}px`;
    tableEl.style.left = `${x}px`;
    tableEl.style.top = `${y}px`;
    tableEl.dataset.tableId = id;
    tableEl.dataset.tableNumber = number;
    tableEl.dataset.tableStatus = status;
    tableEl.textContent = number;
    
    // Add click handler for table selection
    tableEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectTable(id);
    });
    
    return tableEl;
  }
  
  /**
   * Select a table
   * @param {number|null} tableId - ID of table to select, or null to deselect
   */
  selectTable(tableId) {
    this.selectedTable = tableId;
    
    // Update UI to reflect selection
    const tableElements = this.container.querySelectorAll('[data-table-id]');
    tableElements.forEach(el => {
      const id = parseInt(el.dataset.tableId);
      if (id === tableId) {
        el.classList.add('ring-4', 'ring-primary-500');
      } else {
        el.classList.remove('ring-4', 'ring-primary-500');
      }
    });
    
    // Find the selected table data
    const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;
    
    // Call the onTableSelect callback if defined
    if (typeof this.onTableSelect === 'function') {
      this.onTableSelect(selectedTableData);
    }
  }
  
  /**
   * Set callback for table selection
   * @param {Function} callback - Function to call when a table is selected
   */
  setOnTableSelect(callback) {
    this.onTableSelect = callback;
  }
  
  /**
   * Update table status
   * @param {number} tableId - ID of table to update
   * @param {string} status - New status ('available' or 'occupied')
   */
  updateTableStatus(tableId, status) {
    // Find the table
    const tableIndex = this.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    // Update status
    this.tables[tableIndex].status = status;
    
    // Re-render tables
    this.renderTables();
    
    // Re-select the table if it was selected
    if (this.selectedTable === tableId) {
      this.selectTable(tableId);
    }
  }
}
EOF
echo "Floor plan component created."

# Create the server view JavaScript file
echo "Creating server view JavaScript file..."
cat > "$SERVER_VIEW_JS" << 'EOF'
/**
 * Server View JavaScript
 * Main script for the server view
 */

import { FloorPlan } from './components/floor-plan/FloorPlan.js';
import { VoiceRecorder } from './components/voice/VoiceRecorder.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize floor plan
  const floorPlan = new FloorPlan('floor-plan');
  
  // DOM Elements - Order Section
  const selectedTable = document.getElementById('selected-table-number');
  const tableStatus = document.getElementById('table-status');
  const orderItems = document.getElementById('order-items');
  const orderTotal = document.getElementById('order-total');
  const editOrderBtn = document.getElementById('edit-order-btn');
  const noTableSelected = document.getElementById('no-table-selected');
  const tableSelected = document.getElementById('table-selected');
  const voiceOrderBtn = document.getElementById('voice-order-btn');
  
  // Set up table selection handler
  floorPlan.setOnTableSelect((table) => {
    if (table) {
      // Show table selected view
      if (noTableSelected) noTableSelected.classList.add('hidden');
      if (tableSelected) tableSelected.classList.remove('hidden');
      
      // Update table info
      if (selectedTable) {
        selectedTable.textContent = table.number;
      }
      
      // Enable voice order button
      if (voiceOrderBtn) {
        voiceOrderBtn.disabled = false;
      }
    } else {
      // Show no table selected view
      if (noTableSelected) noTableSelected.classList.remove('hidden');
      if (tableSelected) tableSelected.classList.add('hidden');
      
      // Disable voice order button
      if (voiceOrderBtn) {
        voiceOrderBtn.disabled = true;
      }
    }
  });
  
  // Voice order button click handler
  if (voiceOrderBtn) {
    voiceOrderBtn.addEventListener('click', () => {
      const modal = document.getElementById('voice-recorder-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }
  
  // Close modal button
  const closeModalBtn = document.getElementById('close-voice-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('voice-recorder-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  }
  
  // Zoom controls
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        const currentScale = parseFloat(floorPlanEl.style.transform?.replace('scale(', '').replace(')', '') || '1');
        floorPlanEl.style.transform = `scale(${Math.min(2, currentScale + 0.1)})`;
      }
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        const currentScale = parseFloat(floorPlanEl.style.transform?.replace('scale(', '').replace(')', '') || '1');
        floorPlanEl.style.transform = `scale(${Math.max(0.5, currentScale - 0.1)})`;
      }
    });
  }
});
EOF
echo "Server view JavaScript file created."

echo "Task completed: Implement Floor Plan Component"
exit 0