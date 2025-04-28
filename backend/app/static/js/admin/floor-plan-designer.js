/**
 * Floor Plan Designer
 * JavaScript for the admin floor plan designer interface
 * Uses Fabric.js for canvas manipulation
 */

class FloorPlanDesigner {
  constructor() {
    // Initialize properties
    this.canvas = null;
    this.selectedObject = null;
    this.currentFloorPlanId = null;
    this.zoomLevel = 1;
    this.isDragging = false;
    this.lastPosX = 0;
    this.lastPosY = 0;
    
    // Initialize the designer
    this.init();
  }

  /**
   * Initialize the floor plan designer
   */
  init() {
    console.log('Initializing Floor Plan Designer...');
    
    // Initialize the canvas
    this.initCanvas();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize modals
    this.initModals();
  }

  /**
   * Initialize the Fabric.js canvas
   */
  initCanvas() {
    // Create canvas instance
    this.canvas = new fabric.Canvas('floor-plan-canvas', {
      width: document.getElementById('floor-plan-designer').clientWidth,
      height: document.getElementById('floor-plan-designer').clientHeight,
      backgroundColor: '#f8f9fa',
      selection: true,
      preserveObjectStacking: true
    });
    
    // Set up canvas event handlers
    this.canvas.on('selection:created', this.handleObjectSelected.bind(this));
    this.canvas.on('selection:updated', this.handleObjectSelected.bind(this));
    this.canvas.on('selection:cleared', this.handleSelectionCleared.bind(this));
    this.canvas.on('object:modified', this.handleObjectModified.bind(this));
    
    // Enable panning
    this.setupCanvasPanning();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Set up canvas panning functionality
   */
  setupCanvasPanning() {
    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey === true) {
        this.isDragging = true;
        this.canvas.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    
    this.canvas.on('mouse:move', (opt) => {
      if (this.isDragging) {
        const evt = opt.e;
        const vpt = this.canvas.viewportTransform;
        vpt[4] += evt.clientX - this.lastPosX;
        vpt[5] += evt.clientY - this.lastPosY;
        this.canvas.requestRenderAll();
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    
    this.canvas.on('mouse:up', () => {
      this.isDragging = false;
      this.canvas.selection = true;
    });
  }

  /**
   * Set up event listeners for UI controls
   */
  setupEventListeners() {
    // Table shape buttons
    document.getElementById('add-square-table').addEventListener('click', () => this.addTable('square'));
    document.getElementById('add-rectangle-table').addEventListener('click', () => this.addTable('rectangle'));
    document.getElementById('add-circle-table').addEventListener('click', () => this.addTable('circle'));
    
    // Action buttons
    document.getElementById('delete-selected').addEventListener('click', this.deleteSelected.bind(this));
    document.getElementById('clear-all').addEventListener('click', this.clearAll.bind(this));
    
    // Floor plan buttons
    document.getElementById('save-floor-plan').addEventListener('click', this.openSaveModal.bind(this));
    document.getElementById('load-floor-plan').addEventListener('click', this.openLoadModal.bind(this));
    
    // Properties panel
    document.getElementById('apply-properties').addEventListener('click', this.applyProperties.bind(this));
    
    // Zoom controls
    document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoom(1.1));
    document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoom(0.9));
    
    // Seat configuration
    document.getElementById('apply-seat-config').addEventListener('click', this.applySeatConfig.bind(this));
    document.getElementById('seat-count').addEventListener('change', this.updateSeatPreview.bind(this));
    document.querySelectorAll('input[name="seat-arrangement"]').forEach(radio => {
      radio.addEventListener('change', this.updateSeatPreview.bind(this));
    });
    
    // Save floor plan modal
    document.getElementById('save-floor-plan-confirm').addEventListener('click', this.saveFloorPlan.bind(this));
  }

  /**
   * Initialize Bootstrap modals
   */
  initModals() {
    // We're using Bootstrap 5 modals which are initialized automatically
    // Just add event listeners for modal events if needed
    const saveModal = document.getElementById('save-floor-plan-modal');
    if (saveModal) {
      saveModal.addEventListener('shown.bs.modal', () => {
        document.getElementById('floor-plan-name').focus();
      });
    }
    
    const loadModal = document.getElementById('load-floor-plan-modal');
    if (loadModal) {
      loadModal.addEventListener('shown.bs.modal', () => {
        this.loadFloorPlanList();
      });
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const container = document.getElementById('floor-plan-designer');
    this.canvas.setWidth(container.clientWidth);
    this.canvas.setHeight(container.clientHeight);
    this.canvas.renderAll();
  }

  /**
   * Add a new table to the canvas
   * @param {string} shape - The shape of the table (square, rectangle, circle)
   */
  addTable(shape) {
    let table;
    const id = this.generateUniqueId();
    const defaultProps = {
      left: this.canvas.width / 2,
      top: this.canvas.height / 2,
      fill: '#ffffff',
      stroke: '#6c757d',
      strokeWidth: 2,
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      cornerColor: '#007bff',
      cornerSize: 8,
      transparentCorners: false,
      data: {
        type: 'table',
        id: id,
        shape: shape,
        name: `Table ${this.getNextTableNumber()}`,
        seats: 4,
        zone: 'main',
        status: 'available',
        seatObjects: []
      }
    };
    
    switch (shape) {
      case 'square':
        table = new fabric.Rect({
          ...defaultProps,
          width: 100,
          height: 100
        });
        break;
        
      case 'rectangle':
        table = new fabric.Rect({
          ...defaultProps,
          width: 150,
          height: 100
        });
        break;
        
      case 'circle':
        table = new fabric.Circle({
          ...defaultProps,
          radius: 50
        });
        break;
        
      default:
        console.error('Invalid table shape');
        return;
    }
    
    // Add table label
    const label = new fabric.Text(defaultProps.data.name, {
      fontSize: 16,
      fill: '#212529',
      fontFamily: 'Arial',
      originX: 'center',
      originY: 'center',
      left: defaultProps.left,
      top: defaultProps.top,
      selectable: false,
      data: {
        type: 'label',
        tableId: id
      }
    });
    
    // Add to canvas
    this.canvas.add(table);
    this.canvas.add(label);
    
    // Create seats
    this.createSeatsForTable(table);
    
    // Group the table with its label
    this.updateLabelPosition(table, label);
    
    // Select the new table
    this.canvas.setActiveObject(table);
    this.canvas.renderAll();
  }

  /**
   * Create seats for a table
   * @param {fabric.Object} table - The table object
   */
  createSeatsForTable(table) {
    const tableData = table.data;
    const seatCount = tableData.seats;
    const tableId = tableData.id;
    
    // Remove existing seats
    this.removeSeatsForTable(tableId);
    
    // Create new seats
    const seats = [];
    const shape = tableData.shape;
    
    for (let i = 0; i < seatCount; i++) {
      const angle = (i / seatCount) * 2 * Math.PI;
      let offsetX, offsetY;
      
      if (shape === 'circle') {
        // For circle tables, distribute seats evenly around the perimeter
        const radius = table.radius;
        offsetX = Math.cos(angle) * (radius + 20);
        offsetY = Math.sin(angle) * (radius + 20);
      } else {
        // For square/rectangle tables, distribute seats around the perimeter
        const width = table.width;
        const height = table.height;
        
        // Calculate position based on which side of the table
        if (i < seatCount / 4) {
          // Top side
          offsetX = width * (i / (seatCount / 4)) - width / 2;
          offsetY = -height / 2 - 20;
        } else if (i < seatCount / 2) {
          // Right side
          offsetX = width / 2 + 20;
          offsetY = height * ((i - seatCount / 4) / (seatCount / 4)) - height / 2;
        } else if (i < 3 * seatCount / 4) {
          // Bottom side
          offsetX = width * (1 - (i - seatCount / 2) / (seatCount / 4)) - width / 2;
          offsetY = height / 2 + 20;
        } else {
          // Left side
          offsetX = -width / 2 - 20;
          offsetY = height * (1 - (i - 3 * seatCount / 4) / (seatCount / 4)) - height / 2;
        }
      }
      
      // Create seat
      const seat = new fabric.Circle({
        left: table.left + offsetX,
        top: table.top + offsetY,
        fill: '#6c757d',
        radius: 10,
        stroke: '#495057',
        strokeWidth: 1,
        hasControls: false,
        hasBorders: false,
        selectable: true,
        data: {
          type: 'seat',
          id: this.generateUniqueId(),
          tableId: tableId,
          number: i + 1,
          status: 'empty'
        }
      });
      
      // Add seat number
      const seatLabel = new fabric.Text(`${i + 1}`, {
        fontSize: 10,
        fill: '#ffffff',
        fontFamily: 'Arial',
        originX: 'center',
        originY: 'center',
        left: seat.left,
        top: seat.top,
        selectable: false,
        data: {
          type: 'seatLabel',
          seatId: seat.data.id
        }
      });
      
      this.canvas.add(seat);
      this.canvas.add(seatLabel);
      seats.push(seat);
      
      // Add event listener for double-click on seat
      seat.on('mousedblclick', () => {
        this.openSeatConfigModal(table);
      });
    }
    
    // Store seat references in table data
    tableData.seatObjects = seats;
    table.set('data', tableData);
    
    // Move table to front
    table.bringToFront();
    
    // Update label position
    const label = this.findTableLabel(tableId);
    if (label) {
      this.updateLabelPosition(table, label);
      label.bringToFront();
    }
  }

  /**
   * Remove seats for a table
   * @param {string} tableId - The ID of the table
   */
  removeSeatsForTable(tableId) {
    const objectsToRemove = [];
    
    this.canvas.forEachObject(obj => {
      if ((obj.data && obj.data.type === 'seat' && obj.data.tableId === tableId) ||
          (obj.data && obj.data.type === 'seatLabel' && this.getSeatByIdFromCanvas(obj.data.seatId)?.data.tableId === tableId)) {
        objectsToRemove.push(obj);
      }
    });
    
    objectsToRemove.forEach(obj => {
      this.canvas.remove(obj);
    });
  }

  /**
   * Find a seat by ID from the canvas
   * @param {string} seatId - The ID of the seat
   * @returns {fabric.Object|null} - The seat object or null if not found
   */
  getSeatByIdFromCanvas(seatId) {
    let seat = null;
    this.canvas.forEachObject(obj => {
      if (obj.data && obj.data.type === 'seat' && obj.data.id === seatId) {
        seat = obj;
      }
    });
    return seat;
  }

  /**
   * Find the label for a table
   * @param {string} tableId - The ID of the table
   * @returns {fabric.Object|null} - The label object or null if not found
   */
  findTableLabel(tableId) {
    let label = null;
    this.canvas.forEachObject(obj => {
      if (obj.data && obj.data.type === 'label' && obj.data.tableId === tableId) {
        label = obj;
      }
    });
    return label;
  }

  /**
   * Update the position of a table's label
   * @param {fabric.Object} table - The table object
   * @param {fabric.Object} label - The label object
   */
  updateLabelPosition(table, label) {
    if (table && label) {
      label.set({
        left: table.left,
        top: table.top
      });
      label.setCoords();
    }
  }

  /**
   * Generate a unique ID
   * @returns {string} - A unique ID
   */
  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Get the next available table number
   * @returns {number} - The next table number
   */
  getNextTableNumber() {
    let maxNumber = 0;
    this.canvas.forEachObject(obj => {
      if (obj.data && obj.data.type === 'table') {
        const match = obj.data.name.match(/Table (\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
    return maxNumber + 1;
  }

  /**
   * Handle object selection
   * @param {fabric.Event} e - The selection event
   */
  handleObjectSelected(e) {
    const selectedObject = e.selected[0];
    this.selectedObject = selectedObject;
    
    if (selectedObject.data && selectedObject.data.type === 'table') {
      // Show properties panel
      const propertiesPanel = document.getElementById('table-properties');
      propertiesPanel.classList.remove('d-none');
      
      // Populate form fields
      document.getElementById('table-name').value = selectedObject.data.name;
      document.getElementById('table-seats').value = selectedObject.data.seats;
      document.getElementById('table-zone').value = selectedObject.data.zone;
      document.getElementById('table-status').value = selectedObject.data.status;
      
      if (selectedObject.type === 'rect') {
        document.getElementById('table-width').value = selectedObject.width * selectedObject.scaleX;
        document.getElementById('table-height').value = selectedObject.height * selectedObject.scaleY;
      } else if (selectedObject.type === 'circle') {
        document.getElementById('table-width').value = selectedObject.radius * 2 * selectedObject.scaleX;
        document.getElementById('table-height').value = selectedObject.radius * 2 * selectedObject.scaleY;
      }
      
      document.getElementById('table-rotation').value = selectedObject.angle;
    } else if (selectedObject.data && selectedObject.data.type === 'seat') {
      // Handle seat selection
      console.log('Seat selected:', selectedObject.data);
    }
  }

  /**
   * Handle selection cleared
   */
  handleSelectionCleared() {
    this.selectedObject = null;
    
    // Hide properties panel
    const propertiesPanel = document.getElementById('table-properties');
    propertiesPanel.classList.add('d-none');
  }

  /**
   * Handle object modified
   * @param {fabric.Event} e - The modification event
   */
  handleObjectModified(e) {
    const modifiedObject = e.target;
    
    if (modifiedObject.data && modifiedObject.data.type === 'table') {
      // Update label position
      const label = this.findTableLabel(modifiedObject.data.id);
      if (label) {
        this.updateLabelPosition(modifiedObject, label);
      }
      
      // Update seat positions
      this.updateSeatsPosition(modifiedObject);
    }
  }

  /**
   * Update the positions of seats for a table
   * @param {fabric.Object} table - The table object
   */
  updateSeatsPosition(table) {
    const tableData = table.data;
    const seats = tableData.seatObjects;
    
    if (!seats || seats.length === 0) {
      return;
    }
    
    const seatCount = seats.length;
    const shape = tableData.shape;
    
    for (let i = 0; i < seatCount; i++) {
      const seat = seats[i];
      const angle = (i / seatCount) * 2 * Math.PI;
      let offsetX, offsetY;
      
      if (shape === 'circle') {
        // For circle tables, distribute seats evenly around the perimeter
        const radius = table.radius * table.scaleX;
        offsetX = Math.cos(angle) * (radius + 20);
        offsetY = Math.sin(angle) * (radius + 20);
      } else {
        // For square/rectangle tables, distribute seats around the perimeter
        const width = table.width * table.scaleX;
        const height = table.height * table.scaleY;
        
        // Calculate position based on which side of the table
        if (i < seatCount / 4) {
          // Top side
          offsetX = width * (i / (seatCount / 4)) - width / 2;
          offsetY = -height / 2 - 20;
        } else if (i < seatCount / 2) {
          // Right side
          offsetX = width / 2 + 20;
          offsetY = height * ((i - seatCount / 4) / (seatCount / 4)) - height / 2;
        } else if (i < 3 * seatCount / 4) {
          // Bottom side
          offsetX = width * (1 - (i - seatCount / 2) / (seatCount / 4)) - width / 2;
          offsetY = height / 2 + 20;
        } else {
          // Left side
          offsetX = -width / 2 - 20;
          offsetY = height * (1 - (i - 3 * seatCount / 4) / (seatCount / 4)) - height / 2;
        }
      }
      
      // Apply table rotation to seat position
      const tableAngle = table.angle * Math.PI / 180;
      const rotatedX = offsetX * Math.cos(tableAngle) - offsetY * Math.sin(tableAngle);
      const rotatedY = offsetX * Math.sin(tableAngle) + offsetY * Math.cos(tableAngle);
      
      // Update seat position
      seat.set({
        left: table.left + rotatedX,
        top: table.top + rotatedY
      });
      seat.setCoords();
      
      // Update seat label position
      this.canvas.forEachObject(obj => {
        if (obj.data && obj.data.type === 'seatLabel' && obj.data.seatId === seat.data.id) {
          obj.set({
            left: seat.left,
            top: seat.top
          });
          obj.setCoords();
        }
      });
    }
    
    this.canvas.renderAll();
  }

  /**
   * Apply properties from the properties panel to the selected table
   */
  applyProperties() {
    if (!this.selectedObject || !this.selectedObject.data || this.selectedObject.data.type !== 'table') {
      return;
    }
    
    const table = this.selectedObject;
    const tableData = table.data;
    
    // Get values from form
    const name = document.getElementById('table-name').value;
    const seats = parseInt(document.getElementById('table-seats').value, 10);
    const width = parseInt(document.getElementById('table-width').value, 10);
    const height = parseInt(document.getElementById('table-height').value, 10);
    const rotation = parseInt(document.getElementById('table-rotation').value, 10);
    const zone = document.getElementById('table-zone').value;
    const status = document.getElementById('table-status').value;
    
    // Update table data
    tableData.name = name;
    tableData.zone = zone;
    tableData.status = status;
    
    // Update table object
    table.set('data', tableData);
    table.set('angle', rotation);
    
    // Update table dimensions
    if (table.type === 'rect') {
      table.set({
        width: width / table.scaleX,
        height: height / table.scaleY,
        scaleX: 1,
        scaleY: 1
      });
    } else if (table.type === 'circle') {
      table.set({
        radius: width / 2 / table.scaleX,
        scaleX: 1,
        scaleY: 1
      });
    }
    
    // Update table appearance based on status
    table.set('stroke', this.getStatusColor(status));
    
    // Update table label
    const label = this.findTableLabel(tableData.id);
    if (label) {
      label.set('text', name);
      this.updateLabelPosition(table, label);
    }
    
    // Update seats if count changed
    if (seats !== tableData.seats) {
      tableData.seats = seats;
      table.set('data', tableData);
      this.createSeatsForTable(table);
    } else {
      this.updateSeatsPosition(table);
    }
    
    this.canvas.renderAll();
  }

  /**
   * Get color for table status
   * @param {string} status - The table status
   * @returns {string} - The color for the status
   */
  getStatusColor(status) {
    switch (status) {
      case 'available':
        return '#28a745';
      case 'reserved':
        return '#ffc107';
      case 'out_of_service':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  /**
   * Delete the selected object
   */
  deleteSelected() {
    if (!this.selectedObject) {
      return;
    }
    
    if (this.selectedObject.data && this.selectedObject.data.type === 'table') {
      // Remove table label
      const label = this.findTableLabel(this.selectedObject.data.id);
      if (label) {
        this.canvas.remove(label);
      }
      
      // Remove seats
      this.removeSeatsForTable(this.selectedObject.data.id);
      
      // Remove table
      this.canvas.remove(this.selectedObject);
    } else {
      // Remove selected object
      this.canvas.remove(this.selectedObject);
    }
    
    this.selectedObject = null;
    this.canvas.renderAll();
  }

  /**
   * Clear all objects from the canvas
   */
  clearAll() {
    if (confirm('Are you sure you want to clear the entire floor plan? This action cannot be undone.')) {
      this.canvas.clear();
      this.canvas.setBackgroundColor('#f8f9fa', this.canvas.renderAll.bind(this.canvas));
      this.selectedObject = null;
    }
  }

  /**
   * Open the save floor plan modal
   */
  openSaveModal() {
    // Clear previous values
    document.getElementById('floor-plan-name').value = '';
    document.getElementById('floor-plan-description').value = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('save-floor-plan-modal'));
    modal.show();
  }

  /**
   * Save the current floor plan
   */
  saveFloorPlan() {
    const name = document.getElementById('floor-plan-name').value;
    const description = document.getElementById('floor-plan-description').value;
    
    if (!name) {
      alert('Please enter a name for the floor plan');
      return;
    }
    
    // Convert canvas to JSON
    const json = this.canvas.toJSON(['data']);
    
    // Create floor plan object
    const floorPlan = {
      id: this.currentFloorPlanId || this.generateUniqueId(),
      name: name,
      description: description,
      data: json,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to API
    this.saveFloorPlanToAPI(floorPlan);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('save-floor-plan-modal'));
    modal.hide();
  }

  /**
   * Save floor plan to API
   * @param {Object} floorPlan - The floor plan object
   */
  async saveFloorPlanToAPI(floorPlan) {
    try {
      // Prepare the floor plan data for API
      const floorPlanData = {
        id: floorPlan.id,
        name: floorPlan.name,
        description: floorPlan.description,
        data: JSON.stringify(floorPlan.data),
        is_active: true
      };
      
      // Determine if we're creating or updating
      const method = this.currentFloorPlanId ? 'PUT' : 'POST';
      const url = this.currentFloorPlanId
        ? `/api/v1/floor-plans/${this.currentFloorPlanId}`
        : '/api/v1/floor-plans';
      
      // Make the API call
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(floorPlanData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save floor plan: ${response.statusText}`);
      }
      
      const savedFloorPlan = await response.json();
      console.log('Floor plan saved:', savedFloorPlan);
      
      // Extract tables from the canvas and save them
      await this.saveTablesForFloorPlan(savedFloorPlan.id);
      
      // Update current floor plan ID
      this.currentFloorPlanId = savedFloorPlan.id;
      
      // Show success message
      alert(`Floor plan "${floorPlan.name}" saved successfully`);
      
      // Also save to localStorage as a backup
      const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '[]');
      const existingIndex = floorPlans.findIndex(fp => fp.id === floorPlan.id);
      
      if (existingIndex >= 0) {
        floorPlans[existingIndex] = floorPlan;
      } else {
        floorPlans.push(floorPlan);
      }
      
      localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
      
    } catch (error) {
      console.error('Error saving floor plan:', error);
      alert(`Error saving floor plan: ${error.message}`);
    }
  }
  
  /**
   * Save tables from the canvas to the API
   * @param {string} floorPlanId - The ID of the floor plan
   */
  async saveTablesForFloorPlan(floorPlanId) {
    try {
      // Collect tables from canvas
      const tables = [];
      this.canvas.forEachObject(obj => {
        if (obj.data && obj.data.type === 'table') {
          // Create table data object
          const tableData = {
            id: obj.data.id,
            floor_plan_id: floorPlanId,
            name: obj.data.name,
            shape: obj.data.shape,
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            position_x: obj.left,
            position_y: obj.top,
            rotation: obj.angle,
            seat_count: obj.data.seats,
            zone: obj.data.zone,
            status: obj.data.status
          };
          
          // Handle circle tables differently
          if (obj.type === 'circle') {
            tableData.width = obj.radius * 2 * obj.scaleX;
            tableData.height = obj.radius * 2 * obj.scaleY;
          }
          
          tables.push(tableData);
        }
      });
      
      // Make API call to save tables
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tables)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save tables: ${response.statusText}`);
      }
      
      console.log('Tables saved successfully');
      
    } catch (error) {
      console.error('Error saving tables:', error);
      throw error;
    }
  }

  /**
   * Open the load floor plan modal
   */
  openLoadModal() {
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('load-floor-plan-modal'));
    modal.show();
  }

  /**
   * Load the list of floor plans
   */
  async loadFloorPlanList() {
    console.log('Loading floor plan list from API');
    const listContainer = document.getElementById('floor-plan-list');
    
    // Clear previous content and show loading indicator
    listContainer.innerHTML = '<div class="text-center py-2"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
      // Fetch floor plans from API
      const response = await fetch('/api/v1/floor-plans');
      
      if (!response.ok) {
        throw new Error(`Failed to load floor plans: ${response.statusText}`);
      }
      
      const floorPlans = await response.json();
      console.log('Loaded floor plans from API:', floorPlans);
      
      // Clear loading indicator
      listContainer.innerHTML = '';
      
      if (!floorPlans || floorPlans.length === 0) {
        listContainer.innerHTML = '<div class="text-center py-4 text-muted"><p>No floor plans found</p></div>';
        return;
      }
      
      // Sort by updated date (newest first)
      floorPlans.sort((a, b) => {
        const dateA = a.updated_at || a.updatedAt || a.created_at || a.createdAt || new Date().toISOString();
        const dateB = b.updated_at || b.updatedAt || b.created_at || b.createdAt || new Date().toISOString();
        return new Date(dateB) - new Date(dateA);
      });
      
      // Create list items
      floorPlans.forEach(floorPlan => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action floor-plan-item';
        if (floorPlan.id === this.currentFloorPlanId) {
          item.classList.add('active');
        }
        
        const date = new Date(floorPlan.updated_at || floorPlan.updatedAt || floorPlan.created_at || floorPlan.createdAt).toLocaleString();
        
        item.innerHTML = `
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${floorPlan.name}</h5>
            <small>${date}</small>
          </div>
          <p class="mb-1">${floorPlan.description || 'No description'}</p>
        `;
        
        item.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Floor plan clicked:', floorPlan.id);
          this.loadFloorPlan(floorPlan.id);
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('load-floor-plan-modal'));
          modal.hide();
        });
        
        listContainer.appendChild(item);
      });
      
    } catch (error) {
      console.error('Error loading floor plans:', error);
      listContainer.innerHTML = `<div class="text-center py-4 text-danger"><p>Error loading floor plans: ${error.message}</p></div>`;
      
      // Add retry button
      const retryButton = document.createElement('button');
      retryButton.className = 'btn btn-primary mt-3';
      retryButton.textContent = 'Retry';
      retryButton.addEventListener('click', () => this.loadFloorPlanList());
      listContainer.appendChild(retryButton);
    }
  }

  /**
   * Load a floor plan by ID
   * @param {string} id - The ID of the floor plan to load
   */
  async loadFloorPlan(id) {
    try {
      console.log('Loading floor plan with ID:', id);
      
      // Show loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Loading floor plan...</p>';
      loadingIndicator.style.position = 'fixed';
      loadingIndicator.style.top = '50%';
      loadingIndicator.style.left = '50%';
      loadingIndicator.style.transform = 'translate(-50%, -50%)';
      loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      loadingIndicator.style.padding = '20px';
      loadingIndicator.style.borderRadius = '10px';
      loadingIndicator.style.textAlign = 'center';
      loadingIndicator.style.zIndex = '1000';
      document.body.appendChild(loadingIndicator);
      
      // First try to fetch floor plan from API
      const response = await fetch(`/api/v1/floor-plans/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load floor plan: ${response.statusText}`);
      }
      
      const floorPlan = await response.json();
      console.log('Loaded floor plan from API:', floorPlan);
      
      // Fetch tables for this floor plan
      const tablesResponse = await fetch(`/api/v1/floor-plans/${id}/tables`);
      
      if (!tablesResponse.ok) {
        throw new Error(`Failed to load tables: ${tablesResponse.statusText}`);
      }
      
      const tables = await tablesResponse.json();
      console.log('Loaded tables from API:', tables);
      
      // Clear canvas
      this.canvas.clear();
      
      // If floor plan has data, try to load it
      let dataLoaded = false;
      if (floorPlan.data) {
        try {
          let floorPlanData;
          if (typeof floorPlan.data === 'string') {
            floorPlanData = JSON.parse(floorPlan.data);
          } else {
            floorPlanData = floorPlan.data;
          }
          
          // Check if the data is a valid canvas JSON
          if (floorPlanData.objects && Array.isArray(floorPlanData.objects)) {
            this.canvas.loadFromJSON(floorPlanData, () => {
              this.canvas.renderAll();
              console.log('Loaded canvas from floor plan data');
            });
            dataLoaded = true;
          } else {
            console.warn('Floor plan data does not contain valid canvas objects');
          }
        } catch (parseError) {
          console.error('Error parsing floor plan data:', parseError);
        }
      }
      
      // If we couldn't load from canvas data, create from tables
      if (!dataLoaded) {
        console.log('Creating canvas from tables data');
        this.createCanvasFromTables(tables);
      }
      
      // Update current floor plan ID
      this.currentFloorPlanId = id;
      
      // Remove loading indicator
      document.body.removeChild(loadingIndicator);
      
      // Show success message
      alert(`Floor plan "${floorPlan.name}" loaded successfully`);
      
    } catch (error) {
      console.error('Error loading floor plan:', error);
      alert(`Error loading floor plan: ${error.message}`);
      
      // Remove loading indicator if it exists
      const loadingIndicator = document.querySelector('.loading-indicator');
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
      }
    }
  }
  
  /**
   * Create canvas objects from tables data
   * @param {Array} tables - The tables data from the API
   */
  createCanvasFromTables(tables) {
    // Clear canvas first
    this.canvas.clear();
    
    // Create table objects
    tables.forEach(table => {
      let tableObj;
      const defaultProps = {
        left: table.position_x,
        top: table.position_y,
        fill: '#ffffff',
        stroke: this.getStatusColor(table.status),
        strokeWidth: 2,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        cornerColor: '#007bff',
        cornerSize: 8,
        transparentCorners: false,
        angle: table.rotation || 0,
        data: {
          type: 'table',
          id: table.id,
          shape: table.shape,
          name: table.name,
          seats: table.seat_count || 4,
          zone: table.zone || 'main',
          status: table.status || 'available',
          seatObjects: []
        }
      };
      
      // Create table based on shape
      switch (table.shape) {
        case 'circle':
          tableObj = new fabric.Circle({
            ...defaultProps,
            radius: table.width / 2
          });
          break;
          
        case 'rectangle':
        case 'square':
          tableObj = new fabric.Rect({
            ...defaultProps,
            width: table.width,
            height: table.height
          });
          break;
          
        default:
          console.error('Invalid table shape:', table.shape);
          return;
      }
      
      // Add table label
      const label = new fabric.Text(table.name, {
        fontSize: 16,
        fill: '#212529',
        fontFamily: 'Arial',
        originX: 'center',
        originY: 'center',
        left: table.position_x,
        top: table.position_y,
        selectable: false,
        data: {
          type: 'label',
          tableId: table.id
        }
      });
      
      // Add to canvas
      this.canvas.add(tableObj);
      this.canvas.add(label);
      
      // Create seats
      this.createSeatsForTable(tableObj);
    });
    
    // Render
    this.canvas.renderAll();
  }

  /**
   * Open the seat configuration modal
   * @param {fabric.Object} table - The table object
   */
  openSeatConfigModal(table) {
    if (!table || !table.data || table.data.type !== 'table') {
      return;
    }
    
    // Set table name in modal
    document.getElementById('seat-config-table-name').textContent = table.data.name;
    
    // Set seat count
    document.getElementById('seat-count').value = table.data.seats;
    
    // Update seat preview
    this.updateSeatPreview();
    
    // Store reference to the table
    this.selectedObject = table;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('seat-config-modal'));
    modal.show();
  }

  /**
   * Update the seat preview in the seat configuration modal
   */
  updateSeatPreview() {
    const previewContainer = document.getElementById('seat-preview');
    const seatCount = parseInt(document.getElementById('seat-count').value, 10);
    const arrangement = document.querySelector('input[name="seat-arrangement"]:checked').value;
    
    // Clear previous preview
    previewContainer.innerHTML = '';
    
    // Create table preview
    const tablePreview = document.createElement('div');
    tablePreview.className = 'table-preview';
    tablePreview.style.width = '100px';
    tablePreview.style.height = '100px';
    tablePreview.style.backgroundColor = '#ffffff';
    tablePreview.style.border = '2px solid #6c757d';
    tablePreview.style.position = 'relative';
    
    if (this.selectedObject && this.selectedObject.type === 'circle') {
      tablePreview.style.borderRadius = '50%';
    }
    
    previewContainer.appendChild(tablePreview);
    
    // Create seat previews
    for (let i = 0; i < seatCount; i++) {
      const seat = document.createElement('div');
      seat.className = 'seat-preview-item';
      seat.style.width = '20px';
      seat.style.height = '20px';
      seat.style.backgroundColor = '#6c757d';
      seat.style.borderRadius = '50%';
      seat.style.position = 'absolute';
      seat.style.transform = 'translate(-50%, -50%)';
      seat.textContent = (i + 1).toString();
      seat.style.color = '#ffffff';
      seat.style.fontSize = '10px';
      seat.style.display = 'flex';
      seat.style.alignItems = 'center';
      seat.style.justifyContent = 'center';
      
      const angle = (i / seatCount) * 2 * Math.PI;
      let left, top;
      
      if (arrangement === 'even') {
        // Evenly distribute seats
        if (this.selectedObject && this.selectedObject.type === 'circle') {
          // For circle tables
          left = 50 + Math.cos(angle) * 70;
          top = 50 + Math.sin(angle) * 70;
        } else {
          // For square/rectangle tables
          if (i < seatCount / 4) {
            // Top side
            left = 50 + (i / (seatCount / 4) * 100) - 50;
            top = 0;
          } else if (i < seatCount / 2) {
            // Right side
            left = 100;
            top = 50 + ((i - seatCount / 4) / (seatCount / 4) * 100) - 50;
          } else if (i < 3 * seatCount / 4) {
            // Bottom side
            left = 50 + (1 - (i - seatCount / 2) / (seatCount / 4)) * 100 - 50;
            top = 100;
          } else {
            // Left side
            left = 0;
            top = 50 + (1 - (i - 3 * seatCount / 4) / (seatCount / 4)) * 100 - 50;
          }
        }
      } else {
        // Custom positions (for now, just use even distribution)
        if (this.selectedObject && this.selectedObject.type === 'circle') {
          left = 50 + Math.cos(angle) * 70;
          top = 50 + Math.sin(angle) * 70;
        } else {
          if (i < seatCount / 4) {
            left = 50 + (i / (seatCount / 4) * 100) - 50;
            top = 0;
          } else if (i < seatCount / 2) {
            left = 100;
            top = 50 + ((i - seatCount / 4) / (seatCount / 4) * 100) - 50;
          } else if (i < 3 * seatCount / 4) {
            left = 50 + (1 - (i - seatCount / 2) / (seatCount / 4)) * 100 - 50;
            top = 100;
          } else {
            left = 0;
            top = 50 + (1 - (i - 3 * seatCount / 4) / (seatCount / 4)) * 100 - 50;
          }
        }
      }
      
      seat.style.left = `${left}%`;
      seat.style.top = `${top}%`;
      
      previewContainer.appendChild(seat);
    }
    
    // Show/hide custom positions section
    const customPositionsSection = document.getElementById('custom-seat-positions');
    if (arrangement === 'custom') {
      customPositionsSection.classList.remove('d-none');
    } else {
      customPositionsSection.classList.add('d-none');
    }
  }

  /**
   * Apply seat configuration to the selected table
   */
  applySeatConfig() {
    if (!this.selectedObject || !this.selectedObject.data || this.selectedObject.data.type !== 'table') {
      return;
    }
    
    const table = this.selectedObject;
    const tableData = table.data;
    
    // Get values from form
    const seatCount = parseInt(document.getElementById('seat-count').value, 10);
    
    // Update table data
    tableData.seats = seatCount;
    table.set('data', tableData);
    
    // Update seats
    this.createSeatsForTable(table);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('seat-config-modal'));
    modal.hide();
  }

  /**
   * Zoom the canvas
   * @param {number} factor - The zoom factor
   */
  zoom(factor) {
    this.zoomLevel *= factor;
    
    // Limit zoom level
    if (this.zoomLevel > 5) this.zoomLevel = 5;
    if (this.zoomLevel < 0.1) this.zoomLevel = 0.1;
    
    // Apply zoom
    this.canvas.setZoom(this.zoomLevel);
    this.canvas.renderAll();
  }
}

// Initialize the floor plan designer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const designer = new FloorPlanDesigner();
});
