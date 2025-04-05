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
      console.log('Fetching tables from API...');
      const response = await fetch('/api/tables/layout');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Tables fetched successfully:', data);
      
      // Extract tables from the layout
      this.tables = data.tables || [];
      this.renderTables();
    } catch (error) {
      console.error('Error fetching tables:', error);
      // Fall back to empty tables array
      this.tables = [];
      this.renderTables();
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
    const { id, number, type, x, y, status, shape, width, height, seats, current_orders } = table;
    // Use provided dimensions from API, or fall back to predefined types
    const isRound = shape === 'circle';
    
    // Create table element
    const tableEl = document.createElement('div');
    tableEl.className = `absolute flex items-center justify-center font-bold text-lg 
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
    
    // Create inner content with number and seat count
    const tableContent = document.createElement('div');
    tableContent.className = 'text-center';
    tableContent.innerHTML = `
      <div class="font-bold">Table ${number}</div>
      <div class="text-sm">${seats} seats</div>
    `;
    
    // Add indicator for active orders if any
    if (current_orders && current_orders > 0) {
      const orderIndicator = document.createElement('div');
      orderIndicator.className = 'text-xs font-semibold text-red-300 animate-pulse mt-1';
      orderIndicator.textContent = `${current_orders} active ${current_orders === 1 ? 'order' : 'orders'}`;
      tableContent.appendChild(orderIndicator);
    }
    
    tableEl.appendChild(tableContent);
    
    // Add click event
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
