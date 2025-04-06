// iPad-Specific Optimizations for Plate Order System
// This file contains enhancements specifically for iPad devices
// used by both servers and kitchen staff in assisted living facilities

class iPadOptimizer {
  constructor() {
    this.isIPad = this.detectIPad();
    this.isPortrait = window.innerHeight > window.innerWidth;
    this.hasTouchID = this.detectTouchID();
    this.hasApplePencil = this.detectApplePencil();
    this.supportsSplitView = this.detectSplitViewSupport();
    
    // Initialize optimizations
    if (this.isIPad) {
      this.applyIPadOptimizations();
    }
    
    // Listen for orientation changes
    window.addEventListener('resize', () => {
      this.isPortrait = window.innerHeight > window.innerWidth;
      this.handleOrientationChange();
    });
    
    // Listen for split view changes
    window.addEventListener('resize', this.debounce(() => {
      this.handleSplitViewChange();
    }, 250));
  }
  
  // Detect if device is iPad
  detectIPad() {
    const userAgent = navigator.userAgent;
    const isIPad = /iPad/.test(userAgent);
    const isIOS = /iPhone|iPod/.test(userAgent) || isIPad;
    const isStandalone = window.navigator.standalone;
    const isMacOS = /Mac OS/.test(userAgent);
    
    // Modern iPads don't report as iPad in user agent
    if (isIPad) return true;
    
    // Check for iPad-specific features
    if (isIOS && window.innerWidth >= 768 && window.innerHeight >= 768) return true;
    
    // iPad Pro might report as Mac
    if (isMacOS && navigator.maxTouchPoints && navigator.maxTouchPoints > 2) return true;
    
    return false;
  }
  
  // Detect Touch ID capability
  detectTouchID() {
    // This is a placeholder - actual implementation would use
    // WebAuthentication API or device capability detection
    return this.isIPad && (navigator.platform.includes('iPad') || 
                          (navigator.platform.includes('Mac') && navigator.maxTouchPoints > 2));
  }
  
  // Detect Apple Pencil support
  detectApplePencil() {
    // Check for pointer events with high precision
    return this.isIPad && window.PointerEvent && navigator.maxTouchPoints > 2;
  }
  
  // Detect split view support
  detectSplitViewSupport() {
    // iPadOS 13+ supports split view
    return this.isIPad && window.matchMedia('(min-device-width: 768px)').matches;
  }
  
  // Apply iPad-specific optimizations
  applyIPadOptimizations() {
    // Add iPad-specific CSS class
    document.documentElement.classList.add('ipad-device');
    
    // Add orientation class
    document.documentElement.classList.add(this.isPortrait ? 'portrait' : 'landscape');
    
    // Optimize touch targets
    this.optimizeTouchTargets();
    
    // Optimize for Apple Pencil if available
    if (this.hasApplePencil) {
      this.optimizeForApplePencil();
    }
    
    // Apply role-specific optimizations
    if (window.location.pathname.includes('kitchen')) {
      this.applyKitchenIPadOptimizations();
    } else {
      this.applyServerIPadOptimizations();
    }
    
    // Handle safe areas (notch, home indicator)
    this.handleSafeAreas();
    
    // Optimize for split view if supported
    if (this.supportsSplitView) {
      this.optimizeForSplitView();
    }
  }
  
  // Optimize touch targets for iPad
  optimizeTouchTargets() {
    // Find all interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, [role="button"]');
    
    // Ensure minimum touch target size (44x44px)
    interactiveElements.forEach(element => {
      // Get computed style
      const style = window.getComputedStyle(element);
      const width = parseInt(style.width);
      const height = parseInt(style.height);
      
      // Apply minimum size if needed
      if (width < 44 || height < 44) {
        element.classList.add('ipad-touch-target');
      }
      
      // Add touch feedback
      element.addEventListener('touchstart', () => {
        element.classList.add('ipad-touch-active');
      });
      
      element.addEventListener('touchend', () => {
        element.classList.remove('ipad-touch-active');
        // Add slight delay before removing visual feedback
        setTimeout(() => {
          element.classList.remove('ipad-touch-active');
        }, 150);
      });
    });
  }
  
  // Optimize for Apple Pencil
  optimizeForApplePencil() {
    document.documentElement.classList.add('apple-pencil-support');
    
    // Enhance precision for drawing elements
    const drawingElements = document.querySelectorAll('.signature-pad, .drawing-area');
    drawingElements.forEach(element => {
      element.classList.add('pencil-optimized');
    });
    
    // Listen for pencil-specific events
    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'pen') {
        // Handle pencil-specific interactions
        document.documentElement.classList.add('pencil-active');
      }
    });
    
    document.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'pen') {
        document.documentElement.classList.remove('pencil-active');
      }
    });
  }
  
  // Apply kitchen-specific iPad optimizations
  applyKitchenIPadOptimizations() {
    document.documentElement.classList.add('kitchen-ipad');
    
    // Optimize order cards for kitchen view
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
      card.classList.add('kitchen-ipad-card');
    });
    
    // Enhance touch targets for kitchen staff (possibly wearing gloves)
    const actionButtons = document.querySelectorAll('.order-action-button');
    actionButtons.forEach(button => {
      button.classList.add('kitchen-touch-target');
    });
    
    // Optimize for kitchen viewing distance
    document.documentElement.classList.add('kitchen-viewing-distance');
    
    // Add kitchen-specific gestures
    this.addKitchenGestures();
    
    // Optimize for kitchen iPad stand positioning
    if (!this.isPortrait) {
      document.documentElement.classList.add('kitchen-stand-mode');
    }
  }
  
  // Apply server-specific iPad optimizations
  applyServerIPadOptimizations() {
    document.documentElement.classList.add('server-ipad');
    
    // Optimize floor plan for iPad view
    const floorPlan = document.querySelector('.floor-plan');
    if (floorPlan) {
      floorPlan.classList.add('ipad-floor-plan');
    }
    
    // Enhance voice recording button for iPad
    const voiceButton = document.querySelector('.voice-record-button');
    if (voiceButton) {
      voiceButton.classList.add('ipad-voice-button');
    }
    
    // Optimize for one-handed operation
    if (this.isPortrait) {
      document.documentElement.classList.add('one-handed-optimization');
    }
    
    // Add server-specific gestures
    this.addServerGestures();
  }
  
  // Handle safe areas for modern iPads
  handleSafeAreas() {
    // Add support for safe-area-inset variables
    const style = document.createElement('style');
    style.innerHTML = `
      .safe-area-padding {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      .safe-area-bottom {
        padding-bottom: calc(env(safe-area-inset-bottom) + 10px);
      }
    `;
    document.head.appendChild(style);
    
    // Apply safe area padding to key elements
    const navigationElements = document.querySelectorAll('.nav-bar, .bottom-nav, .fixed-bottom');
    navigationElements.forEach(element => {
      element.classList.add('safe-area-padding');
    });
    
    // Special handling for bottom elements (avoid home indicator)
    const bottomElements = document.querySelectorAll('.bottom-bar, .action-bar');
    bottomElements.forEach(element => {
      element.classList.add('safe-area-bottom');
    });
  }
  
  // Optimize for split view multitasking
  optimizeForSplitView() {
    // Add responsive classes for split view
    document.documentElement.classList.add('split-view-support');
    
    // Listen for size changes that might indicate split view
    this.checkForSplitViewSize();
  }
  
  // Check if current dimensions suggest split view
  checkForSplitViewSize() {
    const width = window.innerWidth;
    
    // Typical split view widths
    if (width < 768 && this.isIPad) {
      document.documentElement.classList.add('split-view-active');
      
      // Adjust layout for narrow width
      this.adjustForNarrowWidth();
    } else {
      document.documentElement.classList.remove('split-view-active');
    }
  }
  
  // Adjust layout for narrow split view
  adjustForNarrowWidth() {
    // Collapse side panels
    const sidePanels = document.querySelectorAll('.side-panel, .sidebar');
    sidePanels.forEach(panel => {
      panel.classList.add('collapsed');
    });
    
    // Switch to compact layout
    document.documentElement.classList.add('compact-layout');
  }
  
  // Handle orientation changes
  handleOrientationChange() {
    // Update orientation class
    document.documentElement.classList.remove('portrait', 'landscape');
    document.documentElement.classList.add(this.isPortrait ? 'portrait' : 'landscape');
    
    // Apply orientation-specific optimizations
    if (this.isPortrait) {
      this.applyPortraitOptimizations();
    } else {
      this.applyLandscapeOptimizations();
    }
  }
  
  // Apply portrait-specific optimizations
  applyPortraitOptimizations() {
    // Adjust for portrait mode
    if (document.documentElement.classList.contains('kitchen-ipad')) {
      // Kitchen-specific portrait adjustments
      document.documentElement.classList.remove('kitchen-stand-mode');
      
      // Reorganize order cards for vertical layout
      const orderContainer = document.querySelector('.order-container');
      if (orderContainer) {
        orderContainer.classList.add('vertical-layout');
        orderContainer.classList.remove('horizontal-layout');
      }
    } else {
      // Server-specific portrait adjustments
      document.documentElement.classList.add('one-handed-optimization');
      
      // Adjust floor plan for portrait view
      const floorPlan = document.querySelector('.floor-plan');
      if (floorPlan) {
        floorPlan.classList.add('portrait-view');
        floorPlan.classList.remove('landscape-view');
      }
    }
  }
  
  // Apply landscape-specific optimizations
  applyLandscapeOptimizations() {
    // Adjust for landscape mode
    if (document.documentElement.classList.contains('kitchen-ipad')) {
      // Kitchen-specific landscape adjustments
      document.documentElement.classList.add('kitchen-stand-mode');
      
      // Reorganize order cards for horizontal layout
      const orderContainer = document.querySelector('.order-container');
      if (orderContainer) {
        orderContainer.classList.add('horizontal-layout');
        orderContainer.classList.remove('vertical-layout');
      }
    } else {
      // Server-specific landscape adjustments
      document.documentElement.classList.remove('one-handed-optimization');
      
      // Adjust floor plan for landscape view
      const floorPlan = document.querySelector('.floor-plan');
      if (floorPlan) {
        floorPlan.classList.add('landscape-view');
        floorPlan.classList.remove('portrait-view');
      }
    }
  }
  
  // Add kitchen-specific gestures
  addKitchenGestures() {
    // Add swipe gestures for order management
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
      // Track touch start position
      let startX = 0;
      let startY = 0;
      
      card.addEventListener('touchstart', (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
      });
      
      // Handle swipe gestures
      card.addEventListener('touchend', (event) => {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        
        const diffX = endX - startX;
        const diffY = endY - startY;
        
        // Horizontal swipe detection
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          if (diffX > 0) {
            // Swipe right - mark as complete
            this.completeOrder(card.dataset.orderId);
          } else {
            // Swipe left - mark as in progress
            this.startOrder(card.dataset.orderId);
          }
        }
      });
    });
  }
  
  // Add server-specific gestures
  addServerGestures() {
    // Add table selection gestures
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
      // Double tap to select table
      let lastTap = 0;
      
      table.addEventListener('touchend', (event) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
          // Double tap detected
          this.selectTable(table.dataset.tableId);
          event.preventDefault();
        }
        
        lastTap = currentTime;
      });
    });
    
    // Add long press for table options
    tables.forEach(table => {
      let pressTimer;
      
      table.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          this.showTableOptions(table.dataset.tableId);
        }, 800);
      });
      
      table.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });
    });
  }
  
  // Complete order action
  completeOrder(orderId) {
    // Find the complete button and trigger click
    const completeButton = document.querySelector(`[data-order-id="${orderId}"] .complete-button`);
    if (completeButton) {
      completeButton.click();
    }
  }
  
  // Start order action
  startOrder(orderId) {
    // Find the start button and trigger click
    const startButton = document.querySelector(`[data-order-id="${orderId}"] .start-button`);
    if (startButton) {
      startButton.click();
    }
  }
  
  // Select table action
  selectTable(tableId) {
    // Find the table and trigger selection
    const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
    if (tableElement) {
      // Remove selection from all tables
      document.querySelectorAll('.table.selected').forEach(table => {
        table.classList.remove('selected');
      });
      
      // Select this table
      tableElement.classList.add('selected');
      
      // Update selected table info
      this.updateSelectedTableInfo(tableId);
    }
  }
  
  // Show table options
  showTableOptions(tableId) {
    // Create and show options menu
    const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
    if (tableElement) {
      // Position for the options menu
      const rect = tableElement.getBoundingClientRect();
      
      // Create options menu if it doesn't exist
      let optionsMenu = document.querySelector('.table-options-menu');
      if (!optionsMenu) {
        optionsMenu = document.createElement('div');
        optionsMenu.className = 'table-options-menu';
        document.body.appendChild(optionsMenu);
      }
      
      // Position the menu
      optionsMenu.style.top = `${rect.bottom + 10}px`;
      optionsMenu.style.left = `${rect.left}px`;
      
      // Set menu content
      optionsMenu.innerHTML = `
        <div class="option" data-action="view-orders" data-table-id="${tableId}">View Orders</div>
        <div class="option" data-action="view-residents" data-table-id="${tableId}">View Residents</div>
        <div class="option" data-action="change-status" data-table-id="${tableId}">Change Status</div>
        <div class="option" data-action="add-note" data-table-id="${tableId}">Add Note</div>
      `;
      
      // Show the menu
      optionsMenu.classList.add('visible');
      
      // Add click handlers
      optionsMenu.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => {
          this.handleTableOption(option.dataset.action, option.dataset.tableId);
          optionsMenu.classList.remove('visible');
        });
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', function closeMenu(event) {
        if (!optionsMenu.contains(event.target) && event.target !== tableElement) {
          optionsMenu.classList.remove('visible');
          document.removeEventListener('click', closeMenu);
        }
      });
    }
  }
  
  // Handle table option selection
  handleTableOption(action, tableId) {
    switch (action) {
      case 'view-orders':
        this.viewTableOrders(tableId);
        break;
      case 'view-residents':
        this.viewTableResidents(tableId);
        break;
      case 'change-status':
        this.changeTableStatus(tableId);
        break;
      case 'add-note':
        this.addTableNote(tableId);
        break;
    }
  }
  
  // Update selected table info
  updateSelectedTableInfo(tableId) {
    // Update the selected table info display
    const infoDisplay = document.querySelector('.selected-table-info');
    if (infoDisplay) {
      // Fetch table data (in real implementation, this would be an API call)
      const tableData = this.getTableData(tableId);
      
      // Update display
      infoDisplay.innerHTML = `
        <div class="table-number">Table ${tableData.number}</div>
        <div class="table-residents">${tableData.residents.map(r => r.name).join(', ')}</div>
      `;
    }
  }
  
  // Get table data (placeholder implementation)
  getTableData(tableId) {
    // In a real implementation, this would fetch data from an API
    // This is a placeholder that returns mock data
    return {
      id: tableId,
      number: tableId,
      status: 'occupied',
      residents: [
        { id: 101, name: 'John Smith' },
        { id: 102, name: 'Mary Johnson' }
      ]
    };
  }
  
  // View table orders
  viewTableOrders(tableId) {
    // Navigate to orders view for this table
    window.location.href = `/orders?table=${tableId}`;
  }
  
  // View table residents
  viewTableResidents(tableId) {
    // Navigate to residents view for this table
    window.location.href = `/residents?table=${tableId}`;
  }
  
  // Change table status
  changeTableStatus(tableId) {
    // Show status change dialog
    const dialog = document.createElement('div');
    dialog.className = 'status-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Change Table ${tableId} Status</h3>
        <div class="status-options">
          <button class="status-option" data-status="available">Available</button>
          <button class="status-option" data-status="occupied">Occupied</button>
          <button class="status-option" data-status="reserved">Reserved</button>
          <button class="status-option" data-status="needs-cleaning">Needs Cleaning</button>
        </div>
        <button class="cancel-button">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    dialog.querySelectorAll('.status-option').forEach(option => {
      option.addEventListener('click', () => {
        this.updateTableStatus(tableId, option.dataset.status);
        dialog.remove();
      });
    });
    
    dialog.querySelector('.cancel-button').addEventListener('click', () => {
      dialog.remove();
    });
  }
  
  // Update table status
  updateTableStatus(tableId, status) {
    // In a real implementation, this would call an API
    console.log(`Updating table ${tableId} status to ${status}`);
    
    // Update UI
    const tableElement = document.querySelector(`[data-table-id="${tableId}"]`);
    if (tableElement) {
      // Remove all status classes
      tableElement.classList.remove('available', 'occupied', 'reserved', 'needs-cleaning');
      
      // Add new status class
      tableElement.classList.add(status);
    }
  }
  
  // Add table note
  addTableNote(tableId) {
    // Show note dialog
    const dialog = document.createElement('div');
    dialog.className = 'note-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Add Note for Table ${tableId}</h3>
        <textarea class="note-input" placeholder="Enter note here..."></textarea>
        <div class="dialog-buttons">
          <button class="save-button">Save</button>
          <button class="cancel-button">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add event listeners
    dialog.querySelector('.save-button').addEventListener('click', () => {
      const note = dialog.querySelector('.note-input').value;
      this.saveTableNote(tableId, note);
      dialog.remove();
    });
    
    dialog.querySelector('.cancel-button').addEventListener('click', () => {
      dialog.remove();
    });
  }
  
  // Save table note
  saveTableNote(tableId, note) {
    // In a real implementation, this would call an API
    console.log(`Saving note for table ${tableId}: ${note}`);
    
    // Show confirmation
    const confirmation = document.createElement('div');
    confirmation.className = 'confirmation-toast';
    confirmation.textContent = 'Note saved successfully';
    
    document.body.appendChild(confirmation);
    
    // Remove after 3 seconds
    setTimeout(() => {
      confirmation.remove();
    }, 3000);
  }
  
  // Handle split view change
  handleSplitViewChange() {
    this.checkForSplitViewSize();
  }
  
  // Utility function for debouncing
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize iPad optimizations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.iPadOptimizer = new iPadOptimizer();
});

// Add iPad-specific CSS
const iPadStyles = document.createElement('style');
iPadStyles.innerHTML = `
  /* iPad-specific styles */
  .ipad-device {
    /* Base iPad optimizations */
    --ipad-touch-target-size: 44px;
    --ipad-primary-color: #0072d6;
    --ipad-accent-color: #ff7a00;
    --ipad-success-color: #10b981;
    --ipad-warning-color: #f59e0b;
    --ipad-error-color: #ef4444;
  }
  
  /* Touch target sizing */
  .ipad-touch-target {
    min-width: var(--ipad-touch-target-size);
    min-height: var(--ipad-touch-target-size);
    padding: 12px;
  }
  
  /* Touch feedback */
  .ipad-touch-active {
    transform: scale(0.97);
    opacity: 0.9;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  
  /* Kitchen iPad optimizations */
  .kitchen-ipad .order-card {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .kitchen-ipad-card {
    min-height: 120px;
  }
  
  .kitchen-touch-target {
    min-width: 60px;
    min-height: 60px;
    font-size: 18px;
    padding: 16px;
  }
  
  /* Kitchen viewing distance optimizations */
  .kitchen-viewing-distance {
    font-size: 18px;
  }
  
  .kitchen-viewing-distance h1, 
  .kitchen-viewing-distance h2, 
  .kitchen-viewing-distance h3 {
    font-size: 1.5em;
  }
  
  .kitchen-viewing-distance .order-id,
  .kitchen-viewing-distance .table-number {
    font-size: 1.3em;
    font-weight: bold;
  }
  
  /* Kitchen stand mode (landscape) */
  .kitchen-stand-mode .order-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .kitchen-stand-mode .order-card {
    width: calc(50% - 16px);
    margin-right: 16px;
  }
  
  /* Server iPad optimizations */
  .server-ipad .floor-plan {
    padding: 16px;
    border-radius: 12px;
    background-color: #f8f9fa;
  }
  
  .ipad-floor-plan {
    touch-action: manipulation;
    user-select: none;
  }
  
  .ipad-voice-button {
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background-color: var(--ipad-primary-color);
    color: white;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  
  /* One-handed optimization for portrait mode */
  .one-handed-optimization .action-bar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
  }
  
  .one-handed-optimization .action-button {
    margin-bottom: 12px;
  }
  
  /* Portrait view optimizations */
  .portrait .floor-plan {
    height: 40vh;
  }
  
  .portrait-view .table {
    width: 60px;
    height: 60px;
  }
  
  /* Landscape view optimizations */
  .landscape .floor-plan {
    height: 60vh;
  }
  
  .landscape-view .table {
    width: 80px;
    height: 80px;
  }
  
  /* Split view optimizations */
  .split-view-active {
    font-size: 14px;
  }
  
  .split-view-active .sidebar.collapsed {
    width: 60px;
    overflow: hidden;
  }
  
  .split-view-active .compact-layout .card {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  /* Table options menu */
  .table-options-menu {
    position: absolute;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    z-index: 1000;
    display: none;
    min-width: 180px;
  }
  
  .table-options-menu.visible {
    display: block;
  }
  
  .table-options-menu .option {
    padding: 12px 16px;
    cursor: pointer;
  }
  
  .table-options-menu .option:hover {
    background-color: #f0f4f8;
  }
  
  /* Status dialog */
  .status-dialog, .note-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .dialog-content {
    background-color: white;
    border-radius: 12px;
    padding: 24px;
    width: 80%;
    max-width: 400px;
  }
  
  .status-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 20px 0;
  }
  
  .status-option, .cancel-button, .save-button {
    padding: 16px;
    border-radius: 8px;
    border: none;
    font-size: 16px;
    font-weight: 500;
  }
  
  .status-option {
    background-color: #f0f4f8;
  }
  
  .cancel-button {
    background-color: #f0f4f8;
    width: 100%;
    margin-top: 12px;
  }
  
  /* Note dialog */
  .note-input {
    width: 100%;
    height: 120px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    margin: 16px 0;
    font-size: 16px;
  }
  
  .dialog-buttons {
    display: flex;
    justify-content: space-between;
  }
  
  .dialog-buttons button {
    width: 48%;
    padding: 16px;
    border-radius: 8px;
    border: none;
    font-size: 16px;
    font-weight: 500;
  }
  
  .save-button {
    background-color: var(--ipad-primary-color);
    color: white;
  }
  
  /* Confirmation toast */
  .confirmation-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--ipad-success-color);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 3000;
  }
  
  /* Apple Pencil optimizations */
  .pencil-optimized {
    touch-action: none;
  }
  
  .apple-pencil-support .drawing-area {
    border: 2px solid var(--ipad-primary-color);
  }
  
  .pencil-active .drawing-area {
    border-color: var(--ipad-accent-color);
  }
`;

document.head.appendChild(iPadStyles);
