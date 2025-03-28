/**
 * Enhanced Server View JavaScript
 * Main script for the server view with improved UI/UX
 */

import { FloorPlan } from '/static/js/components/floor-plan/FloorPlan.js';
import { VoiceRecorder } from '/static/js/components/voice/VoiceRecorder.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Server View loaded');
  
  // View switcher toggle
  const viewSwitcherToggle = document.getElementById('view-switcher-toggle');
  const viewMenu = document.getElementById('view-menu');
  
  viewSwitcherToggle.addEventListener('click', function() {
    viewMenu.classList.toggle('hidden');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!viewSwitcherToggle.contains(event.target) && !viewMenu.contains(event.target)) {
      viewMenu.classList.add('hidden');
    }
  });
  
  // Add floor plan controls
  addFloorPlanControls();
  
  // Check if user is admin (in a real app, this would be from auth)
  const isAdmin = window.location.search.includes('admin=true');
  
  // Initialize floor plan with useExistingTables set to true
  const floorPlan = new FloorPlan('floor-plan', {
    useExistingTables: true,
    adminMode: isAdmin
  });
  
  // DOM Elements - Order Section
  const selectedTable = document.getElementById('selected-table-number');
  const tableStatus = document.getElementById('table-status');
  const noTableSelected = document.getElementById('no-table-selected');
  const tableSelected = document.getElementById('table-selected');
  const voiceOrderBtn = document.getElementById('voice-order-btn');
  
  // Add floor plan edit button (only for admin)
  const floorPlanHeader = document.querySelector('h2.text-xl.font-semibold.text-gray-800.mb-4');
  if (floorPlanHeader && isAdmin) {
    const editButton = document.createElement('button');
    editButton.id = 'edit-floor-plan-btn';
    editButton.className = 'ml-2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors';
    editButton.innerHTML = 'Edit Floor Plan';
    editButton.addEventListener('click', () => {
      floorPlan.enableEditMode();
      editButton.classList.add('hidden');
      document.getElementById('done-editing-btn').classList.remove('hidden');
    });
    
    const doneButton = document.createElement('button');
    doneButton.id = 'done-editing-btn';
    doneButton.className = 'ml-2 bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 transition-colors hidden';
    doneButton.innerHTML = 'Done Editing';
    doneButton.addEventListener('click', () => {
      floorPlan.disableEditMode();
      doneButton.classList.add('hidden');
      editButton.classList.remove('hidden');
    });
    
    floorPlanHeader.appendChild(editButton);
    floorPlanHeader.appendChild(doneButton);
  }
  
  /**
   * Add floor plan controls for zoom and layout
   */
  function addFloorPlanControls() {
    const floorPlanContainer = document.getElementById('floor-plan');
    if (!floorPlanContainer) return;
    
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'floor-plan-controls';
    controlsContainer.className = 'flex items-center space-x-2 mb-2';
    
    // Add zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'flex items-center space-x-1 bg-white rounded-md shadow-sm p-1';
    
    const zoomInBtn = document.createElement('button');
    zoomInBtn.id = 'zoom-in-btn';
    zoomInBtn.className = 'w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none';
    zoomInBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>';
    zoomInBtn.title = 'Zoom In';
    
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.id = 'zoom-out-btn';
    zoomOutBtn.className = 'w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none';
    zoomOutBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path></svg>';
    zoomOutBtn.title = 'Zoom Out';
    
    const zoomResetBtn = document.createElement('button');
    zoomResetBtn.id = 'zoom-reset-btn';
    zoomResetBtn.className = 'w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none';
    zoomResetBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>';
    zoomResetBtn.title = 'Reset Zoom';
    
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomResetBtn);
    
    // Add layout controls
    const layoutControls = document.createElement('div');
    layoutControls.className = 'flex items-center space-x-1 bg-white rounded-md shadow-sm p-1';
    
    const gridToggleBtn = document.createElement('button');
    gridToggleBtn.id = 'grid-toggle-btn';
    gridToggleBtn.className = 'w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none';
    gridToggleBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>';
    gridToggleBtn.title = 'Toggle Grid';
    
    const snapToggleBtn = document.createElement('button');
    snapToggleBtn.id = 'snap-toggle-btn';
    snapToggleBtn.className = 'w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none';
    snapToggleBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>';
    snapToggleBtn.title = 'Toggle Snap to Grid';
    
    layoutControls.appendChild(gridToggleBtn);
    layoutControls.appendChild(snapToggleBtn);
    
    // Add controls to container
    controlsContainer.appendChild(zoomControls);
    controlsContainer.appendChild(layoutControls);
    
    // Insert controls before floor plan
    floorPlanContainer.parentNode.insertBefore(controlsContainer, floorPlanContainer);
    
    // Add event listeners for zoom controls
    zoomInBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        const currentScale = parseFloat(floorPlanEl.style.transform?.replace('scale(', '').replace(')', '') || '1');
        floorPlanEl.style.transform = `scale(${Math.min(2, currentScale + 0.1)})`;
      }
    });
    
    zoomOutBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        const currentScale = parseFloat(floorPlanEl.style.transform?.replace('scale(', '').replace(')', '') || '1');
        floorPlanEl.style.transform = `scale(${Math.max(0.5, currentScale - 0.1)})`;
      }
    });
    
    zoomResetBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        floorPlanEl.style.transform = 'scale(1)';
      }
    });
    
    // Add event listeners for layout controls
    gridToggleBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        floorPlanEl.classList.toggle('show-grid');
        gridToggleBtn.classList.toggle('bg-indigo-100');
      }
    });
    
    snapToggleBtn.addEventListener('click', () => {
      const floorPlanEl = document.getElementById('floor-plan');
      if (floorPlanEl) {
        floorPlanEl.classList.toggle('snap-to-grid');
        snapToggleBtn.classList.toggle('bg-indigo-100');
      }
    });
  }
  
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
      
      // Update UI based on table mode
      updateTableModeUI(floorPlan.tableMode);
      
      // Enable voice order button when table is selected
      // Default to seat S1 if no seat is explicitly selected
      if (voiceOrderBtn) {
        voiceOrderBtn.disabled = false;
        
        // Create default seat info if it doesn't exist
        const selectedSeatElement = document.getElementById('selected-seat');
        if (!selectedSeatElement) {
          const seatInfo = document.createElement('div');
          seatInfo.className = 'flex items-center mb-4';
          seatInfo.innerHTML = `
            <div class="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
            <p class="text-gray-700">Seat: <span id="selected-seat" class="font-medium">S1</span></p>
          `;
          
          // Insert after table status
          const tableStatusElement = document.querySelector('#status-indicator').parentNode;
          tableStatusElement.parentNode.insertBefore(seatInfo, tableStatusElement.nextSibling);
        }
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
  
  // Set up seat selection handler
  floorPlan.setOnSeatSelect((table, seatNumber) => {
    if (table && seatNumber) {
      // Update selected seat info
      const selectedSeatElement = document.getElementById('selected-seat');
      if (selectedSeatElement) {
        selectedSeatElement.textContent = seatNumber;
      } else {
        // Create seat info element if it doesn't exist
        const seatInfo = document.createElement('div');
        seatInfo.className = 'flex items-center mb-4';
        seatInfo.innerHTML = `
          <div class="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
          <p class="text-gray-700">Seat: <span id="selected-seat" class="font-medium">${seatNumber}</span></p>
        `;
        
        // Insert after table status
        const tableStatusElement = document.querySelector('#status-indicator').parentNode;
        tableStatusElement.parentNode.insertBefore(seatInfo, tableStatusElement.nextSibling);
      }
      
      // Enable voice order button
      if (voiceOrderBtn) {
        voiceOrderBtn.disabled = false;
      }
    }
  });
  
  // Set up seat long press handler for recording
  floorPlan.setOnSeatLongPress((tableId, seatNumber) => {
    // Start recording directly when seat is long-pressed
    startRecording(tableId, seatNumber);
  });
  
  /**
   * Update UI based on table mode
   * @param {boolean} tableMode - Whether we're in table detail mode
   */
  function updateTableModeUI(tableMode) {
    const tableDetailSection = document.getElementById('table-detail-section');
    const tableInfoSection = document.getElementById('table-info-section');
    
    if (tableMode) {
      // Show table detail view with seats
      if (tableDetailSection) {
        tableDetailSection.classList.remove('hidden');
      } else {
        // Create table detail section if it doesn't exist
        const detailSection = document.createElement('div');
        detailSection.id = 'table-detail-section';
        detailSection.className = 'bg-indigo-50 rounded-lg p-4 mb-4';
        detailSection.innerHTML = `
          <h4 class="text-lg font-semibold text-gray-800 mb-2">Table Detail View</h4>
          <p class="text-gray-600 mb-4">Select a seat to place an order or press and hold on a seat to start recording.</p>
        `;
        
        // Insert before voice order section
        const voiceOrderSection = document.querySelector('.bg-gray-50.rounded-lg.p-6.mb-6');
        if (voiceOrderSection) {
          voiceOrderSection.parentNode.insertBefore(detailSection, voiceOrderSection);
        }
      }
      
      // Update voice order section text
      const voiceOrderHeading = document.querySelector('.bg-gray-50.rounded-lg.p-6.mb-6 h4');
      if (voiceOrderHeading) {
        voiceOrderHeading.textContent = 'Seat Order';
      }
      
      const voiceOrderText = document.querySelector('.bg-gray-50.rounded-lg.p-6.mb-6 p');
      if (voiceOrderText) {
        voiceOrderText.textContent = 'Click the button below to record an order for the selected seat.';
      }
    } else {
      // Hide table detail view
      if (tableDetailSection) {
        tableDetailSection.classList.add('hidden');
      }
      
      // Reset voice order section text
      const voiceOrderHeading = document.querySelector('.bg-gray-50.rounded-lg.p-6.mb-6 h4');
      if (voiceOrderHeading) {
        voiceOrderHeading.textContent = 'Voice Order';
      }
      
      const voiceOrderText = document.querySelector('.bg-gray-50.rounded-lg.p-6.mb-6 p');
      if (voiceOrderText) {
        voiceOrderText.textContent = 'Click the button below to record an order using your voice.';
      }
      
      // Remove selected seat info if it exists
      const selectedSeatElement = document.getElementById('selected-seat');
      if (selectedSeatElement) {
        selectedSeatElement.parentNode.parentNode.remove();
      }
    }
  }
  
  // Table selection (fallback for the FloorPlan component)
  const tables = document.querySelectorAll('.table');
  tables.forEach(table => {
    table.addEventListener('click', function() {
      const tableId = this.getAttribute('data-table-id');
      const tableStatus = this.classList.contains('available') ? 'Available' : 'Occupied';
      
      // Update selected table
      selectedTable.textContent = tableId;
      document.getElementById('table-status').textContent = tableStatus;
      
      // Show table selected view
      noTableSelected.classList.add('hidden');
      tableSelected.classList.remove('hidden');
      
      // Update status indicator color
      const statusIndicator = document.getElementById('status-indicator');
      statusIndicator.className = tableStatus === 'Available' ?
        'w-3 h-3 rounded-full bg-green-500 mr-2' :
        'w-3 h-3 rounded-full bg-red-500 mr-2';
      
      // Enable voice order button
      voiceOrderBtn.disabled = false;
      
      // Highlight selected table
      tables.forEach(t => t.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  /**
   * Start recording for a specific table and seat
   * @param {number} tableId - Table ID
   * @param {string} seatNumber - Seat number
   */
  function startRecording(tableId, seatNumber) {
    console.log(`Starting recording for Table ${tableId}, Seat ${seatNumber}`);
    
    const modal = document.getElementById('voice-recorder-modal');
    if (!modal) {
      console.error('Voice recorder modal not found');
      return;
    }
    
    // Update modal title to include table and seat
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
      modalTitle.textContent = `Record Order for Table ${tableId} - ${seatNumber}`;
    }
    
    // Show the modal
    modal.classList.remove('hidden');
    
    try {
      // Initialize voice recorder
      const voiceRecorder = new VoiceRecorder({
        recordButtonId: 'record-button',
        statusElementId: 'record-status'
      });
      
      // Store table and seat info for order submission
      modal.dataset.tableId = tableId;
      modal.dataset.seatNumber = seatNumber;
      
      // Set up recording start handler
      voiceRecorder.setOnRecordingStart(() => {
        console.log('Recording started, setting up audio visualization');
        try {
          // Set up audio visualization
          if (typeof window.setupAudioVisualization !== 'function') {
            console.error('setupAudioVisualization function not found');
            return;
          }
          window.setupAudioVisualization(voiceRecorder.stream);
        } catch (error) {
          console.error('Error setting up audio visualization:', error);
        }
      });
      
      
      // Set up recording completion handler - now receives audioBlob directly
      voiceRecorder.setOnRecordingComplete(async (audioBlob) => {
        console.log('[server-view] setOnRecordingComplete callback started.'); // Log: Start callback
        // Stop audio visualization
        if (typeof window.stopAudioVisualization === 'function') {
          window.stopAudioVisualization();
        } else {
          console.error('stopAudioVisualization function not found');
        }
        
        // Status message already set by VoiceRecorder
        // document.getElementById('record-status').textContent = 'Processing audio...';
        
        try {
          if (!audioBlob || audioBlob.size === 0) {
             console.error('[server-view] Received invalid or empty audioBlob.');
             document.getElementById('record-status').textContent = 'Error: Received empty audio data.';
             return; // Stop processing if blob is bad
          }
          console.log('[server-view] Received valid audio blob of size:', audioBlob.size, 'bytes with type', audioBlob.type);
          
          console.log('[server-view] Creating FormData...'); // Log: Before FormData
          // Create form data with the received audio blob
          const formData = new FormData();
          console.log('[server-view] FormData created.'); // Log: After FormData
          
          
          // Use a fixed .wav filename to match the backend expectation
          const filename = 'recording.wav';
          
          console.log(`[server-view] Appending blob to FormData with filename: ${filename}...`); // Log: Before append
          // Add blob directly to form data
          formData.append('audio', audioBlob, filename);
          // Log form data contents
          for (const pair of formData.entries()) {
            console.log('Form data entry:', pair[0], pair[1]);
          }
          
          // Send to server for transcription
          console.log(`[server-view] Preparing fetch to /api/speech/transcribe with blob type: ${audioBlob.type} and filename: ${filename}`); // Log: Before fetch
          console.log('Sending audio to server for transcription...');
          const response = await fetch('/api/speech/transcribe', {
            method: 'POST',
            body: formData
          });
          
          console.log('Server response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`Failed to transcribe audio: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('Transcription result:', result);
          
          // Show transcription result
          const modalTranscriptionResult = document.getElementById('modal-transcription-result');
          const modalTranscriptionText = document.getElementById('modal-transcription-text');
          
          if (result.text && result.text.trim()) {
            modalTranscriptionResult.classList.remove('hidden');
            modalTranscriptionText.textContent = result.text;
            
            // Update status
            document.getElementById('record-status').textContent = 'Transcription complete';
          } else {
            throw new Error('No transcription text returned from server');
          }
          
        } catch (error) {
          console.error('Error transcribing audio:', error);
          document.getElementById('record-status').textContent = 'Error: ' + error.message;
          
          // Show error message in transcription area
          const modalTranscriptionResult = document.getElementById('modal-transcription-result');
          const modalTranscriptionText = document.getElementById('modal-transcription-text');
          
          modalTranscriptionResult.classList.remove('hidden');
          modalTranscriptionText.textContent = `Error: ${error.message}. Please try again and speak clearly.`;
          modalTranscriptionText.classList.add('text-red-600');
          
          // Add retry button
          const retryBtn = document.getElementById('retry-recording-btn');
          if (retryBtn) {
            retryBtn.focus();
          }
        }
      });
      
      // Set up recording cancel handler
      voiceRecorder.setOnRecordingCancel(() => {
        // Stop audio visualization
        if (typeof window.stopAudioVisualization === 'function') {
          window.stopAudioVisualization();
        } else {
          console.error('stopAudioVisualization function not found');
        }
      });
    } catch (error) {
      console.error('Error initializing voice recorder:', error);
      document.getElementById('record-status').textContent = `Error: ${error.message}`;
    }
  }
  
  // Voice order button
  if (voiceOrderBtn) {
    voiceOrderBtn.addEventListener('click', () => {
      // Get the selected table and seat
      const tableId = parseInt(selectedTable.textContent);
      const seatNumber = document.getElementById('selected-seat')?.textContent || 'S1';
      
      // Start recording for the selected table and seat
      startRecording(tableId, seatNumber);
    });
  }
  
  // Close modal button
  const closeModalBtn = document.getElementById('close-voice-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('voice-recorder-modal');
      if (modal) {
        modal.classList.add('hidden');
        
        // Stop audio visualization if active
        if (typeof window.stopAudioVisualization === 'function') {
          window.stopAudioVisualization();
        } else {
          console.error('stopAudioVisualization function not found');
        }
      }
    });
  }
  
  // Retry recording button
  const retryRecordingBtn = document.getElementById('retry-recording-btn');
  if (retryRecordingBtn) {
    retryRecordingBtn.addEventListener('click', () => {
      const modalTranscriptionResult = document.getElementById('modal-transcription-result');
      modalTranscriptionResult.classList.add('hidden');
      document.getElementById('record-status').textContent = 'Press and hold to record';
    });
  }
  
  // Confirm order button
  const confirmOrderBtn = document.getElementById('confirm-order-btn');
  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', () => {
      // Get the transcription text
      const transcriptionText = document.getElementById('modal-transcription-text').textContent;
      
      // Get the selected table number and seat
      const modal = document.getElementById('voice-recorder-modal');
      const tableNumber = modal.dataset.tableId || document.getElementById('selected-table-number').textContent;
      const seatNumber = modal.dataset.seatNumber || 'S1';
      
      // Close the modal
      modal.classList.add('hidden');
      
      // Show the transcription in the main view
      const transcriptionResult = document.getElementById('transcription-result');
      const transcriptionTextElement = document.getElementById('transcription-text');
      
      transcriptionResult.classList.remove('hidden');
      transcriptionTextElement.textContent = transcriptionText;
      
      // Add seat information to the transcription result
      const seatInfo = document.createElement('div');
      seatInfo.className = 'text-sm text-gray-500 mt-1';
      seatInfo.textContent = `Table ${tableNumber} - Seat ${seatNumber}`;
      transcriptionTextElement.parentNode.appendChild(seatInfo);
    });
  }
  
  // Submit order button
  const submitOrderBtn = document.getElementById('submit-order-btn');
  if (submitOrderBtn) {
    submitOrderBtn.addEventListener('click', async function() {
      try {
        // Get the transcription text
        const transcriptionText = document.getElementById('transcription-text').textContent;
        
        // Get the selected table number and seat
        const tableNumber = document.getElementById('selected-table-number').textContent;
        const seatInfo = document.querySelector('#transcription-text + .text-sm');
        const seatNumber = seatInfo ? seatInfo.textContent.split('-')[1].trim().replace('Seat ', '') : 'S1';
        
        // Create order data
        const orderData = {
          table_id: parseInt(tableNumber),
          seat: seatNumber,
          details: transcriptionText,
          raw_transcription: transcriptionText
        };
        
        // Send order to server
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit order');
        }
        
        // Hide transcription result
        const transcriptionResult = document.getElementById('transcription-result');
        transcriptionResult.classList.add('hidden');
        
        // Show notification
        const notification = document.getElementById('notification');
        notification.classList.remove('transform', 'translate-x-full');
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          notification.classList.add('transform', 'translate-x-full');
        }, 3000);
        
      } catch (error) {
        console.error('Error submitting order:', error);
        alert('Error submitting order: ' + error.message);
      }
    });
  }
  
  // Notification close button
  const notificationCloseBtn = document.getElementById('notification-close');
  if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener('click', () => {
      const notification = document.getElementById('notification');
      notification.classList.add('transform', 'translate-x-full');
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
