/**
 * Server View
 * Main JavaScript file for the server view
 */

import { FloorPlan } from './components/floor-plan/FloorPlan.js';
import { VoiceRecorder } from './components/voice/VoiceRecorder.js';
import { postData } from './utils/api.js';

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize floor plan
  const floorPlan = new FloorPlan('floor-plan-container');
  
  // Initialize voice recorder
  const voiceRecorder = new VoiceRecorder();
  
  // Get UI elements
  const selectedTableElement = document.getElementById('selected-table');
  const tableStatusElement = document.getElementById('table-status');
  const orderItemsElement = document.getElementById('order-items');
  const orderTotalElement = document.getElementById('order-total');
  const editOrderButton = document.getElementById('edit-order-btn');
  const confirmationModal = document.getElementById('order-confirmation-modal');
  const confirmationContent = document.getElementById('confirmation-content');
  const cancelOrderButton = document.getElementById('cancel-order-btn');
  const confirmOrderButton = document.getElementById('confirm-order-btn');
  
  // Current order data
  let currentOrder = null;
  
  // Handle table selection
  floorPlan.setOnTableSelect((table) => {
    if (table) {
      // Update UI with selected table info
      selectedTableElement.textContent = `Table ${table.number}`;
      tableStatusElement.textContent = table.status === 'occupied' ? 'Has active order' : 'Available';
      tableStatusElement.className = table.status === 'occupied' ? 'text-sm text-danger' : 'text-sm text-success';
      
      // Enable/disable voice recorder based on table status
      if (table.status === 'occupied') {
        // If table is occupied, we might want to fetch the current order
        fetchTableOrder(table.id);
        editOrderButton.disabled = false;
        voiceRecorder.disable();
      } else {
        // Clear order items if table is available
        orderItemsElement.innerHTML = '<div class="text-secondary-500 text-sm italic">No items in this order</div>';
        orderTotalElement.textContent = '$0.00';
        editOrderButton.disabled = true;
        voiceRecorder.enable();
      }
    } else {
      // No table selected
      selectedTableElement.textContent = 'No Table Selected';
      tableStatusElement.textContent = '';
      orderItemsElement.innerHTML = '<div class="text-secondary-500 text-sm italic">No items in this order</div>';
      orderTotalElement.textContent = '$0.00';
      editOrderButton.disabled = true;
      voiceRecorder.disable();
    }
  });
  
  // Handle voice recording completion
  voiceRecorder.setOnRecordingComplete((audioData) => {
    // In a real implementation, this would send the audio to the server for processing
    // For now, we'll simulate a response
    processVoiceOrder(audioData);
  });
  
  // Fetch order for a table
  async function fetchTableOrder(tableId) {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockOrder = {
        id: 123,
        tableId: tableId,
        items: [
          { name: 'Grilled Salmon', price: 24.99, notes: 'No onions, extra sauce' },
          { name: 'Caesar Salad', price: 12.99, notes: 'Dressing on the side' },
          { name: 'Sparkling Water', price: 4.99, notes: 'With lemon' }
        ],
        status: 'in_progress',
        total: 42.97
      };
      
      // Update UI with order details
      displayOrder(mockOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  }
  
  // Display order in the UI
  function displayOrder(order) {
    currentOrder = order;
    
    // Clear existing items
    orderItemsElement.innerHTML = '';
    
    // Add each item
    order.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'border-b border-secondary-100 pb-2';
      itemElement.innerHTML = `
        <div class="flex justify-between">
          <div class="font-medium">${item.name}</div>
          <div>$${item.price.toFixed(2)}</div>
        </div>
        <div class="text-sm text-secondary-600">${item.notes || ''}</div>
      `;
      orderItemsElement.appendChild(itemElement);
    });
    
    // Update total
    orderTotalElement.textContent = `$${order.total.toFixed(2)}`;
  }
  
  // Process voice order
  function processVoiceOrder(audioData) {
    // In a real implementation, this would send the audio to the server
    // For now, we'll simulate a response with a timeout
    setTimeout(() => {
      // Mock processed order
      const processedOrder = {
        transcription: "I'd like a grilled chicken sandwich with fries and a diet coke.",
        items: [
          { name: 'Grilled Chicken Sandwich', price: 14.99, notes: '' },
          { name: 'French Fries', price: 4.99, notes: '' },
          { name: 'Diet Coke', price: 2.99, notes: '' }
        ],
        total: 22.97
      };
      
      // Show confirmation modal
      showOrderConfirmation(processedOrder);
    }, 1500);
  }
  
  // Show order confirmation modal
  function showOrderConfirmation(processedOrder) {
    // Update confirmation content
    confirmationContent.innerHTML = `
      <p class="mb-2"><strong>Transcription:</strong></p>
      <p class="mb-4 text-secondary-600 italic">"${processedOrder.transcription}"</p>
      <p class="mb-2"><strong>Items:</strong></p>
      <ul class="mb-4 space-y-2">
        ${processedOrder.items.map(item => `
          <li class="flex justify-between">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
          </li>
        `).join('')}
      </ul>
      <div class="flex justify-between font-bold">
        <span>Total:</span>
        <span>$${processedOrder.total.toFixed(2)}</span>
      </div>
    `;
    
    // Store the processed order for later use
    currentOrder = {
      tableId: floorPlan.selectedTable,
      items: processedOrder.items,
      total: processedOrder.total,
      transcription: processedOrder.transcription
    };
    
    // Show the modal
    confirmationModal.classList.remove('hidden');
  }
  
  // Handle order confirmation
  confirmOrderButton.addEventListener('click', () => {
    // Hide the modal
    confirmationModal.classList.add('hidden');
    
    // Submit the order
    submitOrder();
  });
  
  // Handle order cancellation
  cancelOrderButton.addEventListener('click', () => {
    // Hide the modal
    confirmationModal.classList.add('hidden');
    
    // Reset the voice recorder status
    voiceRecorder.statusElement.textContent = 'Ready to record';
  });
  
  // Submit the order
  async function submitOrder() {
    try {
      // In a real implementation, this would send to the API
      // For now, we'll just update the UI
      
      // Update the table status
      floorPlan.updateTableStatus(floorPlan.selectedTable, 'occupied');
      
      // Update the order display
      displayOrder({
        ...currentOrder,
        id: Math.floor(Math.random() * 1000),
        status: 'pending'
      });
      
      // Update UI elements
      tableStatusElement.textContent = 'Has active order';
      tableStatusElement.className = 'text-sm text-danger';
      editOrderButton.disabled = false;
      voiceRecorder.disable();
      
      // Show success message
      voiceRecorder.statusElement.textContent = 'Order submitted successfully';
    } catch (error) {
      console.error('Error submitting order:', error);
      voiceRecorder.statusElement.textContent = 'Error submitting order';
    }
  }
  
  // Handle edit order button
  editOrderButton.addEventListener('click', () => {
    // In a real implementation, this would open an edit interface
    alert('Edit order functionality would be implemented here');
  });
});
