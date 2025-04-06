// iPad-Specific Voice Recognition Enhancements
// This file contains optimizations for voice recognition on iPad devices
// used by servers in assisted living facilities

class iPadVoiceRecognition {
  constructor() {
    this.isRecording = false;
    this.audioContext = null;
    this.audioStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.visualizerNodes = null;
    this.visualizerIntervalId = null;
    this.recordingTimeout = null;
    this.maxRecordingTime = 30000; // 30 seconds max recording time
    this.minRecordingTime = 1000; // 1 second minimum recording time
    this.audioVisualizerBars = 40; // Number of bars in the visualizer
    
    // DOM Elements
    this.voiceButton = document.querySelector('.voice-record-button');
    this.audioVisualization = document.querySelector('.audio-visualization');
    this.transcriptionDisplay = document.querySelector('.transcription-display');
    this.confirmButton = document.querySelector('.confirm-button');
    this.cancelButton = document.querySelector('.cancel-button');
    
    // Initialize if elements exist
    if (this.voiceButton && this.audioVisualization) {
      this.initializeVoiceRecognition();
    }
  }
  
  // Initialize voice recognition
  initializeVoiceRecognition() {
    // Create audio bars for visualization
    this.createAudioBars();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check for microphone permission
    this.checkMicrophonePermission();
  }
  
  // Create audio visualization bars
  createAudioBars() {
    if (!this.audioVisualization) return;
    
    // Clear existing bars
    this.audioVisualization.innerHTML = '';
    
    // Create bars
    for (let i = 0; i < this.audioVisualizerBars; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      this.audioVisualization.appendChild(bar);
    }
  }
  
  // Set up event listeners
  setupEventListeners() {
    if (!this.voiceButton) return;
    
    // iPad-optimized touch events for voice button
    this.voiceButton.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default behavior
      this.startRecording();
    });
    
    this.voiceButton.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent default behavior
      this.stopRecording();
    });
    
    // Add cancel and confirm button listeners
    if (this.confirmButton) {
      this.confirmButton.addEventListener('click', () => {
        this.confirmTranscription();
      });
    }
    
    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', () => {
        this.cancelTranscription();
      });
    }
    
    // Add keyboard support for accessibility
    this.voiceButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!this.isRecording) {
          this.startRecording();
        } else {
          this.stopRecording();
        }
      }
    });
  }
  
  // Check microphone permission
  async checkMicrophonePermission() {
    try {
      // Request microphone access to check permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      // Permission granted
      this.voiceButton.disabled = false;
      
      // Show ready state
      this.showToast('Microphone ready', 'success');
    } catch (error) {
      // Permission denied or error
      console.error('Microphone permission error:', error);
      this.voiceButton.disabled = true;
      
      // Show error message
      this.showToast('Microphone access denied. Please enable in Settings.', 'error');
    }
  }
  
  // Start recording
  async startRecording() {
    if (this.isRecording) return;
    
    try {
      // Reset audio chunks
      this.audioChunks = [];
      
      // Get audio stream with iPad-optimized settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      };
      
      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Set up audio nodes for visualization
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      this.visualizerNodes = {
        source,
        analyser
      };
      
      // Create media recorder with iPad-compatible settings
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // Handle data available event
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      // Handle recording stop event
      this.mediaRecorder.addEventListener('stop', () => {
        this.processAudioData();
      });
      
      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Update UI
      this.updateRecordingUI(true);
      
      // Start visualization
      this.startVisualization();
      
      // Set maximum recording time
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.maxRecordingTime);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showToast('Could not start recording. Please try again.', 'error');
    }
  }
  
  // Stop recording
  stopRecording() {
    // Check if we're recording and minimum time has passed
    if (!this.isRecording) return;
    
    // Check if minimum recording time has passed
    const recordingTime = Date.now() - this.recordingStartTime;
    if (recordingTime < this.minRecordingTime) {
      this.showToast('Please hold to record longer', 'error');
      return;
    }
    
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Clean up audio context
    if (this.visualizerNodes) {
      this.visualizerNodes.source.disconnect();
    }
    
    // Stop visualization
    this.stopVisualization();
    
    // Clear timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
    }
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.updateRecordingUI(false);
    
    // Show processing indicator
    this.transcriptionDisplay.textContent = 'Processing...';
  }
  
  // Process recorded audio data
  processAudioData() {
    if (this.audioChunks.length === 0) {
      this.transcriptionDisplay.textContent = 'No audio recorded. Please try again.';
      return;
    }
    
    // Create blob from audio chunks
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
    
    // Create form data for API request
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Send to server for transcription
    fetch('/api/speech/transcribe', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      return response.json();
    })
    .then(data => {
      // Display transcription
      this.displayTranscription(data.text);
      
      // Check for dietary alerts
      this.checkDietaryAlerts(data.text);
    })
    .catch(error => {
      console.error('Error transcribing audio:', error);
      this.transcriptionDisplay.textContent = 'Could not transcribe audio. Please try again.';
      this.showToast('Transcription failed. Please try again.', 'error');
    });
  }
  
  // Display transcription
  displayTranscription(text) {
    if (!this.transcriptionDisplay) return;
    
    if (!text || text.trim() === '') {
      this.transcriptionDisplay.textContent = 'Could not understand audio. Please try again.';
      return;
    }
    
    // Format and display transcription
    this.transcriptionDisplay.textContent = text;
    
    // Show confirmation buttons
    this.showConfirmationButtons();
  }
  
  // Check for dietary alerts based on transcription and selected table
  checkDietaryAlerts(text) {
    // Get selected table
    const selectedTable = document.querySelector('.table.selected');
    if (!selectedTable) return;
    
    const tableId = selectedTable.dataset.tableId;
    
    // Get resident dietary restrictions (in real app, this would come from API)
    fetch(`/api/tables/${tableId}/residents`)
    .then(response => response.json())
    .then(data => {
      // Check for dietary restrictions
      const dietaryAlerts = [];
      
      data.residents.forEach(resident => {
        if (!resident.dietaryRestrictions) return;
        
        resident.dietaryRestrictions.forEach(restriction => {
          // Check if order contains restricted items
          if (this.textContainsRestriction(text, restriction)) {
            dietaryAlerts.push(`${resident.name} - ${restriction}`);
          }
        });
      });
      
      // Display alerts if any
      if (dietaryAlerts.length > 0) {
        this.showDietaryAlerts(dietaryAlerts);
      }
    })
    .catch(error => {
      console.error('Error checking dietary alerts:', error);
    });
  }
  
  // Check if text contains dietary restriction
  textContainsRestriction(text, restriction) {
    // Simple implementation - in real app, this would be more sophisticated
    const restrictionTerms = {
      'No nuts': ['nuts', 'peanuts', 'almonds', 'walnuts', 'pecans'],
      'Gluten-free': ['gluten', 'wheat', 'bread', 'pasta', 'flour'],
      'Dairy-free': ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
      'Low sodium': ['salt', 'sodium', 'soy sauce', 'broth'],
      'Diabetic': ['sugar', 'syrup', 'honey', 'sweet']
    };
    
    const terms = restrictionTerms[restriction] || [];
    const lowerText = text.toLowerCase();
    
    return terms.some(term => lowerText.includes(term.toLowerCase()));
  }
  
  // Show dietary alerts
  showDietaryAlerts(alerts) {
    const alertContainer = document.querySelector('.dietary-alert');
    if (!alertContainer) return;
    
    // Create alert content
    const alertText = document.querySelector('.dietary-alert-text');
    if (alertText) {
      alertText.textContent = alerts.join(', ');
    }
    
    // Show alert
    alertContainer.style.display = 'flex';
  }
  
  // Hide dietary alerts
  hideDietaryAlerts() {
    const alertContainer = document.querySelector('.dietary-alert');
    if (alertContainer) {
      alertContainer.style.display = 'none';
    }
  }
  
  // Show confirmation buttons
  showConfirmationButtons() {
    const confirmationButtons = document.querySelector('.order-confirmation-buttons');
    if (confirmationButtons) {
      confirmationButtons.style.display = 'flex';
    }
  }
  
  // Hide confirmation buttons
  hideConfirmationButtons() {
    const confirmationButtons = document.querySelector('.order-confirmation-buttons');
    if (confirmationButtons) {
      confirmationButtons.style.display = 'none';
    }
  }
  
  // Confirm transcription
  confirmTranscription() {
    if (!this.transcriptionDisplay) return;
    
    const transcription = this.transcriptionDisplay.textContent;
    if (!transcription || transcription === 'Processing...' || 
        transcription === 'Could not understand audio. Please try again.') {
      return;
    }
    
    // Get selected table
    const selectedTable = document.querySelector('.table.selected');
    if (!selectedTable) {
      this.showToast('Please select a table first', 'error');
      return;
    }
    
    const tableId = selectedTable.dataset.tableId;
    
    // Send order to server
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tableId,
        orderText: transcription,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to submit order');
      }
      return response.json();
    })
    .then(data => {
      // Show success message
      this.showToast('Order submitted successfully', 'success');
      
      // Reset UI
      this.resetUI();
      
      // Update recent orders (if applicable)
      this.updateRecentOrders();
    })
    .catch(error => {
      console.error('Error submitting order:', error);
      this.showToast('Failed to submit order. Please try again.', 'error');
    });
  }
  
  // Cancel transcription
  cancelTranscription() {
    // Reset UI
    this.resetUI();
  }
  
  // Reset UI after order submission or cancellation
  resetUI() {
    // Clear transcription
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = 'Press and hold to record order';
    }
    
    // Hide confirmation buttons
    this.hideConfirmationButtons();
    
    // Hide dietary alerts
    this.hideDietaryAlerts();
    
    // Reset audio bars
    this.resetAudioBars();
  }
  
  // Update recent orders
  updateRecentOrders() {
    const recentOrdersContainer = document.querySelector('.recent-orders-section');
    if (!recentOrdersContainer) return;
    
    // Get selected table
    const selectedTable = document.querySelector('.table.selected');
    if (!selectedTable) return;
    
    const tableId = selectedTable.dataset.tableId;
    
    // Fetch recent orders
    fetch(`/api/tables/${tableId}/orders?limit=3`)
    .then(response => response.json())
    .then(data => {
      // Update recent orders display
      const ordersContainer = recentOrdersContainer.querySelector('.recent-orders');
      if (!ordersContainer) return;
      
      // Clear existing orders
      ordersContainer.innerHTML = '';
      
      // Add new orders
      data.orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'recent-order';
        
        const orderTime = new Date(order.timestamp);
        const timeString = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        orderElement.innerHTML = `
          <div class="recent-order-header">
            <div class="recent-order-table">Table ${order.tableId}</div>
            <div class="recent-order-time">${timeString}</div>
          </div>
          <div class="recent-order-items">${order.orderText}</div>
        `;
        
        ordersContainer.appendChild(orderElement);
      });
    })
    .catch(error => {
      console.error('Error updating recent orders:', error);
    });
  }
  
  // Start audio visualization
  startVisualization() {
    if (!this.visualizerNodes || !this.audioVisualization) return;
    
    // Store start time
    this.recordingStartTime = Date.now();
    
    // Get analyzer and bars
    const { analyser } = this.visualizerNodes;
    const bars = this.audioVisualization.querySelectorAll('.audio-bar');
    
    // Set up data array
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Start visualization interval
    this.visualizerIntervalId = setInterval(() => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average levels for each bar
      const barCount = bars.length;
      const frequencyStep = Math.floor(dataArray.length / barCount);
      
      // Update each bar
      for (let i = 0; i < barCount; i++) {
        const start = i * frequencyStep;
        const end = start + frequencyStep;
        let sum = 0;
        
        // Calculate average for this frequency range
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        
        const average = sum / frequencyStep;
        
        // Scale height (0-60px)
        const height = Math.max(5, Math.min(60, average * 0.6));
        
        // Update bar height
        bars[i].style.height = `${height}px`;
      }
    }, 50);
  }
  
  // Stop audio visualization
  stopVisualization() {
    if (this.visualizerIntervalId) {
      clearInterval(this.visualizerIntervalId);
      this.visualizerIntervalId = null;
    }
  }
  
  // Reset audio bars to default state
  resetAudioBars() {
    if (!this.audioVisualization) return;
    
    const bars = this.audioVisualization.querySelectorAll('.audio-bar');
    bars.forEach(bar => {
      bar.style.height = '5px';
    });
  }
  
  // Update UI for recording state
  updateRecordingUI(isRecording) {
    if (!this.voiceButton) return;
    
    if (isRecording) {
      // Update button appearance
      this.voiceButton.classList.add('recording');
      
      // Add recording icon
      this.voiceButton.innerHTML = '<i class="voice-record-button-icon">⏹</i>';
      
      // Add aria label for accessibility
      this.voiceButton.setAttribute('aria-label', 'Stop recording');
    } else {
      // Update button appearance
      this.voiceButton.classList.remove('recording');
      
      // Add microphone icon
      this.voiceButton.innerHTML = '<i class="voice-record-button-icon">🎤</i>';
      
      // Add aria label for accessibility
      this.voiceButton.setAttribute('aria-label', 'Start recording');
    }
  }
  
  // Show toast notification
  showToast(message, type = 'default') {
    // Check if toast container exists, create if not
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
}

// Initialize iPad voice recognition when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.iPadVoiceRecognition = new iPadVoiceRecognition();
});
