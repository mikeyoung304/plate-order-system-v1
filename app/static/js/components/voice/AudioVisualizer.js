/**
 * Audio Visualizer Component
 * Provides audio visualization for the voice recorder
 */

// Set up global audio visualization functions
window.setupAudioVisualization = function(stream) {
  if (!stream) {
    console.error('No audio stream provided for visualization');
    return;
  }

  // Get the visualization canvas (Note: The HTML creates a canvas *inside* the div)
  const canvas = document.getElementById('audio-visualizer-canvas'); // Use the correct ID for the canvas element
  if (!canvas) {
    console.error('Audio visualizer canvas element with ID "audio-visualizer-canvas" not found');
    return;
  }

  // Create audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  
  // Connect the source to the analyser
  source.connect(analyser);
  
  // Configure the analyser
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Get the canvas context
  const canvasCtx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Store references for cleanup
  window.audioVisualizerData = {
    audioContext,
    analyser,
    source,
    animationFrame: null
  };
  
  // Visualization function
  function draw() {
    // Request next animation frame
    window.audioVisualizerData.animationFrame = requestAnimationFrame(draw);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, width, height);
    
    // Set bar width based on canvas width and buffer length
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    // Draw bars for each frequency
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      // Use gradient color based on frequency
      const hue = (i / bufferLength) * 240 + 120; // From green to blue
      canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      // Draw bar
      canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  // Start visualization
  draw();
  
  // Show the canvas
  canvas.classList.remove('hidden');
};

// Function to stop audio visualization
window.stopAudioVisualization = function() {
  // Check if visualization is active
  if (!window.audioVisualizerData) {
    return;
  }
  
  // Cancel animation frame
  if (window.audioVisualizerData.animationFrame) {
    cancelAnimationFrame(window.audioVisualizerData.animationFrame);
  }
  
  // Close audio context
  if (window.audioVisualizerData.audioContext) {
    window.audioVisualizerData.audioContext.close();
  }
  
  // Disconnect source
  if (window.audioVisualizerData.source) {
    window.audioVisualizerData.source.disconnect();
  }
  
  // Clear data
  window.audioVisualizerData = null;
  
  // Hide the canvas
  const canvas = document.getElementById('audio-visualizer-canvas'); // Use the correct canvas ID
  if (canvas) {
    // Also hide the container div if needed
    const container = document.getElementById('audio-visualizer');
    if (container) container.classList.add('hidden');
    
    // Clear canvas
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
};