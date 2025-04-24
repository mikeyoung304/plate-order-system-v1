// Audio Visualizer Component
class AudioVisualizer {
  constructor(containerId, barCount = 40) {
    this.container = document.getElementById(containerId);
    this.barCount = barCount;
    this.bars = [];
    this.initialize();
  }

  initialize() {
    if (!this.container) return;
    
    // Clear existing content
    this.container.innerHTML = '';
    
    // Create bars
    for (let i = 0; i < this.barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      this.container.appendChild(bar);
      this.bars.push(bar);
    }
  }

  updateBars(audioData) {
    if (!this.container || !this.bars.length) return;
    
    // Normalize and update bar heights
    for (let i = 0; i < this.barCount; i++) {
      const index = Math.floor(i * (audioData.length / this.barCount));
      const value = audioData[index] / 255;
      const height = Math.max(3, value * 50); // Min height of 3px, max height of 50px
      this.bars[i].style.height = `${height}px`;
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  reset() {
    if (!this.bars.length) return;
    
    // Reset all bars to minimum height
    for (let i = 0; i < this.barCount; i++) {
      this.bars[i].style.height = '3px';
    }
  }
}

// Make it globally available
window.AudioVisualizer = AudioVisualizer;
