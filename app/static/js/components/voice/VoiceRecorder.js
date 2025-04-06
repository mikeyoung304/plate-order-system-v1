/**
 * VoiceRecorder.js - Enhanced voice recording component for Plate Order System
 * Optimized for iOS compatibility and assisted living facility use case
 * Fixed for improved reliability and performance
 */

class VoiceRecorder {
  constructor(options = {}) {
    // Configuration options with defaults
    this.options = {
      recordButtonId: options.recordButtonId || 'record-button',
      statusElementId: options.statusElementId || 'record-status',
      visualizerId: options.visualizerId || 'audio-visualizer',
      transcriptionResultId: options.transcriptionResultId || 'modal-transcription-result',
      transcriptionTextId: options.transcriptionTextId || 'modal-transcription-text',
      confirmOrderBtnId: options.confirmOrderBtnId || 'confirm-order-btn',
      retryRecordingBtnId: options.retryRecordingBtnId || 'retry-recording-btn',
      wsEndpoint: options.wsEndpoint || '/ws/listen',
      restEndpoint: options.restEndpoint || '/api/v1/speech/transcribe',
      useWebSocket: options.useWebSocket !== undefined ? options.useWebSocket : true,
      fallbackToREST: options.fallbackToREST !== undefined ? options.fallbackToREST : true,
      autoReconnect: options.autoReconnect !== undefined ? options.autoReconnect : true,
      maxReconnectAttempts: options.maxReconnectAttempts || 3,
      onTranscriptionComplete: options.onTranscriptionComplete || null,
      onError: options.onError || null,
      tableId: options.tableId || null,
      seatNumber: options.seatNumber || null,
      debug: options.debug || false,
      // Added timeout options for better reliability
      recordingTimeout: options.recordingTimeout || 30000, // 30 seconds max recording time
      connectionTimeout: options.connectionTimeout || 5000, // 5 seconds connection timeout
      minRecordingTime: options.minRecordingTime || 500 // 500ms minimum recording time
    };

    // DOM elements
    this.recordButton = document.getElementById(this.options.recordButtonId);
    this.statusElement = document.getElementById(this.options.statusElementId);
    this.visualizer = document.getElementById(this.options.visualizerId);
    this.transcriptionResult = document.getElementById(this.options.transcriptionResultId);
    this.transcriptionText = document.getElementById(this.options.transcriptionTextId);
    this.confirmOrderBtn = document.getElementById(this.options.confirmOrderBtnId);
    this.retryRecordingBtn = document.getElementById(this.options.retryRecordingBtnId);

    // State variables
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.websocket = null;
    this.reconnectAttempts = 0;
    this.visualizerCanvas = null;
    this.canvasContext = null;
    this.analyser = null;
    this.animationFrame = null;
    this.isWebSocketConnected = false;
    this.isIOS = this.detectIOS();
    this.isSafari = this.detectSafari();
    
    // Added timers for better control
    this.recordingTimeoutId = null;
    this.connectionTimeoutId = null;
    this.recordingStartTime = null;
    
    // Bind methods to ensure proper 'this' context
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.resetRecording = this.resetRecording.bind(this);
    this.confirmTranscription = this.confirmTranscription.bind(this);
    this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);

    // Initialize
    this.init();
  }

  /**
   * Initialize the voice recorder
   */
  init() {
    this.log('Initializing VoiceRecorder...');
    this.log(`Platform detection - iOS: ${this.isIOS}, Safari: ${this.isSafari}`);

    // Set up event listeners
    this.setupEventListeners();

    // Initialize visualizer if available
    if (this.visualizer) {
      this.initializeVisualizer();
    }

    // Connect to WebSocket if using WebSocket mode
    if (this.options.useWebSocket) {
      this.connectWebSocket();
    } else {
      // Update status for REST-only mode
      if (this.statusElement) {
        this.statusElement.textContent = 'Ready to record (REST mode)';
      }
    }
  }

  /**
   * Set up event listeners for the record button and other controls
   */
  setupEventListeners() {
    if (!this.recordButton) {
      this.log('Record button not found', 'error');
      return;
    }

    // For iOS Safari, use touchstart/touchend instead of mousedown/mouseup
    if (this.isIOS) {
      this.recordButton.addEventListener('touchstart', this.startRecording);
      this.recordButton.addEventListener('touchend', this.stopRecording);
      // Prevent default behavior to avoid triggering other events
      this.recordButton.addEventListener('touchstart', (e) => e.preventDefault());
    } else {
      this.recordButton.addEventListener('mousedown', this.startRecording);
      this.recordButton.addEventListener('mouseup', this.stopRecording);
      this.recordButton.addEventListener('mouseleave', this.stopRecording);
    }

    // Set up retry button
    if (this.retryRecordingBtn) {
      this.retryRecordingBtn.addEventListener('click', this.resetRecording);
    }

    // Set up confirm button
    if (this.confirmOrderBtn) {
      this.confirmOrderBtn.addEventListener('click', this.confirmTranscription);
    }
    
    // Add window beforeunload event to clean up resources
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }

  /**
   * Initialize the audio visualizer
   */
  initializeVisualizer() {
    // Find or create canvas element
    this.visualizerCanvas = this.visualizer.querySelector('canvas');
    if (!this.visualizerCanvas) {
      this.visualizerCanvas = document.createElement('canvas');
      this.visualizerCanvas.width = this.visualizer.clientWidth || 300;
      this.visualizerCanvas.height = this.visualizer.clientHeight || 60;
      this.visualizer.appendChild(this.visualizerCanvas);
    }

    // Get canvas context
    this.canvasContext = this.visualizerCanvas.getContext('2d');
    
    // Draw initial empty state
    if (this.canvasContext) {
      this.canvasContext.fillStyle = 'rgb(240, 247, 255)';
      this.canvasContext.fillRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connectWebSocket() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.log('WebSocket already connected');
      return;
    }

    try {
      // Clear any existing connection timeout
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
      }
      
      // Set connection timeout
      this.connectionTimeoutId = setTimeout(() => {
        if (!this.isWebSocketConnected && this.websocket) {
          this.log('WebSocket connection timeout', 'warn');
          this.websocket.close();
          this.isWebSocketConnected = false;
          
          if (this.statusElement) {
            this.statusElement.textContent = 'Connection timeout. Falling back to REST mode.';
          }
          
          if (this.options.onError) {
            this.options.onError('WebSocket connection timeout');
          }
        }
      }, this.options.connectionTimeout);

      // Determine WebSocket URL (support both absolute and relative paths)
      const wsUrl = this.options.wsEndpoint.startsWith('ws')
        ? this.options.wsEndpoint
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.options.wsEndpoint}`;

      this.log(`Connecting to WebSocket: ${wsUrl}`);
      this.websocket = new WebSocket(wsUrl);

      // WebSocket event handlers
      this.websocket.onopen = (event) => {
        this.log('WebSocket connection established');
        this.isWebSocketConnected = true;
        this.reconnectAttempts = 0;
        
        // Clear connection timeout
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        
        if (this.statusElement) {
          this.statusElement.textContent = 'Ready to record';
        }
        
        // Send a ping to verify connection is working
        try {
          this.websocket.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          this.log('Error sending ping', 'warn');
        }
      };

      this.websocket.onmessage = this.handleWebSocketMessage;

      this.websocket.onerror = (error) => {
        this.log('WebSocket error: ' + JSON.stringify(error), 'error');
        this.isWebSocketConnected = false;
        
        // Clear connection timeout
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        
        if (this.options.onError) {
          this.options.onError('WebSocket connection error');
        }
      };

      this.websocket.onclose = (event) => {
        this.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.isWebSocketConnected = false;
        
        // Clear connection timeout
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }

        // Attempt to reconnect if auto-reconnect is enabled
        if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
          setTimeout(() => this.connectWebSocket(), 1000 * this.reconnectAttempts);
        } else if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
          this.log('Max reconnect attempts reached', 'warn');
          if (this.statusElement) {
            this.statusElement.textContent = 'Connection lost. Using REST mode.';
          }
        }
      };
    } catch (error) {
      this.log('Error connecting to WebSocket: ' + error.message, 'error');
      this.isWebSocketConnected = false;
      
      // Clear connection timeout
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
      }
      
      if (this.options.onError) {
        this.options.onError('Failed to connect to speech service');
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - The WebSocket message event
   */
  handleWebSocketMessage(event) {
    try {
      // Parse the message data
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      this.log('WebSocket message received:', 'debug');
      this.log(data, 'debug');

      // Handle different message types
      switch (data.type) {
        case 'transcript':
          // Handle transcript data
          if (data.data && this.transcriptionText) {
            this.transcriptionText.textContent = data.data;
            
            // Show the transcription result if not empty
            if (data.data.trim() !== '') {
              if (this.transcriptionResult) {
                this.transcriptionResult.classList.remove('hidden');
              }
              
              // Update status
              if (this.statusElement) {
                this.statusElement.textContent = 'Transcription received';
              }
            }
          }
          break;

        case 'error':
          // Handle error messages
          this.log('Transcription error: ' + data.data, 'error');
          if (this.options.onError) {
            this.options.onError(data.data);
          }
          break;

        case 'connection':
          // Handle connection status messages
          this.log('Connection status: ' + data.status);
          break;
          
        case 'pong':
          // Handle pong response
          this.log('Pong received, connection confirmed', 'debug');
          break;

        default:
          // Handle other message types
          this.log('Unknown message type: ' + data.type, 'warn');
          break;
      }
    } catch (error) {
      this.log('Error handling WebSocket message: ' + error.message, 'error');
    }
  }

  /**
   * Start recording audio
   * @param {Event} event - The triggering event
   */
  async startRecording(event) {
    // Prevent default behavior for touch events
    if (event && event.type === 'touchstart') {
      event.preventDefault();
    }

    if (this.isRecording) {
      this.log('Already recording', 'warn');
      return;
    }

    this.log('Starting recording...');
    this.isRecording = true;
    this.audioChunks = [];
    this.recordingStartTime = Date.now();

    // Update UI
    if (this.recordButton) {
      this.recordButton.classList.add('recording');
    }
    if (this.statusElement) {
      this.statusElement.textContent = 'Recording...';
    }
    if (this.visualizer) {
      this.visualizer.classList.remove('hidden');
    }
    if (this.transcriptionResult) {
      this.transcriptionResult.classList.add('hidden');
    }

    try {
      // Request microphone access
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.log('Microphone access granted');

      // Set up audio context and analyzer for visualization
      this.setupAudioContext();

      // Determine the appropriate MIME type
      const mimeType = this.getSupportedMimeType();
      this.log(`Using MIME type: ${mimeType}`);

      // Create MediaRecorder with appropriate options
      const options = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, options);

      // Set up MediaRecorder event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);

          // If using WebSocket, send the audio chunk
          if (this.options.useWebSocket && this.isWebSocketConnected) {
            this.sendAudioChunk(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingComplete();
      };

      this.mediaRecorder.onerror = (error) => {
        this.log('MediaRecorder error: ' + error.message, 'error');
        this.stopRecording();
        if (this.options.onError) {
          this.options.onError('Recording error: ' + error.message);
        }
      };

      // Start recording
      // For WebSocket streaming, use smaller time slices
      if (this.options.useWebSocket && this.isWebSocketConnected) {
        this.mediaRecorder.start(100); // 100ms chunks for streaming
      } else {
        this.mediaRecorder.start(1000); // 1s chunks for REST API
      }

      // Start visualizer animation
      this.startVisualization();
      
      // Set recording timeout
      this.recordingTimeoutId = setTimeout(() => {
        if (this.isRecording) {
          this.log('Recording timeout reached', 'warn');
          this.stopRecording();
        }
      }, this.options.recordingTimeout);

    } catch (error) {
      this.log('Error starting recording: ' + error.message, 'error');
      this.isRecording = false;
      
      // Update UI to reflect error
      if (this.recordButton) {
        this.recordButton.classList.remove('recording');
      }
      if (this.statusElement) {
        this.statusElement.textContent = 'Microphone access denied';
      }
      if (this.visualizer) {
        this.visualizer.classList.add('hidden');
      }
      
      if (this.options.onError) {
        this.options.onError('Failed to access microphone');
      }
    }
  }

  /**
   * Set up audio context and analyzer for visualization
   */
  setupAudioContext() {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create analyzer
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect audio source to analyzer
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      source.connect(this.analyser);
      
      // Note: We don't connect the analyzer to the destination (speakers)
      // to avoid feedback loops
    } catch (error) {
      this.log('Error setting up audio context: ' + error.message, 'error');
    }
  }

  /**
   * Start visualization animation
   */
  startVisualization() {
    if (!this.canvasContext || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const width = this.visualizerCanvas.width;
    const height = this.visualizerCanvas.height;
    
    const draw = () => {
      if (!this.isRecording) return;
      
      this.animationFrame = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(dataArray);
      
      this.canvasContext.fillStyle = 'rgb(240, 247, 255)';
      this.canvasContext.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        this.canvasContext.fillStyle = `rgb(${13 + i}, ${142 - i}, ${238 - i})`;
        this.canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  }

  /**
   * Stop recording audio
   * @param {Event} event - The triggering event
   */
  stopRecording(event) {
    // Prevent default behavior for touch events
    if (event && event.type === 'touchend') {
      event.preventDefault();
    }

    if (!this.isRecording) {
      return;
    }
    
    // Check if minimum recording time has elapsed
    const recordingDuration = Date.now() - this.recordingStartTime;
    if (recordingDuration < this.options.minRecordingTime) {
      this.log(`Recording too short (${recordingDuration}ms), minimum is ${this.options.minRecordingTime}ms`, 'warn');
      
      // Wait until minimum time has elapsed
      setTimeout(() => {
        this.stopRecordingInternal();
      }, this.options.minRecordingTime - recordingDuration);
      return;
    }
    
    this.stopRecordingInternal();
  }
  
  /**
   * Internal method to stop recording
   */
  stopRecordingInternal() {
    this.log('Stopping recording...');
    this.isRecording = false;

    // Clear recording timeout
    if (this.recordingTimeoutId) {
      clearTimeout(this.recordingTimeoutId);
      this.recordingTimeoutId = null;
    }

    // Update UI
    if (this.recordButton) {
      this.recordButton.classList.remove('recording');
    }
    if (this.statusElement) {
      this.statusElement.textContent = 'Processing...';
    }

    // Stop media recorder if it exists and is recording
    if (this.mediaRecorder && (this.mediaRecorder.state === 'recording')) {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        this.log('Error stopping media recorder: ' + error.message, 'error');
      }
    }

    // Stop visualization
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Stop and release media stream
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        this.log('Error stopping audio tracks: ' + error.message, 'warn');
      }
      this.audioStream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(error => {
          this.log('Error closing audio context: ' + error.message, 'warn');
        });
      } catch (error) {
        this.log('Error closing audio context: ' + error.message, 'warn');
      }
      this.audioContext = null;
      this.analyser = null;
    }
    
    // If using WebSocket, send end signal
    if (this.options.useWebSocket && this.isWebSocketConnected && this.websocket) {
      try {
        this.websocket.send(JSON.stringify({ type: 'end' }));
      } catch (error) {
        this.log('Error sending end signal: ' + error.message, 'warn');
      }
    }
  }

  /**
   * Handle recording completion
   */
  async handleRecordingComplete() {
    this.log('Recording complete, processing audio...');

    // If not using WebSocket or WebSocket is not connected, use REST API
    if (!this.options.useWebSocket || !this.isWebSocketConnected) {
      if (this.options.fallbackToREST) {
        this.log('Using REST API for transcription');
        await this.processAudioWithRESTAPI();
      } else {
        this.log('WebSocket not connected and fallback disabled', 'warn');
        if (this.statusElement) {
          this.statusElement.textContent = 'Connection error. Please try again.';
        }
        if (this.options.onError) {
          this.options.onError('Speech service unavailable');
        }
      }
    } else {
      // For WebSocket mode, the transcription results are received via WebSocket messages
      // Just update the UI to show we're waiting for results
      if (this.statusElement) {
        this.statusElement.textContent = 'Waiting for transcription...';
      }
    }
  }

  /**
   * Process audio using REST API
   */
  async processAudioWithRESTAPI() {
    try {
      if (this.audioChunks.length === 0) {
        throw new Error('No audio recorded');
      }

      // Create blob from audio chunks
      const mimeType = this.getSupportedMimeType();
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);

      // Send to server
      const response = await fetch(this.options.restEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          format: mimeType.split('/')[1] || 'wav',
          table_id: this.options.tableId,
          seat_number: this.options.seatNumber
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      // Update UI with transcription
      if (this.transcriptionText) {
        this.transcriptionText.textContent = result.text;
        if (this.transcriptionResult) {
          this.transcriptionResult.classList.remove('hidden');
        }
      }

      if (this.statusElement) {
        this.statusElement.textContent = 'Transcription complete';
      }

      // Call completion callback if provided
      if (this.options.onTranscriptionComplete) {
        this.options.onTranscriptionComplete({
          text: result.text,
          tableId: this.options.tableId,
          seatNumber: this.options.seatNumber
        });
      }

    } catch (error) {
      this.log('Error processing audio: ' + error.message, 'error');
      
      if (this.statusElement) {
        this.statusElement.textContent = 'Error: ' + error.message;
      }
      
      if (this.options.onError) {
        this.options.onError('Transcription error: ' + error.message);
      }
    }
  }

  /**
   * Send audio chunk to WebSocket server
   * @param {Blob} chunk - Audio data chunk
   */
  async sendAudioChunk(chunk) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.log('WebSocket not connected, cannot send audio chunk', 'warn');
      return;
    }

    try {
      // Convert blob to array buffer for more efficient transfer
      const arrayBuffer = await chunk.arrayBuffer();
      this.websocket.send(arrayBuffer);
    } catch (error) {
      this.log('Error sending audio chunk: ' + error.message, 'error');
    }
  }

  /**
   * Reset the recording state
   */
  resetRecording() {
    this.log('Resetting recording state');
    
    // Clear audio chunks
    this.audioChunks = [];
    
    // Update UI
    if (this.transcriptionResult) {
      this.transcriptionResult.classList.add('hidden');
    }
    if (this.statusElement) {
      this.statusElement.textContent = 'Press and hold to record';
    }
  }

  /**
   * Confirm the transcription
   */
  confirmTranscription() {
    if (!this.transcriptionText) return;
    
    const transcription = this.transcriptionText.textContent;
    this.log('Transcription confirmed: ' + transcription);
    
    // Call completion callback if provided
    if (this.options.onTranscriptionComplete) {
      this.options.onTranscriptionComplete({
        text: transcription,
        tableId: this.options.tableId,
        seatNumber: this.options.seatNumber
      });
    }
    
    // Reset for next recording
    this.resetRecording();
  }

  /**
   * Convert Blob to Base64 string
   * @param {Blob} blob - The blob to convert
   * @returns {Promise<string>} - Promise resolving to base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract the base64 data from the FileReader result
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get supported MIME type for audio recording
   * @returns {string} - Supported MIME type
   */
  getSupportedMimeType() {
    // Default MIME type
    let mimeType = 'audio/webm';
    
    // For iOS Safari, use audio/mp4
    if (this.isIOS && this.isSafari) {
      mimeType = 'audio/mp4';
    }
    
    // Check if the browser supports the MIME type
    if (MediaRecorder.isTypeSupported) {
      const supportedTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/ogg',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
    }
    
    return mimeType;
  }

  /**
   * Detect if running on iOS
   * @returns {boolean} - True if running on iOS
   */
  detectIOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform) || 
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  }

  /**
   * Detect if running on Safari
   * @returns {boolean} - True if running on Safari
   */
  detectSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  /**
   * Log messages with level-based formatting
   * @param {string|object} message - Message to log
   * @param {string} level - Log level (debug, info, warn, error)
   */
  log(message, level = 'info') {
    if (!this.options.debug && level === 'debug') return;
    
    const prefix = '[VoiceRecorder]';
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Clean up resources when the component is destroyed
   */
  destroy() {
    this.log('Destroying VoiceRecorder instance');
    
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
    
    // Clear any timeouts
    if (this.recordingTimeoutId) {
      clearTimeout(this.recordingTimeoutId);
      this.recordingTimeoutId = null;
    }
    
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
    
    // Close WebSocket connection
    if (this.websocket) {
      try {
        // Send end signal before closing
        if (this.isWebSocketConnected) {
          this.websocket.send(JSON.stringify({ type: 'end' }));
        }
        this.websocket.close();
      } catch (error) {
        this.log('Error closing WebSocket: ' + error.message, 'warn');
      }
      this.websocket = null;
    }
    
    // Remove event listeners
    if (this.recordButton) {
      if (this.isIOS) {
        this.recordButton.removeEventListener('touchstart', this.startRecording);
        this.recordButton.removeEventListener('touchend', this.stopRecording);
      } else {
        this.recordButton.removeEventListener('mousedown', this.startRecording);
        this.recordButton.removeEventListener('mouseup', this.stopRecording);
        this.recordButton.removeEventListener('mouseleave', this.stopRecording);
      }
    }
    
    if (this.retryRecordingBtn) {
      this.retryRecordingBtn.removeEventListener('click', this.resetRecording);
    }
    
    if (this.confirmOrderBtn) {
      this.confirmOrderBtn.removeEventListener('click', this.confirmTranscription);
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceRecorder;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    return VoiceRecorder;
  });
} else {
  window.VoiceRecorder = VoiceRecorder;
}
