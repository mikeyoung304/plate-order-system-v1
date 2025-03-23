document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const floorPlan = document.getElementById('floor-plan');
    const tableModal = document.getElementById('table-modal');
    const selectedTableNumber = document.getElementById('selected-table-number');
    const selectedTableStatus = document.getElementById('selected-table-status');
    const startOrderBtn = document.getElementById('start-order-btn');
    const viewOrderBtn = document.getElementById('view-order-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const editModeBtn = document.getElementById('edit-mode-btn');
    const saveFloorPlanBtn = document.getElementById('save-floor-plan');
    const addTableBtn = document.getElementById('add-table');
    const removeTableBtn = document.getElementById('remove-table');
    const tableTypeSelect = document.getElementById('table-type');

    // State
    let tables = [];
    let editMode = false;
    let selectedTable = null;
    let selectedTableForEdit = null;
    let nextTableId = 1;
    let tableStatusMap = {}; // Maps table IDs to statuses (available, occupied, order-in-progress, order-ready)
    
    // Initialize the floor plan
    function init() {
        loadFloorPlan();
        setupEventListeners();
        setupWebSocketConnection();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Table Modal Events
        closeModalBtn.addEventListener('click', closeTableModal);
        startOrderBtn.addEventListener('click', () => {
            if (selectedTable) {
                window.location.href = `/?table=${selectedTable.dataset.id}`;
            }
        });
        viewOrderBtn.addEventListener('click', () => {
            if (selectedTable) {
                window.location.href = `/orders?table=${selectedTable.dataset.id}`;
            }
        });
        
        // Edit Mode Events
        editModeBtn.addEventListener('click', toggleEditMode);
        saveFloorPlanBtn.addEventListener('click', saveFloorPlan);
        addTableBtn.addEventListener('click', addTable);
        removeTableBtn.addEventListener('click', removeTable);
        
        // Close modal when clicking outside
        tableModal.addEventListener('click', (e) => {
            if (e.target === tableModal) {
                closeTableModal();
            }
        });
    }
    
    // Load floor plan data
    function loadFloorPlan() {
        // Try to load from local storage first (for development convenience)
        const savedPlan = localStorage.getItem('floor-plan');
        if (savedPlan) {
            try {
                tables = JSON.parse(savedPlan);
                renderFloorPlan();
                nextTableId = Math.max(...tables.map(t => t.id)) + 1;
            } catch (e) {
                console.error('Error parsing saved floor plan:', e);
                createDefaultFloorPlan();
            }
        } else {
            // Try to load from API
            fetch('/api/floor-plan')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    tables = data;
                    renderFloorPlan();
                    nextTableId = Math.max(...tables.map(t => t.id)) + 1;
                })
                .catch(error => {
                    console.error('Error loading floor plan:', error);
                    createDefaultFloorPlan();
                });
        }
        
        // Load table statuses
        loadTableStatuses();
    }
    
    // Create default floor plan if none exists
    function createDefaultFloorPlan() {
        tables = [
            { id: 1, number: 1, type: 'round-4', x: 100, y: 100 },
            { id: 2, number: 2, type: 'round-4', x: 250, y: 100 },
            { id: 3, number: 3, type: 'round-4', x: 400, y: 100 },
            { id: 4, number: 4, type: 'round-4', x: 100, y: 250 },
            { id: 5, number: 5, type: 'round-4', x: 250, y: 250 },
            { id: 6, number: 6, type: 'round-4', x: 400, y: 250 },
            { id: 7, number: 7, type: 'rect-6', x: 600, y: 150 },
            { id: 8, number: 8, type: 'rect-6', x: 600, y: 300 }
        ];
        
        nextTableId = 9;
        renderFloorPlan();
        saveFloorPlan();
    }
    
    // Load table statuses from orders API
    function loadTableStatuses() {
        fetch('/api/orders/active')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(orders => {
                tableStatusMap = {};
                
                // Extract table numbers from order details and set status
                orders.forEach(order => {
                    const tableMatch = order.details.match(/Table (\d+):/);
                    if (tableMatch) {
                        const tableNumber = parseInt(tableMatch[1]);
                        
                        // Set status based on order status
                        switch (order.status) {
                            case 'pending':
                                tableStatusMap[tableNumber] = 'occupied';
                                break;
                            case 'in_progress':
                                tableStatusMap[tableNumber] = 'order-in-progress';
                                break;
                            case 'ready':
                                tableStatusMap[tableNumber] = 'order-ready';
                                break;
                            default:
                                tableStatusMap[tableNumber] = 'available';
                        }
                    }
                });
                
                // Update table colors
                updateTableStatuses();
            })
            .catch(error => {
                console.error('Error loading table statuses:', error);
            });
    }
    
    // Update table status colors
    function updateTableStatuses() {
        const tableElements = document.querySelectorAll('.floor-table');
        
        tableElements.forEach(tableEl => {
            const tableNumber = parseInt(tableEl.dataset.number);
            const status = tableStatusMap[tableNumber] || 'available';
            
            // Remove all status classes
            tableEl.classList.remove('available', 'occupied', 'order-in-progress', 'order-ready');
            
            // Add current status class
            tableEl.classList.add(status);
        });
    }
    
    // Render the floor plan
    function renderFloorPlan() {
        floorPlan.innerHTML = '';
        
        tables.forEach(table => {
            const tableElement = createTableElement(table);
            floorPlan.appendChild(tableElement);
        });
    }
    
    // Create a table element
    function createTableElement(table) {
        const tableElement = document.createElement('div');
        tableElement.className = 'floor-table';
        tableElement.classList.add(table.type);
        tableElement.dataset.id = table.id;
        tableElement.dataset.number = table.number;
        tableElement.style.left = `${table.x}px`;
        tableElement.style.top = `${table.y}px`;
        
        // Add the table number
        const numberElement = document.createElement('div');
        numberElement.className = 'table-number';
        numberElement.textContent = table.number;
        tableElement.appendChild(numberElement);
        
        // Add dragging functionality in edit mode
        tableElement.addEventListener('mousedown', (e) => {
            if (!editMode) return;
            
            e.preventDefault();
            selectedTableForEdit = tableElement;
            
            // Calculate the offset of the click relative to the table element
            const rect = tableElement.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            // Handle mousemove to drag the table
            const mouseMoveHandler = (e) => {
                const floorPlanRect = floorPlan.getBoundingClientRect();
                let newX = e.clientX - floorPlanRect.left - offsetX;
                let newY = e.clientY - floorPlanRect.top - offsetY;
                
                // Keep table within floor plan bounds
                newX = Math.max(0, Math.min(floorPlanRect.width - rect.width, newX));
                newY = Math.max(0, Math.min(floorPlanRect.height - rect.height, newY));
                
                tableElement.style.left = `${newX}px`;
                tableElement.style.top = `${newY}px`;
                
                // Update table data
                const tableIndex = tables.findIndex(t => t.id === parseInt(tableElement.dataset.id));
                if (tableIndex !== -1) {
                    tables[tableIndex].x = newX;
                    tables[tableIndex].y = newY;
                }
            };
            
            // Handle mouseup to stop dragging
            const mouseUpHandler = () => {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                selectedTableForEdit = null;
            };
            
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
        
        // Add click handler for table selection (not in edit mode)
        tableElement.addEventListener('click', (e) => {
            if (editMode) {
                // In edit mode, clicking selects the table for editing
                e.stopPropagation();
                selectTableForEdit(tableElement);
            } else {
                // In normal mode, clicking opens the table modal
                e.stopPropagation();
                openTableModal(tableElement);
            }
        });
        
        return tableElement;
    }
    
    // Open table modal
    function openTableModal(tableElement) {
        selectedTable = tableElement;
        const tableNumber = tableElement.dataset.number;
        const tableId = tableElement.dataset.id;
        
        // Get table status
        const status = tableStatusMap[tableNumber] || 'available';
        const statusDisplay = status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // Update modal content
        selectedTableNumber.textContent = tableNumber;
        selectedTableStatus.textContent = statusDisplay;
        
        // Apply status class to status text
        selectedTableStatus.className = '';
        selectedTableStatus.classList.add(status);
        
        // Show/hide buttons based on status
        if (status === 'available') {
            startOrderBtn.classList.remove('hidden');
            viewOrderBtn.classList.add('hidden');
        } else {
            startOrderBtn.classList.remove('hidden');
            viewOrderBtn.classList.remove('hidden');
        }
        
        // Show modal
        tableModal.classList.remove('hidden');
    }
    
    // Close table modal
    function closeTableModal() {
        tableModal.classList.add('hidden');
        selectedTable = null;
    }
    
    // Toggle edit mode
    function toggleEditMode() {
        editMode = !editMode;
        
        if (editMode) {
            floorPlan.classList.add('edit-mode');
            editModeBtn.textContent = 'Exit Edit Mode';
            editModeBtn.classList.add('btn-warning');
            document.querySelector('.floor-plan-controls').classList.remove('hidden');
            saveFloorPlanBtn.classList.remove('hidden');
        } else {
            floorPlan.classList.remove('edit-mode');
            editModeBtn.textContent = 'Edit Floor Plan';
            editModeBtn.classList.remove('btn-warning');
            document.querySelector('.floor-plan-controls').classList.add('hidden');
            saveFloorPlanBtn.classList.add('hidden');
            
            // Deselect any selected table
            if (selectedTableForEdit) {
                selectedTableForEdit.classList.remove('selected');
                selectedTableForEdit = null;
            }
        }
    }
    
    // Add a new table
    function addTable() {
        if (!editMode) return;
        
        const tableType = tableTypeSelect.value;
        
        // Find a free table number
        const usedNumbers = tables.map(t => t.number);
        let tableNumber = 1;
        while (usedNumbers.includes(tableNumber)) {
            tableNumber++;
        }
        
        // Create new table centered in the viewport
        const floorPlanRect = floorPlan.getBoundingClientRect();
        const newTable = {
            id: nextTableId++,
            number: tableNumber,
            type: tableType,
            x: floorPlanRect.width / 2 - 40,
            y: floorPlanRect.height / 2 - 40
        };
        
        // Add to tables array
        tables.push(newTable);
        
        // Create and add table element
        const tableElement = createTableElement(newTable);
        floorPlan.appendChild(tableElement);
        
        // Select the new table for editing
        selectTableForEdit(tableElement);
    }
    
    // Remove a table
    function removeTable() {
        if (!editMode || !selectedTableForEdit) return;
        
        const tableId = parseInt(selectedTableForEdit.dataset.id);
        
        // Remove from DOM
        selectedTableForEdit.remove();
        
        // Remove from tables array
        tables = tables.filter(t => t.id !== tableId);
        
        // Clear selection
        selectedTableForEdit = null;
    }
    
    // Select a table for editing
    function selectTableForEdit(tableElement) {
        // Deselect any previously selected table
        if (selectedTableForEdit) {
            selectedTableForEdit.classList.remove('selected');
        }
        
        // Select the new table
        selectedTableForEdit = tableElement;
        selectedTableForEdit.classList.add('selected');
    }
    
    // Save floor plan
    function saveFloorPlan() {
        // Save to local storage for development
        localStorage.setItem('floor-plan', JSON.stringify(tables));
        
        // Save to API
        fetch('/api/floor-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tables)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showNotification('Floor plan saved successfully');
            
            // Exit edit mode
            if (editMode) {
                toggleEditMode();
            }
        })
        .catch(error => {
            console.error('Error saving floor plan:', error);
            showNotification('Floor plan saved to browser (offline mode)', 'warning');
        });
    }
    
    // WebSocket connection for real-time updates
    function setupWebSocketConnection() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/kds`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Handle order updates
                if (data.type === 'order_update') {
                    // Refresh table statuses
                    loadTableStatuses();
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        };
        
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            // Try to reconnect after 5 seconds
            setTimeout(setupWebSocketConnection, 5000);
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        // Create notification element if doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set type class
        notification.className = `notification notification-${type}`;
        
        // Set message
        notification.textContent = message;
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Initialize the floor plan
    init();
});
