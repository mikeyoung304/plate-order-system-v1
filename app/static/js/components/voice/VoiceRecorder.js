/**
 * Voice Recorder Component
 * Handles recording voice orders using the Web Audio API
 */

export class VoiceRecorder {
  constructor(options = {}) {
    this.options = {
      recordButtonId: 'record-button',
      statusElementId: 'record-status',
      maxRecordingTime: 30000, // 30 seconds
      ...options
    };
    
    this.recordButton = document.getElementById(this.options.recordButtonId);
    this.statusElement = document.getElementById(this.options.statusElementId);
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.stream = null;
    
    this.onRecordingComplete = null;
    this.onRecordingStart = null;
    this.onRecordingCancel = null;
    
    if (this.recordButton && this.statusElement) {
      this.init();
    } else {
      console.error('Voice recorder elements not found');
    }
  }
  
  /**
   * Initialize the voice recorder
   */
  init() {
    // Add event listeners for record button
  /**
   * Start recording
   */
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
      
      // Update UI with animation
      this.recordButton.classList.add("bg-danger", "animate-pulse");
      this.recordButton.classList.remove("bg-primary-600", "hover:bg-primary-700");
      this.statusElement.textContent = "Recording... (release to stop)";
      
      // Add pulse animation to button
      this.recordButton.style.animation = "pulse 1.5s infinite";
      
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
  /**
   * Start recording
   */
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
      
      // Update UI with animation
      this.recordButton.classList.add("bg-danger", "animate-pulse");
      this.recordButton.classList.remove("bg-primary-600", "hover:bg-primary-700");
      this.statusElement.textContent = "Recording... (release to stop)";
      
      // Add pulse animation to button
      this.recordButton.style.animation = "pulse 1.5s infinite";
      
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
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-danger', 'animate-pulse');
    this.recordButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
    this.statusElement.textContent = 'Processing recording...';
    
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
    
    // Update state
    this.isRecording = false;
    
    // Update UI
    this.recordButton.classList.remove('bg-danger', 'animate-pulse');
    this.recordButton.classList.add('bg-primary-600', 'hover:bg-primary-700');
    this.statusElement.textContent = 'Recording cancelled';
    
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
