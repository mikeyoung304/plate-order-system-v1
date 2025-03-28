/**
 * Enhanced Voice Recorder Component
 * Handles recording voice orders using the Web Audio API
 * Includes improved UI/UX with visual feedback
 */

export class VoiceRecorder {
  constructor(options = {}) {
    this.options = {
      recordButtonId: 'record-button',
      statusElementId: 'record-status',
      maxRecordingTime: 30000, // 30 seconds
      countdownTimer: true,
      pulseAnimation: true,
      ...options
    };
    
    this.recordButton = document.getElementById(this.options.recordButtonId);
    this.statusElement = document.getElementById(this.options.statusElementId);
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.countdownInterval = null;
    this.recordingStartTime = 0;
    this.stream = null;
    
    this.onRecordingComplete = null;
    this.onRecordingStart = null;
    this.onRecordingCancel = null;
    
    if (this.recordButton && this.statusElement) {
      this.init();
      this.createTimerDisplay();
    } else {
      console.error('Voice recorder elements not found');
    }
  }
  
  /**
   * Create timer display element
   */
  createTimerDisplay() {
    // Create timer display
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.id = 'recording-timer';
    this.timerDisplay.className = 'text-xl font-bold text-indigo-600 mt-2 hidden';
    this.timerDisplay.textContent = '00:00';
    
    // Insert after status element
    this.statusElement.parentNode.insertBefore(this.timerDisplay, this.statusElement.nextSibling);
  }
  
  /**
   * Initialize the voice recorder
   */
  init() {
    // Add event listeners for record button
    this.recordButton.addEventListener('mousedown', () => this.startRecording());
    this.recordButton.addEventListener('touchstart', () => this.startRecording());
    
    this.recordButton.addEventListener('mouseup', () => this.stopRecording());
    this.recordButton.addEventListener('touchend', () => this.stopRecording());
    
    // Add event listener for leaving the window while recording
    window.addEventListener('blur', () => {
      if (this.isRecording) {
        this.stopRecording();
      }
    });
  }
  
  /**
   * Enable the recorder
   */
  enable() {
    this.recordButton.disabled = false;
    this.statusElement.textContent = 'Ready to record';
  }
  
  /**
   * Disable the recorder
   */
  disable() {
    this.recordButton.disabled = true;
    this.statusElement.textContent = 'Select a table to start recording';
    if (this.isRecording) {
      this.cancelRecording();
    }
  }
  
  /**
   * Start recording
   */
  async startRecording() {
    if (this.isRecording || this.recordButton.disabled) return;
    
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      
      // Clear previous chunks
      this.audioChunks = [];
      
      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      // Update UI with animation
      this.recordButton.classList.add("bg-red-600");
      this.recordButton.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
      this.statusElement.textContent = "Recording... (release to stop)";
      
      // Show timer display
      if (this.timerDisplay) {
        this.timerDisplay.classList.remove('hidden');
        this.timerDisplay.textContent = '00:00';
      }
      
      // Add pulse animation to button
      if (this.options.pulseAnimation) {
        this.recordButton.classList.add("animate-pulse");
        this.recordButton.style.animation = "pulse 1.5s infinite";
      }
      
      // Start countdown timer
      if (this.options.countdownTimer) {
        this.startCountdownTimer();
      }
      
      // Set maximum recording time
      this.recordingTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.options.maxRecordingTime);
      
      // Call the onRecordingStart callback if defined
      if (typeof this.onRecordingStart === "function") {
        this.onRecordingStart();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      this.statusElement.textContent = "Error: Could not access microphone";
      
      // Show error animation
      this.recordButton.classList.add("shake");
      setTimeout(() => {
        this.recordButton.classList.remove("shake");
      }, 500);
    }
  }
  
  /**
   * Start countdown timer
   */
  startCountdownTimer() {
    // Clear any existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Update timer every 100ms
    this.countdownInterval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(this.countdownInterval);
        return;
      }
      
      const elapsedTime = Date.now() - this.recordingStartTime;
      const remainingTime = Math.max(0, this.options.maxRecordingTime - elapsedTime);
      
      // Format time as MM:SS
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      
      // Update timer display
      if (this.timerDisplay) {
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when less than 5 seconds remaining
        if (remainingTime < 5000) {
          this.timerDisplay.classList.add('text-red-600');
          this.timerDisplay.classList.remove('text-indigo-600');
        } else {
          this.timerDisplay.classList.add('text-indigo-600');
          this.timerDisplay.classList.remove('text-red-600');
        }
      }
    }, 100);
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording) return;
    
    // Stop the media recorder
    this.mediaRecorder.stop();
    
    // Stop all tracks in the stream
    this.stream.getTracks().forEach(track => track.stop());
    
    // Clear the recording timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Clear the countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-red-600', 'animate-pulse');
    this.recordButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    this.statusElement.textContent = 'Processing recording...';
    
    // Hide timer display
    if (this.timerDisplay) {
      this.timerDisplay.classList.add('hidden');
    }
    
    // Remove animation
    this.recordButton.style.animation = '';
    
    // Process the recording after a short delay to ensure all data is available
    setTimeout(() => {
      this.processRecording();
    }, 500);
  }
  
  /**
   * Cancel recording
   */
  cancelRecording() {
    if (!this.isRecording) return;
    
    // Stop the media recorder
    this.mediaRecorder.stop();
    
    // Stop all tracks in the stream
    this.stream.getTracks().forEach(track => track.stop());
    
    // Clear the recording timer
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    // Clear the countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-red-600', 'animate-pulse');
    this.recordButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    this.statusElement.textContent = 'Recording cancelled';
    
    // Hide timer display
    if (this.timerDisplay) {
      this.timerDisplay.classList.add('hidden');
    }
    
    // Remove animation
    this.recordButton.style.animation = '';
    
    // Call the onRecordingCancel callback if defined
    if (typeof this.onRecordingCancel === 'function') {
      this.onRecordingCancel();
    }
  }
  
  /**
   * Process the recording
   */
  processRecording() {
    if (this.audioChunks.length === 0) {
      this.statusElement.textContent = 'No audio recorded';
      return;
    }
    
    // Create a blob from the audio chunks
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64Audio = reader.result.split(',')[1]; // Remove the data URL prefix
      
      // Call the onRecordingComplete callback if defined
      if (typeof this.onRecordingComplete === 'function') {
        this.onRecordingComplete(base64Audio);
      }
      
      this.statusElement.textContent = 'Recording complete';
    };
  }
  
  /**
   * Set callback for recording completion
   * @param {Function} callback - Function to call when recording is complete
   */
  setOnRecordingComplete(callback) {
    this.onRecordingComplete = callback;
  }
  
  /**
   * Set callback for recording start
   * @param {Function} callback - Function to call when recording starts
   */
  setOnRecordingStart(callback) {
    this.onRecordingStart = callback;
  }
  
  /**
   * Set callback for recording cancellation
   * @param {Function} callback - Function to call when recording is cancelled
   */
  setOnRecordingCancel(callback) {
    this.onRecordingCancel = callback;
  }
}
