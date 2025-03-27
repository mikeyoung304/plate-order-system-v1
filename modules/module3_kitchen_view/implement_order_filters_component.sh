#!/bin/bash

# Task: Implement Order Filters Component
# This script creates the JavaScript component for order filtering in the kitchen view

echo "Starting task: Implement Order Filters Component"
echo "========================================"

# Set up variables
PROJECT_ROOT="$(pwd)"
JS_DIR="$PROJECT_ROOT/app/static/js/components/orders"
ORDER_FILTERS_JS="$JS_DIR/OrderFilters.js"

# Create the components directory if it doesn't exist
mkdir -p "$JS_DIR"

# Create the order filters component
echo "Creating order filters component..."
cat > "$ORDER_FILTERS_JS" << 'EOF'
/**
 * OrderFilters Component
 * Handles filtering, sorting, and view options for the kitchen display system
 */
export class OrderFilters {
    /**
     * Create a new OrderFilters instance
     * @param {Function} onFilterChange - Callback for when filters change
     * @param {Function} onViewChange - Callback for when view mode changes
     * @param {Function} onRefresh - Callback for when refresh is requested
     */
    constructor(onFilterChange, onViewChange, onRefresh) {
        this.onFilterChange = onFilterChange;
        this.onViewChange = onViewChange;
        this.onRefresh = onRefresh;
        
        // Filter state
        this.currentFilter = 'pending';
        this.currentView = 'grid';
        
        // DOM elements
        this.filterSelect = document.getElementById('order-filter');
        this.gridViewBtn = document.getElementById('grid-view-btn');
        this.listViewBtn = document.getElementById('list-view-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        this.init();
    }
    
    /**
     * Initialize the filters component
     */
    init() {
        this.setupEventListeners();
        this.restorePreferences();
    }
    
    /**
     * Set up event listeners for filter controls
     */
    setupEventListeners() {
        // Filter change
        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', () => {
                this.currentFilter = this.filterSelect.value;
                this.savePreferences();
                this.onFilterChange(this.currentFilter);
            });
        }
        
        // View toggle
        if (this.gridViewBtn) {
            this.gridViewBtn.addEventListener('click', () => {
                this.setViewMode('grid');
            });
        }
        
        if (this.listViewBtn) {
            this.listViewBtn.addEventListener('click', () => {
                this.setViewMode('list');
            });
        }
        
        // Refresh button
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.onRefresh();
                
                // Add animation class
                this.refreshBtn.classList.add('animate-spin');
                setTimeout(() => {
                    this.refreshBtn.classList.remove('animate-spin');
                }, 1000);
            });
        }
        
        // Fullscreen button
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }
    
    /**
     * Set the current view mode (grid or list)
     * @param {string} mode - The view mode ('grid' or 'list')
     */
    setViewMode(mode) {
        this.currentView = mode;
        
        // Update button states
        this.gridViewBtn.classList.toggle('active', mode === 'grid');
        this.listViewBtn.classList.toggle('active', mode === 'list');
        
        // Save preference
        this.savePreferences();
        
        // Notify parent component
        this.onViewChange(mode);
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('kitchen-view-filter', this.currentFilter);
            localStorage.setItem('kitchen-view-mode', this.currentView);
        } catch (error) {
            console.warn('Could not save preferences to localStorage:', error);
        }
    }
    
    /**
     * Restore user preferences from localStorage
     */
    restorePreferences() {
        try {
            // Restore filter
            const savedFilter = localStorage.getItem('kitchen-view-filter');
            if (savedFilter && this.filterSelect) {
                this.filterSelect.value = savedFilter;
                this.currentFilter = savedFilter;
                // Trigger the filter change callback
                this.onFilterChange(savedFilter);
            }
            
            // Restore view mode
            const savedView = localStorage.getItem('kitchen-view-mode');
            if (savedView) {
                this.setViewMode(savedView);
            }
        } catch (error) {
            console.warn('Could not restore preferences from localStorage:', error);
        }
    }
    
    /**
     * Get the current filter value
     * @returns {string} The current filter value
     */
    getCurrentFilter() {
        return this.currentFilter;
    }
    
    /**
     * Get the current view mode
     * @returns {string} The current view mode ('grid' or 'list')
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Set the filter programmatically
     * @param {string} filter - The filter value to set
     */
    setFilter(filter) {
        if (this.filterSelect && this.filterSelect.querySelector(`option[value="${filter}"]`)) {
            this.filterSelect.value = filter;
            this.currentFilter = filter;
            this.savePreferences();
            this.onFilterChange(filter);
        }
    }
    
    /**
     * Update the order counts displayed in the UI
     * @param {Object} counts - Object containing counts for different order statuses
     */
    updateCounts(counts) {
        const pendingCount = document.getElementById('pending-count');
        const inProgressCount = document.getElementById('in-progress-count');
        const readyCount = document.getElementById('ready-count');
        const totalCount = document.getElementById('total-count');
        
        if (pendingCount) pendingCount.textContent = counts.pending || 0;
        if (inProgressCount) inProgressCount.textContent = counts.in_progress || 0;
        if (readyCount) readyCount.textContent = counts.ready || 0;
        if (totalCount) totalCount.textContent = counts.total || 0;
    }
}
EOF
echo "Order filters component created."

echo "Task completed: Implement Order Filters Component"
exit 0