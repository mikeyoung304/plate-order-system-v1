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
  saveFloorPlanToAPI(floorPlan) {
    // For now, save to localStorage as a placeholder
    // In a real implementation, this would be an API call
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '[]');
    
    // Check if floor plan already exists
    const existingIndex = floorPlans.findIndex(fp => fp.id === floorPlan.id);
    
    if (existingIndex >= 0) {
      // Update existing floor plan
      floorPlans[existingIndex] = floorPlan;
    } else {
      // Add new floor plan
      floorPlans.push(floorPlan);
    }
    
    // Save to localStorage
    localStorage.setItem('floorPlans', JSON.stringify(floorPlans));
    
    // Update current floor plan ID
    this.currentFloorPlanId = floorPlan.id;
    
    // Show success message
    alert(`Floor plan "${floorPlan.name}" saved successfully`);
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
  loadFloorPlanList() {
    const listContainer = document.getElementById('floor-plan-list');
    
    // Clear previous content
    listContainer.innerHTML = '';
    
    // Get floor plans from localStorage
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '[]');
    
    if (floorPlans.length === 0) {
      listContainer.innerHTML = '<div class="text-center py-4 text-muted"><p>No floor plans found</p></div>';
      return;
    }
    
    // Sort by updated date (newest first)
    floorPlans.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Create list items
    floorPlans.forEach(floorPlan => {
      const item = document.createElement('a');
      item.href = '#';
      item.className = 'list-group-item list-group-item-action floor-plan-item';
      if (floorPlan.id === this.currentFloorPlanId) {
        item.classList.add('active');
      }
      
      const date = new Date(floorPlan.updatedAt).toLocaleString();
      
      item.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${floorPlan.name}</h5>
          <small>${date}</small>
        </div>
        <p class="mb-1">${floorPlan.description || 'No description'}</p>
      `;
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadFloorPlan(floorPlan.id);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('load-floor-plan-modal'));
        modal.hide();
      });
      
      listContainer.appendChild(item);
    });
  }

  /**
   * Load a floor plan by ID
   * @param {string} id - The ID of the floor plan to load
   */
  loadFloorPlan(id) {
    // Get floor plans from localStorage
    const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '[]');
    const floorPlan = floorPlans.find(fp => fp.id === id);
    
    if (!floorPlan) {
      alert('Floor plan not found');
      return;
    }
    
    // Clear canvas
    this.canvas.clear();
    
    // Load floor plan data
    this.canvas.loadFromJSON(floorPlan.data, () => {
      // Update current floor plan ID
      this.currentFloorPlanId = id;
      
      // Refresh canvas
      this.canvas.renderAll();
      
      // Show success message
      alert(`Floor plan "${floorPlan.name}" loaded successfully`);
    });
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
