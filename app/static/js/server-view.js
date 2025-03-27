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
