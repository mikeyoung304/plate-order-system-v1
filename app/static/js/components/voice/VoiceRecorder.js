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
    
    this.onRecordingComplete = null; // May need rethinking for streaming
    this.onRecordingStart = null;
    this.onRecordingCancel = null;
    this.socket = null; // Added property for WebSocket instance
    
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
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error("Secure context required. Please access this site via HTTPS.");
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support audio recording. Please try a different browser.");
      }
      
      // Request microphone access with explicit error handling and high-quality audio constraints
      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 16000, // Requesting 16kHz to match backend
            sampleSize: 16
          }
        };
        
        console.log('Requesting microphone access with constraints:', constraints);
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Microphone access granted, stream created:', this.stream);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Microphone access denied. Please allow microphone access in your browser settings.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error("No microphone found. Please connect a microphone and try again.");
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          throw new Error("Microphone is already in use by another application.");
        } else {
          throw new Error(`Microphone error: ${err.message}`);
        }
      }
      
      // Add listener for unexpected track ending
      if (this.stream && this.stream.getAudioTracks().length > 0) {
        const audioTrack = this.stream.getAudioTracks()[0];
        audioTrack.onended = () => {
          console.warn('VoiceRecorder: Audio track ended unexpectedly!');
          // Optionally, try to handle this state, e.g., force stop recording if active
          if (this.isRecording) {
             console.warn('VoiceRecorder: Forcing stop recording due to unexpected track end.');
             this.stopRecording(); // Or perhaps cancelRecording?
          }
        };
        console.log('VoiceRecorder: Added onended listener to audio track.');
      } else {
         console.error('VoiceRecorder: Could not get audio track to add onended listener.');
      }
      
      // Force WAV format based on server logs showing audio/wav content_type
      const preferredMimeType = 'audio/wav';
      console.log(`Attempting to force recorder MIME type: ${preferredMimeType}`);

      // Create media recorder options
      const options = {
        mimeType: preferredMimeType,
        // audioBitsPerSecond might not be applicable/respected for WAV
        // audioBitsPerSecond: 128000
      };
      
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        // Store the actual mimeType being used (should be audio/wav)
        this.actualMimeType = this.mediaRecorder.mimeType || preferredMimeType;
        console.log('MediaRecorder created with options:', options, 'Actual MIME Type:', this.actualMimeType);
      } catch (err) {
        // Try one last time with no options if specific mimeType failed
        if (options.mimeType) {
            try {
                this.mediaRecorder = new MediaRecorder(this.stream);
                this.actualMimeType = this.mediaRecorder.mimeType || 'audio/webm'; // Guess webm if default is empty
                console.log('MediaRecorder created with default browser options. Actual MIME Type:', this.actualMimeType);
            } catch (finalErr) {
                 console.error('Failed to create MediaRecorder entirely:', finalErr);
                 throw new Error(`Failed to initialize recorder: ${finalErr.message}`);
            }
        } else {
             throw new Error(`Failed to initialize recorder: ${err.message}`);
        }
      }
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          // Send chunk over WebSocket if connected
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // console.log(`Sending audio chunk size: ${e.data.size}`); // Debug log (can be verbose)
            this.socket.send(e.data);
          } else {
            console.warn('WebSocket not open, cannot send audio chunk.');
            // Optionally buffer chunks here if needed, but for live streaming, dropping might be okay
          }
          // We no longer need to store chunks locally for a final blob
          // this.audioChunks.push(e.data);
        }
      };
      
      // Add onstop handler - primarily for logging/cleanup now
      this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped.');
          // No longer calling processRecording() here
      };
      
      // Clear previous chunks (still good practice, though not strictly needed for streaming)
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
      this.statusElement.textContent = `Error: ${error.message}`;
      
      // Show error animation
      this.recordButton.classList.add("shake");
      setTimeout(() => {
        this.recordButton.classList.remove("shake");
      }, 500);
      
      // Add a help button for microphone issues
      const helpButton = document.createElement('button');
      helpButton.className = 'mt-2 text-sm text-indigo-600 hover:text-indigo-800';
      helpButton.textContent = 'How to fix microphone issues';
      helpButton.onclick = () => {
        alert(`Microphone Troubleshooting:
1. Make sure you've allowed microphone access in your browser
2. Check that no other application is using your microphone
3. Try refreshing the page
4. Make sure you're accessing the site via HTTPS
5. Try using a different browser`);
      };
      
      // Add the help button after the status element
      if (!document.getElementById('mic-help-button')) {
        helpButton.id = 'mic-help-button';
        this.statusElement.parentNode.appendChild(helpButton);
      }
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
    
    // Send End-of-Stream signal via WebSocket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
       console.log('Sending End-of-Stream signal.');
       this.socket.send(JSON.stringify({ type: 'EOS' }));
    } else {
       console.warn('WebSocket not open, cannot send End-of-Stream signal.');
    }
    
    // No longer need to call processRecording
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

    // Send End-of-Stream signal via WebSocket on cancel too, as backend might expect it
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
       console.log('Sending End-of-Stream signal on cancel.');
       this.socket.send(JSON.stringify({ type: 'EOS' }));
    } else {
       console.warn('WebSocket not open, cannot send End-of-Stream signal on cancel.');
    }
    
    // Call the onRecordingCancel callback if defined
    if (typeof this.onRecordingCancel === 'function') {
      this.onRecordingCancel();
    }
  }
  
  // Removed processRecording() method as audio is now streamed via WebSocket
  
  /**
   * Set callback for recording completion (May need adjustment for streaming)
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
  
  /**
   * Set the WebSocket instance to use for sending audio data
   * @param {WebSocket} socketInstance - The active WebSocket connection
   */
  setWebSocket(socketInstance) {
    this.socket = socketInstance;
    console.log('VoiceRecorder: WebSocket instance set.');
  }
}
