/**
 * Enhanced Floor Plan Component
 * Handles the visualization and interaction with restaurant tables
 * Supports creating, dragging, and resizing tables of different shapes
 */

export class FloorPlan {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container element with id "${containerId}" not found, using existing tables`);
      // If we can't find the container, we'll work with the existing table elements
      this.useExistingTables = true;
    } else {
      this.useExistingTables = false;
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
      adminMode: false, // Only allow floor plan editing in admin mode
      ...options
    };
    
    this.tables = [];
    this.selectedTable = null;
    this.selectedSeat = null;
    this.zoomedTable = null;
    this.onTableSelect = null;
    this.onSeatSelect = null;
    this.nextTableId = 1;
    this.editMode = false;
    this.tableMode = false; // Track if we're in table detail mode
    this.currentDragElement = null;
    this.dragOffset = { x: 0, y: 0 };
    this.resizing = false;
    this.resizeDirection = '';
    this.currentAction = 'select'; // 'select', 'add-square', 'add-circle', 'add-rectangle'
    
    this.init();
  }
  
  /**
   * Initialize the floor plan
   */
  init() {
    if (!this.useExistingTables) {
      // Set container styles
      this.container.style.position = 'relative';
      
      // Fetch tables from API
      this.fetchTables();
      
      // Add event listener for container clicks (deselection)
      this.container.addEventListener('click', (e) => {
        if (e.target === this.container) {
          this.selectTable(null);
          
          // If in add mode, create a new table at the click position
          if (this.currentAction.startsWith('add-')) {
            this.createNewTable(e.offsetX, e.offsetY);
          }
        }
      });
      
      // Add event listeners for drag and drop
      this.setupDragAndDrop();
    } else {
      // Use existing table elements
      this.setupExistingTables();
    }
    
    // Create toolbar if in edit mode
    if (this.editMode) {
      this.createToolbar();
    }
  }
  
  /**
   * Set up drag and drop functionality
   */
  setupDragAndDrop() {
    // Mouse move event for dragging tables
    document.addEventListener('mousemove', (e) => {
      if (this.currentDragElement && this.editMode) {
        e.preventDefault();
        
        if (this.resizing) {
          this.handleResize(e);
        } else {
          this.handleDrag(e);
        }
      }
    });
    
    // Mouse up event for dropping tables
    document.addEventListener('mouseup', () => {
      if (this.currentDragElement && this.editMode) {
        // Update table data with new position
        const tableId = parseInt(this.currentDragElement.dataset.tableId);
        const tableIndex = this.tables.findIndex(t => t.id === tableId);
        
        if (tableIndex !== -1) {
          this.tables[tableIndex].x = parseInt(this.currentDragElement.style.left);
          this.tables[tableIndex].y = parseInt(this.currentDragElement.style.top);
          
          if (this.resizing) {
            const width = parseInt(this.currentDragElement.style.width);
            const height = parseInt(this.currentDragElement.style.height);
            this.tables[tableIndex].width = width;
            this.tables[tableIndex].height = height;
          }
        }
        
        this.currentDragElement = null;
        this.resizing = false;
      }
    });
  }
  
  /**
   * Handle table dragging
   * @param {MouseEvent} e - Mouse event
   */
  handleDrag(e) {
    const containerRect = this.container.getBoundingClientRect();
    const x = e.clientX - containerRect.left - this.dragOffset.x;
    const y = e.clientY - containerRect.top - this.dragOffset.y;
    
    // Constrain to container boundaries
    const width = parseInt(this.currentDragElement.style.width);
    const height = parseInt(this.currentDragElement.style.height);
    const maxX = containerRect.width - width;
    const maxY = containerRect.height - height;
    
    this.currentDragElement.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
    this.currentDragElement.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
  }
  
  /**
   * Handle table resizing
   * @param {MouseEvent} e - Mouse event
   */
  handleResize(e) {
    const containerRect = this.container.getBoundingClientRect();
    const tableRect = this.currentDragElement.getBoundingClientRect();
    const minSize = 60; // Minimum table size
    
    if (this.resizeDirection.includes('e')) { // East (right)
      const width = Math.max(minSize, e.clientX - tableRect.left);
      this.currentDragElement.style.width = `${width}px`;
    }
    
    if (this.resizeDirection.includes('s')) { // South (bottom)
      const height = Math.max(minSize, e.clientY - tableRect.top);
      this.currentDragElement.style.height = `${height}px`;
    }
    
    if (this.resizeDirection.includes('w')) { // West (left)
      const width = Math.max(minSize, tableRect.right - e.clientX);
      const newLeft = Math.min(tableRect.right - minSize, e.clientX - containerRect.left);
      this.currentDragElement.style.width = `${width}px`;
      this.currentDragElement.style.left = `${newLeft}px`;
    }
    
    if (this.resizeDirection.includes('n')) { // North (top)
      const height = Math.max(minSize, tableRect.bottom - e.clientY);
      const newTop = Math.min(tableRect.bottom - minSize, e.clientY - containerRect.top);
      this.currentDragElement.style.height = `${height}px`;
      this.currentDragElement.style.top = `${newTop}px`;
    }
  }
  
  /**
   * Create a new table at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  createNewTable(x, y) {
    const shape = this.currentAction.replace('add-', '');
    let type, width, height, isRound;
    
    switch (shape) {
      case 'square':
        type = 'square-4';
        width = 100;
        height = 100;
        isRound = false;
        break;
      case 'circle':
        type = 'round-4';
        width = 100;
        height = 100;
        isRound = true;
        break;
      case 'rectangle':
        type = 'rectangle-4';
        width = 120;
        height = 80;
        isRound = false;
        break;
      default:
        return;
    }
    
    // Find the next available table number
    const maxNumber = this.tables.length > 0 ? Math.max(...this.tables.map(t => t.number)) : 0;
    const newNumber = maxNumber + 1;
    
    // Create new table data
    const newTable = {
      id: this.nextTableId++,
      number: newNumber,
      type,
      x: x - width / 2, // Center at click position
      y: y - height / 2,
      width,
      height,
      status: 'available',
      isRound
    };
    
    // Add to tables array
    this.tables.push(newTable);
    
    // Render the new table
    const tableEl = this.createTableElement(newTable);
    this.container.appendChild(tableEl);
    
    // Select the new table
    this.selectTable(newTable.id);
    
    // Reset action to select
    this.currentAction = 'select';
    this.updateToolbarState();
  }
  
  /**
   * Create toolbar for floor plan editing
   */
  createToolbar() {
    // Create toolbar container
    const toolbar = document.createElement('div');
    toolbar.id = 'floor-plan-toolbar';
    toolbar.className = 'bg-white shadow-md rounded-md p-2 flex space-x-2 mb-4';
    
    // Add toolbar buttons
    const buttons = [
      { id: 'select-btn', icon: '👆', tooltip: 'Select Mode', action: 'select' },
      { id: 'add-square-btn', icon: '⬛', tooltip: 'Add Square Table', action: 'add-square' },
      { id: 'add-circle-btn', icon: '⭕', tooltip: 'Add Round Table', action: 'add-circle' },
      { id: 'add-rectangle-btn', icon: '▭', tooltip: 'Add Rectangle Table', action: 'add-rectangle' },
      { id: 'delete-btn', icon: '🗑️', tooltip: 'Delete Selected Table', action: 'delete' },
      { id: 'save-btn', icon: '💾', tooltip: 'Save Floor Plan', action: 'save' },
      { id: 'load-btn', icon: '📂', tooltip: 'Load Floor Plan', action: 'load' },
      { id: 'toggle-edit-btn', icon: '✏️', tooltip: 'Toggle Edit Mode', action: 'toggle-edit' }
    ];
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.id = btn.id;
      button.className = 'w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';
      button.title = btn.tooltip;
      button.innerHTML = btn.icon;
      button.dataset.action = btn.action;
      
      // Add click handler
      button.addEventListener('click', () => this.handleToolbarAction(btn.action));
      
      toolbar.appendChild(button);
    });
    
    // Insert toolbar before the container
    this.container.parentNode.insertBefore(toolbar, this.container);
    this.toolbar = toolbar;
  }
  
  /**
   * Handle toolbar button clicks
   * @param {string} action - Action to perform
   */
  handleToolbarAction(action) {
    switch (action) {
      case 'select':
      case 'add-square':
      case 'add-circle':
      case 'add-rectangle':
        this.currentAction = action;
        break;
      case 'delete':
        this.deleteSelectedTable();
        break;
      case 'save':
        this.saveFloorPlan();
        break;
      case 'load':
        this.loadFloorPlan();
        break;
      case 'toggle-edit':
        this.toggleEditMode();
        break;
    }
    
    this.updateToolbarState();
  }
  
  /**
   * Update toolbar button states
   */
  updateToolbarState() {
    if (!this.toolbar) return;
    
    // Remove active class from all buttons
    const buttons = this.toolbar.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.classList.remove('bg-indigo-100', 'text-indigo-700');
    });
    
    // Add active class to current action button
    const activeButton = this.toolbar.querySelector(`[data-action="${this.currentAction}"]`);
    if (activeButton) {
      activeButton.classList.add('bg-indigo-100', 'text-indigo-700');
    }
    
    // Enable/disable delete button based on selection
    const deleteButton = this.toolbar.querySelector('#delete-btn');
    if (deleteButton) {
      deleteButton.disabled = this.selectedTable === null;
      deleteButton.classList.toggle('opacity-50', this.selectedTable === null);
    }
  }
  
  /**
   * Delete the currently selected table
   */
  deleteSelectedTable() {
    if (this.selectedTable === null) return;
    
    // Remove from tables array
    this.tables = this.tables.filter(t => t.id !== this.selectedTable);
    
    // Re-render tables
    this.renderTables();
    
    // Deselect
    this.selectedTable = null;
    
    // Update toolbar state
    this.updateToolbarState();
  }
  
  /**
   * Save the current floor plan to localStorage
   */
  saveFloorPlan() {
    try {
      localStorage.setItem('floorPlan', JSON.stringify(this.tables));
      alert('Floor plan saved successfully!');
    } catch (error) {
      console.error('Error saving floor plan:', error);
      alert('Error saving floor plan: ' + error.message);
    }
  }
  
  /**
   * Load a floor plan from localStorage
   */
  loadFloorPlan() {
    try {
      const savedTables = localStorage.getItem('floorPlan');
      if (savedTables) {
        this.tables = JSON.parse(savedTables);
        this.renderTables();
        alert('Floor plan loaded successfully!');
      } else {
        alert('No saved floor plan found.');
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
      alert('Error loading floor plan: ' + error.message);
    }
  }
  
  /**
   * Toggle edit mode
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    
    // Update container class
    this.container.classList.toggle('edit-mode', this.editMode);
    
    // Update toolbar button
    const toggleButton = this.toolbar.querySelector('#toggle-edit-btn');
    if (toggleButton) {
      toggleButton.title = this.editMode ? 'Exit Edit Mode' : 'Enter Edit Mode';
      toggleButton.classList.toggle('bg-yellow-100', this.editMode);
    }
    
    // Re-render tables to update their appearance
    this.renderTables();
  }
  
  /**
   * Set up existing table elements
   */
  setupExistingTables() {
    // Find all table elements
    const tableElements = document.querySelectorAll('.table');
    
    // Create table data from elements
    this.tables = Array.from(tableElements).map(el => {
      const id = parseInt(el.getAttribute('data-table-id'));
      const number = parseInt(el.getAttribute('data-table-id'));
      const status = el.classList.contains('available') ? 'available' : 'occupied';
      
      // Add click handler for table selection
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectTable(id);
      });
      
      return { id, number, status, element: el };
    });
    
    // Set next table ID
    this.nextTableId = this.tables.length > 0 ? Math.max(...this.tables.map(t => t.id)) + 1 : 1;
  }
  
  /**
   * Fetch tables from API
   */
  async fetchTables() {
    try {
      // Try to load from localStorage first
      const savedTables = localStorage.getItem('floorPlan');
      if (savedTables) {
        this.tables = JSON.parse(savedTables);
        this.renderTables();
        return;
      }
      
      // Try to fetch tables from the API
      let tables = [];
      
      try {
        const response = await fetch('/api/tables');
        if (response.ok) {
          tables = await response.json();
        } else {
          throw new Error('Failed to fetch tables');
        }
      } catch (error) {
        console.warn('Error fetching tables from API, using mock data:', error);
        // Fallback to mock data if API fails
        tables = [
          { id: 1, number: 1, type: 'square-4', x: 50, y: 50, status: 'available' },
          { id: 2, number: 2, type: 'square-4', x: 200, y: 50, status: 'occupied' },
          { id: 3, number: 3, type: 'square-4', x: 350, y: 50, status: 'available' },
          { id: 4, number: 4, type: 'rectangle-6', x: 50, y: 200, status: 'occupied' },
          { id: 5, number: 5, type: 'rectangle-6', x: 250, y: 200, status: 'available' },
          { id: 6, number: 6, type: 'round-4', x: 500, y: 50, status: 'available' }
        ];
      }
      
      this.tables = tables;
      this.nextTableId = this.tables.length > 0 ? Math.max(...this.tables.map(t => t.id)) + 1 : 1;
      this.renderTables();
    } catch (error) {
      console.error('Error setting up tables:', error);
    }
  }
  
  /**
   * Render tables on the floor plan
   */
  renderTables() {
    if (this.useExistingTables) return;
    
    // Clear existing tables
    this.container.innerHTML = '';
    
    // Create and add each table
    this.tables.forEach(table => {
      const tableEl = this.createTableElement(table);
      this.container.appendChild(tableEl);
    });
    
    // Update toolbar state
    this.updateToolbarState();
  }
  
  /**
   * Create a table DOM element
   * @param {Object} table - Table data
   * @returns {HTMLElement} - Table element
   */
  createTableElement(table) {
    const { id, number, type, x, y, status } = table;
    let { width, height, isRound } = table;
    
    // If width and height are not provided, use the default from tableTypes
    if (!width || !height) {
      const tableType = this.options.tableTypes[type] || this.options.tableTypes['square-4'];
      width = tableType.width;
      height = tableType.height;
      isRound = tableType.isRound;
    }
    
    // Create table element
    const tableEl = document.createElement('div');
    tableEl.className = `table absolute flex items-center justify-center font-bold text-lg 
                        ${status === 'occupied' ? 'bg-red-100 border-red-500' : 'bg-green-100 border-green-500'} 
                        ${isRound ? 'rounded-full' : 'rounded-md'}
                        ${this.selectedTable === id ? 'ring-4 ring-indigo-500' : ''}
                        border-2 cursor-pointer hover:bg-gray-100 transition-colors`;
    
    if (this.editMode) {
      tableEl.classList.add('edit-mode');
    }
    
    tableEl.style.width = `${width}px`;
    tableEl.style.height = `${height}px`;
    tableEl.style.left = `${x}px`;
    tableEl.style.top = `${y}px`;
    tableEl.dataset.tableId = id;
    tableEl.dataset.tableNumber = number;
    tableEl.dataset.tableStatus = status;
    
    // Add table number
    const numberEl = document.createElement('div');
    numberEl.className = 'text-center';
    numberEl.innerHTML = `
      <div class="text-lg font-bold">${number}</div>
      <div class="text-xs text-gray-500">${status === 'available' ? 'Available' : 'Occupied'}</div>
    `;
    tableEl.appendChild(numberEl);
    
    // Add click handler for table selection
    tableEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectTable(id);
    });
    
    // Add mousedown handler for dragging in edit mode
    if (this.editMode) {
      tableEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        
        // Check if clicking on a resize handle
        const target = e.target;
        if (target.classList.contains('resize-handle')) {
          this.resizing = true;
          this.resizeDirection = target.dataset.direction;
        } else {
          this.resizing = false;
        }
        
        this.currentDragElement = tableEl;
        const rect = tableEl.getBoundingClientRect();
        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      });
      
      // Add resize handles
      this.addResizeHandles(tableEl);
    }
    
    return tableEl;
  }
  
  /**
   * Add resize handles to a table element
   * @param {HTMLElement} tableEl - Table element
   */
  addResizeHandles(tableEl) {
    const directions = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
    
    directions.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle absolute w-3 h-3 bg-indigo-500 rounded-full';
      handle.dataset.direction = dir;
      
      // Position the handle
      switch (dir) {
        case 'n':
          handle.style.top = '-4px';
          handle.style.left = '50%';
          handle.style.transform = 'translateX(-50%)';
          handle.style.cursor = 'ns-resize';
          break;
        case 'e':
          handle.style.right = '-4px';
          handle.style.top = '50%';
          handle.style.transform = 'translateY(-50%)';
          handle.style.cursor = 'ew-resize';
          break;
        case 's':
          handle.style.bottom = '-4px';
          handle.style.left = '50%';
          handle.style.transform = 'translateX(-50%)';
          handle.style.cursor = 'ns-resize';
          break;
        case 'w':
          handle.style.left = '-4px';
          handle.style.top = '50%';
          handle.style.transform = 'translateY(-50%)';
          handle.style.cursor = 'ew-resize';
          break;
        case 'ne':
          handle.style.top = '-4px';
          handle.style.right = '-4px';
          handle.style.cursor = 'nesw-resize';
          break;
        case 'se':
          handle.style.bottom = '-4px';
          handle.style.right = '-4px';
          handle.style.cursor = 'nwse-resize';
          break;
        case 'sw':
          handle.style.bottom = '-4px';
          handle.style.left = '-4px';
          handle.style.cursor = 'nesw-resize';
          break;
        case 'nw':
          handle.style.top = '-4px';
          handle.style.left = '-4px';
          handle.style.cursor = 'nwse-resize';
          break;
      }
      
      tableEl.appendChild(handle);
    });
  }
  
  /**
   * Select a table
   * @param {number|null} tableId - ID of table to select, or null to deselect
   */
  selectTable(tableId) {
    this.selectedTable = tableId;
    this.selectedSeat = null;
    
    // If we're in edit mode, don't zoom in
    if (this.editMode) {
      this.zoomedTable = null;
      this.tableMode = false;
    } else if (tableId) {
      // Toggle table mode if clicking the same table
      if (this.zoomedTable === tableId) {
        this.zoomedTable = null;
        this.tableMode = false;
      } else {
        this.zoomedTable = tableId;
        this.tableMode = true;
      }
    } else {
      this.zoomedTable = null;
      this.tableMode = false;
    }
    
    if (this.useExistingTables) {
      // Update UI to reflect selection for existing tables
      const tableElements = document.querySelectorAll('.table');
      tableElements.forEach(el => {
        const id = parseInt(el.getAttribute('data-table-id'));
        if (id === tableId) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
      
      // Find the selected table data
      const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;
      
      // Call the onTableSelect callback if defined
      if (typeof this.onTableSelect === 'function') {
        this.onTableSelect(selectedTableData);
      }
    } else {
      // Update UI to reflect selection for dynamic tables
      const tableElements = this.container.querySelectorAll('[data-table-id]');
      tableElements.forEach(el => {
        const id = parseInt(el.dataset.tableId);
        if (id === tableId) {
          el.classList.add('ring-4', 'ring-indigo-500');
        } else {
          el.classList.remove('ring-4', 'ring-indigo-500');
        }
      });
      
      // Find the selected table data
      const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;
      
      // Call the onTableSelect callback if defined
      if (typeof this.onTableSelect === 'function') {
        this.onTableSelect(selectedTableData);
      }
    }
    
    // Update the view based on table mode
    this.updateTableView();
    
    // Update toolbar state
    this.updateToolbarState();
  }
  
  /**
   * Select a seat
   * @param {number} tableId - ID of the table
   * @param {string} seatNumber - Seat number (S1, S2, etc.)
   */
  selectSeat(tableId, seatNumber) {
    this.selectedTable = tableId;
    this.selectedSeat = seatNumber;
    
    // Update UI to reflect seat selection
    const seatElements = this.container.querySelectorAll('.seat');
    seatElements.forEach(el => {
      const tId = parseInt(el.dataset.tableId);
      const seat = el.dataset.seat;
      if (tId === tableId && seat === seatNumber) {
        el.classList.add('selected-seat');
      } else {
        el.classList.remove('selected-seat');
      }
    });
    
    // Find the selected table data
    const selectedTableData = tableId ? this.tables.find(t => t.id === tableId) : null;
    
    // Call the onSeatSelect callback if defined
    if (typeof this.onSeatSelect === 'function') {
      this.onSeatSelect(selectedTableData, seatNumber);
    }
  }
  
  /**
   * Update the view based on table mode
   */
  updateTableView() {
    // Remove existing seats
    const existingSeats = this.container.querySelectorAll('.seat');
    existingSeats.forEach(seat => seat.remove());
    
    if (this.tableMode && this.zoomedTable) {
      // Find the selected table
      const tableEl = this.container.querySelector(`[data-table-id="${this.zoomedTable}"]`);
      const tableData = this.tables.find(t => t.id === this.zoomedTable);
      
      if (tableEl && tableData) {
        // Get table dimensions and position
        const tableRect = tableEl.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Get current position
        const currentLeft = tableRect.left - containerRect.left;
        const currentTop = tableRect.top - containerRect.top;
        
        // Calculate center position
        const centerX = (containerRect.width / 2) - (tableRect.width / 2);
        const centerY = (containerRect.height / 2) - (tableRect.height / 2);
        
        // Calculate translation needed to center
        const translateX = centerX - currentLeft;
        const translateY = centerY - currentTop;
        
        // Apply zoom effect and centering
        tableEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.5)`;
        tableEl.style.zIndex = '100';
        
        // Add seats to the table
        this.addSeatsToTable(tableData);
      }
    } else {
      // Reset all tables to normal view
      const tableElements = this.container.querySelectorAll('.table');
      tableElements.forEach(el => {
        el.style.transform = '';
        el.style.zIndex = '';
      });
    }
  }
  
  /**
   * Add seats to a table
   * @param {Object} tableData - Table data
   */
  addSeatsToTable(tableData) {
    const tableEl = this.container.querySelector(`[data-table-id="${tableData.id}"]`);
    if (!tableEl) return;
    
    const tableRect = tableEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    // Calculate table position relative to container
    const tableLeft = tableRect.left - containerRect.left;
    const tableTop = tableRect.top - containerRect.top;
    
    const { width, height } = tableRect;
    const isRound = tableData.isRound;
    
    // Seat positions (relative to table)
    const seatPositions = [
      { id: 'S1', x: width * 0.25, y: height * 0.25 },
      { id: 'S2', x: width * 0.75, y: height * 0.25 },
      { id: 'S3', x: width * 0.25, y: height * 0.75 },
      { id: 'S4', x: width * 0.75, y: height * 0.75 }
    ];
    
    // Create seat elements
    seatPositions.forEach(seat => {
      const seatEl = document.createElement('div');
      seatEl.className = `seat absolute bg-white border-2 border-indigo-500 rounded-full
                         flex items-center justify-center text-xs font-bold cursor-pointer
                         hover:bg-indigo-100 transition-colors z-110`;
      seatEl.style.width = '30px';
      seatEl.style.height = '30px';
      seatEl.style.left = `${tableLeft + seat.x - 15}px`;
      seatEl.style.top = `${tableTop + seat.y - 15}px`;
      seatEl.textContent = seat.id;
      seatEl.dataset.tableId = tableData.id;
      seatEl.dataset.seat = seat.id;
      
      // Add click handler for seat selection
      seatEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSeat(tableData.id, seat.id);
      });
      
      // Add long press handler for recording
      let pressTimer;
      seatEl.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
          // Trigger recording for this seat
          if (typeof this.onSeatLongPress === 'function') {
            this.onSeatLongPress(tableData.id, seat.id);
          }
        }, 500); // 500ms for long press
      });
      
      seatEl.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });
      
      seatEl.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
      });
      
      this.container.appendChild(seatEl);
    });
  }
  
  /**
   * Set callback for table selection
   * @param {Function} callback - Function to call when a table is selected
   */
  setOnTableSelect(callback) {
    this.onTableSelect = callback;
  }
  
  /**
   * Set callback for seat selection
   * @param {Function} callback - Function to call when a seat is selected
   */
  setOnSeatSelect(callback) {
    this.onSeatSelect = callback;
  }
  
  /**
   * Set callback for seat long press (for recording)
   * @param {Function} callback - Function to call when a seat is long-pressed
   */
  setOnSeatLongPress(callback) {
    this.onSeatLongPress = callback;
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
    
    if (this.useExistingTables) {
      // Update the existing table element
      const tableElements = document.querySelectorAll('.table');
      tableElements.forEach(el => {
        const id = parseInt(el.getAttribute('data-table-id'));
        if (id === tableId) {
          if (status === 'available') {
            el.classList.add('available');
            el.classList.remove('occupied');
          } else {
            el.classList.add('occupied');
            el.classList.remove('available');
          }
        }
      });
    } else {
      // Re-render tables
      this.renderTables();
      
      // Re-select the table if it was selected
      if (this.selectedTable === tableId) {
        this.selectTable(tableId);
      }
    }
  }
  
  /**
   * Enable edit mode
   */
  enableEditMode() {
    // Only allow edit mode in admin mode
    if (!this.options.adminMode) {
      console.warn('Edit mode is only available in admin mode');
      return;
    }
    
    if (!this.editMode) {
      this.editMode = true;
      this.tableMode = false; // Exit table mode when entering edit mode
      this.zoomedTable = null;
      this.createToolbar();
      this.container.classList.add('edit-mode');
      this.renderTables();
      this.updateTableView();
    }
  }
  
  /**
   * Disable edit mode
   */
  disableEditMode() {
    if (this.editMode) {
      this.editMode = false;
      if (this.toolbar) {
        this.toolbar.remove();
        this.toolbar = null;
      }
      this.container.classList.remove('edit-mode');
      this.renderTables();
      this.updateTableView();
    }
  }
}
