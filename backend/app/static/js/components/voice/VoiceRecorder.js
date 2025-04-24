// Voice Recorder Component
class VoiceRecorder {
  constructor(options = {}) {
    this.isRecording = false;
    this.audioContext = null;
    this.audioStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.visualizer = null;
    this.recordingTimeout = null;
    this.maxRecordingTime = options.maxRecordingTime || 30000; // 30 seconds max
    
    // Callback functions
    this.onStart = options.onStart || function() {};
    this.onStop = options.onStop || function() {};
    this.onData = options.onData || function() {};
    this.onError = options.onError || function() {};
    
    // Initialize visualizer if container ID provided
    if (options.visualizerId) {
      this.visualizer = new AudioVisualizer(options.visualizerId);
    }
  }
  
  async start() {
    if (this.isRecording) return;
    
    try {
      // Request audio permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context for visualization
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      
      // Setup analyzer for visualization
      if (this.visualizer) {
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        // Show visualizer
        this.visualizer.show();
        
        // Update visualizer regularly
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVisualizer = () => {
          if (!this.isRecording) return;
          
          analyser.getByteFrequencyData(dataArray);
          this.visualizer.updateBars(dataArray);
          requestAnimationFrame(updateVisualizer);
        };
        
        updateVisualizer();
      }
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      
      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.onData(audioBlob);
        this.cleanup();
      };
      
      // Start recording
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Set timeout for max recording duration
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stop();
        }
      }, this.maxRecordingTime);
      
      // Call start callback
      this.onStart();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.onError(error);
    }
  }
  
  stop() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    // Stop media recorder
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Call stop callback
    this.onStop();
    
    // Cleanup will happen in the onstop handler
  }
  
  cleanup() {
    // Stop audio tracks
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close().catch(e => console.error('Error closing audio context:', e));
      this.audioContext = null;
    }
    
    // Clear timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
    
    // Reset visualizer
    if (this.visualizer) {
      this.visualizer.reset();
      this.visualizer.hide();
    }
    
    this.isRecording = false;
    this.mediaRecorder = null;
  }
  
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

// Make it globally available
window.VoiceRecorder = VoiceRecorder;
