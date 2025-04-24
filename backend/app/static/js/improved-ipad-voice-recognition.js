// iPad-Specific Voice Recognition Enhancements
// This file contains optimizations for voice recognition on iPad devices
// used by servers in assisted living facilities

class iPadVoiceRecognition {
  constructor() {
    this.isRecording = false
    this.audioContext = null
    this.audioStream = null
    this.mediaRecorder = null
    this.audioChunks = []
    this.visualizerNodes = null
    this.visualizerIntervalId = null
    this.recordingTimeout = null
    this.maxRecordingTime = 30000 // 30 seconds max recording time
    this.minRecordingTime = 1000 // 1 second minimum recording time
    this.audioVisualizerBars = 40 // Number of bars in the visualizer
    this.recordingStartTime = 0
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.isProcessing = false
    this.lastTranscription = null

    // DOM Elements
    this.voiceButton = document.querySelector(".voice-record-button")
    this.audioVisualization = document.querySelector(".audio-visualization")
    this.transcriptionDisplay = document.querySelector(".transcription-display")
    this.confirmButton = document.querySelector(".confirm-button")
    this.cancelButton = document.querySelector(".cancel-button")
    this.recordingIndicator = document.querySelector(".recording-indicator")

    // Initialize if elements exist
    if (this.voiceButton && this.audioVisualization) {
      this.initializeVoiceRecognition()
    } else {
      console.warn("Voice recognition elements not found in the DOM")
    }
  }

  // Initialize voice recognition
  initializeVoiceRecognition() {
    // Create audio bars for visualization
    this.createAudioBars()

    // Set up event listeners
    this.setupEventListeners()

    // Check for microphone permission
    this.checkMicrophonePermission()

    // Add error recovery for Safari on iPad
    this.setupSafariErrorRecovery()
  }

  // Create audio visualization bars
  createAudioBars() {
    if (!this.audioVisualization) return

    // Clear existing bars
    this.audioVisualization.innerHTML = ""

    // Create bars
    for (let i = 0; i < this.audioVisualizerBars; i++) {
      const bar = document.createElement("div")
      bar.className = "audio-bar"
      this.audioVisualization.appendChild(bar)
    }
  }

  // Set up event listeners
  setupEventListeners() {
    if (!this.voiceButton) return

    // iPad-optimized touch events for voice button
    this.voiceButton.addEventListener("touchstart", (e) => {
      e.preventDefault() // Prevent default behavior
      if (!this.isProcessing) {
        this.startRecording()
      } else {
        this.showToast("Please wait, processing previous recording", "warning")
      }
    })

    this.voiceButton.addEventListener("touchend", (e) => {
      e.preventDefault() // Prevent default behavior
      if (this.isRecording) {
        this.stopRecording()
      }
    })

    // Add mouse events for testing on non-touch devices
    this.voiceButton.addEventListener("mousedown", (e) => {
      if (!this.isProcessing) {
        this.startRecording()
      } else {
        this.showToast("Please wait, processing previous recording", "warning")
      }
    })

    this.voiceButton.addEventListener("mouseup", (e) => {
      if (this.isRecording) {
        this.stopRecording()
      }
    })

    // Add cancel and confirm button listeners
    if (this.confirmButton) {
      this.confirmButton.addEventListener("click", () => {
        this.confirmTranscription()
      })
    }

    if (this.cancelButton) {
      this.cancelButton.addEventListener("click", () => {
        this.cancelTranscription()
      })
    }

    // Add keyboard support for accessibility
    this.voiceButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        if (!this.isRecording && !this.isProcessing) {
          this.startRecording()
        } else if (this.isRecording) {
          this.stopRecording()
        }
      }
    })

    // Add window focus/blur handlers to manage recording state
    window.addEventListener("blur", () => {
      if (this.isRecording) {
        console.log("Window lost focus, stopping recording")
        this.stopRecording()
      }
    })

    // Handle visibility change (e.g., switching tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.isRecording) {
        console.log("Page hidden, stopping recording")
        this.stopRecording()
      }
    })
  }

  // Setup Safari-specific error recovery
  setupSafariErrorRecovery() {
    // Safari on iPad sometimes has issues with audio context
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isSafari) {
      // Add user interaction requirement for audio context
      document.addEventListener(
        "touchstart",
        () => {
          if (this.audioContext && this.audioContext.state === "suspended") {
            this.audioContext.resume()
          }
        },
        { once: true },
      )

      // Handle audio context interruptions
      window.addEventListener("pagehide", () => {
        if (this.audioContext) {
          this.audioContext.close().catch((e) => console.error("Error closing audio context:", e))
          this.audioContext = null
        }
      })
    }
  }

  // Check microphone permission
  async checkMicrophonePermission() {
    try {
      // Request microphone access to check permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Stop the stream immediately
      stream.getTracks().forEach((track) => track.stop())

      // Permission granted
      if (this.voiceButton) {
        this.voiceButton.disabled = false
      }

      // Show ready state
      this.showToast("Microphone ready", "success")
    } catch (error) {
      console.error("Microphone permission error:", error)

      if (this.voiceButton) {
        this.voiceButton.disabled = true
      }

      // Show error message with instructions
      this.showToast("Microphone access denied. Please enable in Settings.", "error", 6000)

      // Update UI to show permission instructions
      if (this.transcriptionDisplay) {
        this.transcriptionDisplay.innerHTML = `
          <div class="permission-error">
            <p>Microphone access is required for voice ordering.</p>
            <p>Please enable microphone access in your device settings:</p>
            <ol>
              <li>Open <strong>Settings</strong></li>
              <li>Scroll down and tap <strong>Safari</strong></li>
              <li>Tap <strong>Camera & Microphone Access</strong></li>
              <li>Enable access for this website</li>
              <li>Reload this page</li>
            </ol>
          </div>
        `
      }
    }
  }

  // Start recording
  async startRecording() {
    if (this.isRecording || this.isProcessing) return

    try {
      // Reset audio chunks
      this.audioChunks = []

      // Get audio stream with iPad-optimized settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      }

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: "interactive",
      })

      // Set up audio nodes for visualization
      const source = this.audioContext.createMediaStreamSource(this.audioStream)
      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      this.visualizerNodes = {
        source,
        analyser,
      }

      // Create media recorder with iPad-compatible settings
      // Try different MIME types based on browser support
      let mimeType = "audio/webm;codecs=opus"

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback options
        const options = ["audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/wav"]

        for (const option of options) {
          if (MediaRecorder.isTypeSupported(option)) {
            mimeType = option
            break
          }
        }
      }

      console.log(`Using MIME type: ${mimeType}`)

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType,
      })

      // Handle data available event
      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      })

      // Handle recording stop event
      this.mediaRecorder.addEventListener("stop", () => {
        this.processAudioData()
      })

      // Handle recording errors
      this.mediaRecorder.addEventListener("error", (event) => {
        console.error("MediaRecorder error:", event.error)
        this.showToast("Recording error. Please try again.", "error")
        this.resetRecording()
      })

      // Start recording
      this.mediaRecorder.start(100) // Collect data in 100ms chunks
      this.isRecording = true

      // Update UI
      this.updateRecordingUI(true)

      // Start visualization
      this.startVisualization()

      // Set maximum recording time
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.showToast("Maximum recording time reached", "warning")
          this.stopRecording()
        }
      }, this.maxRecordingTime)

      // Store start time
      this.recordingStartTime = Date.now()
    } catch (error) {
      console.error("Error starting recording:", error)
      this.showToast("Could not start recording. Please try again.", "error")
      this.resetRecording()
    }
  }

  // Stop recording
  stopRecording() {
    // Check if we're recording
    if (!this.isRecording) return

    // Check if minimum recording time has passed
    const recordingTime = Date.now() - this.recordingStartTime
    if (recordingTime < this.minRecordingTime) {
      this.showToast("Please hold to record longer", "error")
      this.resetRecording()
      return
    }

    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop()
      } catch (e) {
        console.error("Error stopping media recorder:", e)
      }
    }

    // Stop audio stream
    this.stopAudioStream()

    // Clean up audio context
    if (this.visualizerNodes) {
      try {
        this.visualizerNodes.source.disconnect()
      } catch (e) {
        console.error("Error disconnecting audio source:", e)
      }
    }

    // Stop visualization
    this.stopVisualization()

    // Clear timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout)
    }

    // Update state
    this.isRecording = false
    this.isProcessing = true

    // Update UI
    this.updateRecordingUI(false)

    // Show processing indicator
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = "Processing..."
    }
  }

  // Reset recording state without processing
  resetRecording() {
    // Stop recording if active
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop()
      } catch (e) {
        console.error("Error stopping media recorder:", e)
      }
    }

    // Stop audio stream
    this.stopAudioStream()

    // Clean up audio context
    if (this.visualizerNodes) {
      try {
        this.visualizerNodes.source.disconnect()
      } catch (e) {
        console.error("Error disconnecting audio source:", e)
      }
    }

    // Stop visualization
    this.stopVisualization()

    // Clear timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout)
    }

    // Reset state
    this.isRecording = false
    this.isProcessing = false
    this.audioChunks = []

    // Update UI
    this.updateRecordingUI(false)
    this.resetAudioBars()

    // Reset transcription display
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = "Press and hold to record order"
    }
  }

  // Stop audio stream
  stopAudioStream() {
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach((track) => track.stop())
        this.audioStream = null
      } catch (e) {
        console.error("Error stopping audio stream:", e)
      }
    }
  }

  // Process recorded audio data
  processAudioData() {
    if (this.audioChunks.length === 0) {
      this.showToast("No audio recorded. Please try again.", "error")
      this.isProcessing = false
      if (this.transcriptionDisplay) {
        this.transcriptionDisplay.textContent = "No audio recorded. Please try again."
      }
      return
    }

    // Create blob from audio chunks
    const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })

    // Check if blob is too small (likely empty or corrupted)
    if (audioBlob.size < 1000) {
      this.showToast("Recording too short. Please try again.", "error")
      this.isProcessing = false
      if (this.transcriptionDisplay) {
        this.transcriptionDisplay.textContent = "Recording too short. Please try again."
      }
      return
    }

    // Get selected table
    const selectedTable = document.querySelector(".table.selected")
    let tableId = null
    let seatNumber = null

    if (selectedTable) {
      tableId = selectedTable.dataset.tableId
      seatNumber = selectedTable.dataset.seatNumber || null
    }

    // Convert blob to base64
    const reader = new FileReader()
    reader.readAsDataURL(audioBlob)
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1]

      // Send to server for transcription
      this.sendAudioForTranscription(base64data, tableId, seatNumber)
    }
  }

  // Send audio to server for transcription
  sendAudioForTranscription(base64Audio, tableId, seatNumber) {
    // Prepare request data
    const requestData = {
      audio_data: base64Audio,
    }

    // Add table context if available
    if (tableId) {
      requestData.table_id = tableId
    }

    if (seatNumber) {
      requestData.seat_number = seatNumber
    }

    // Send to server
    fetch("/api/v1/speech/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Transcription failed with status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Reset processing state
        this.isProcessing = false

        // Display transcription
        this.displayTranscription(data.text)

        // Store last successful transcription
        this.lastTranscription = data.text

        // Check for dietary alerts
        this.checkDietaryAlerts(data.text)
      })
      .catch((error) => {
        console.error("Error transcribing audio:", error)

        // Reset processing state
        this.isProcessing = false

        // Show error message
        this.showToast("Transcription failed. Please try again.", "error")

        // Use last transcription if available
        if (this.lastTranscription) {
          this.displayTranscription(this.lastTranscription)
          this.showToast("Using previous transcription", "warning")
        } else {
          if (this.transcriptionDisplay) {
            this.transcriptionDisplay.textContent = "Could not understand audio. Please try again."
          }
        }
      })
  }

  // Display transcription
  displayTranscription(text) {
    if (!this.transcriptionDisplay) return

    if (!text || text.trim() === "") {
      this.transcriptionDisplay.textContent = "Could not understand audio. Please try again."
      return
    }

    // Format and display transcription
    this.transcriptionDisplay.textContent = text

    // Show confirmation buttons
    this.showConfirmationButtons()
  }

  // Check for dietary alerts based on transcription and selected table
  checkDietaryAlerts(text) {
    // Get selected table
    const selectedTable = document.querySelector(".table.selected")
    if (!selectedTable) return

    const tableId = selectedTable.dataset.tableId

    // Get resident dietary restrictions (in real app, this would come from API)
    fetch(`/api/tables/${tableId}/residents`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch resident data: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Check for dietary restrictions
        const dietaryAlerts = []

        if (data.residents && Array.isArray(data.residents)) {
          data.residents.forEach((resident) => {
            if (!resident.dietaryRestrictions) return

            resident.dietaryRestrictions.forEach((restriction) => {
              // Check if order contains restricted items
              if (this.textContainsRestriction(text, restriction)) {
                dietaryAlerts.push(`${resident.name} - ${restriction}`)
              }
            })
          })
        }

        // Display alerts if any
        if (dietaryAlerts.length > 0) {
          this.showDietaryAlerts(dietaryAlerts)
        }
      })
      .catch((error) => {
        console.error("Error checking dietary alerts:", error)
        // Continue without showing alerts
      })
  }

  // Check if text contains dietary restriction
  textContainsRestriction(text, restriction) {
    // Simple implementation - in real app, this would be more sophisticated
    const restrictionTerms = {
      "No nuts": ["nuts", "peanuts", "almonds", "walnuts", "pecans"],
      "Gluten-free": ["gluten", "wheat", "bread", "pasta", "flour"],
      "Dairy-free": ["milk", "cheese", "yogurt", "cream", "butter"],
      "Low sodium": ["salt", "sodium", "soy sauce", "broth"],
      Diabetic: ["sugar", "syrup", "honey", "sweet"],
    }

    const terms = restrictionTerms[restriction] || []
    const lowerText = text.toLowerCase()

    return terms.some((term) => lowerText.includes(term.toLowerCase()))
  }

  // Show dietary alerts
  showDietaryAlerts(alerts) {
    const alertContainer = document.querySelector(".dietary-alert")
    if (!alertContainer) return

    // Create alert content
    const alertText = document.querySelector(".dietary-alert-text")
    if (alertText) {
      alertText.textContent = alerts.join(", ")
    }

    // Show alert with animation
    alertContainer.style.display = "flex"
    alertContainer.style.opacity = "0"

    // Trigger animation
    setTimeout(() => {
      alertContainer.style.opacity = "1"
    }, 10)
  }

  // Hide dietary alerts
  hideDietaryAlerts() {
    const alertContainer = document.querySelector(".dietary-alert")
    if (alertContainer) {
      // Fade out
      alertContainer.style.opacity = "0"

      // Hide after animation
      setTimeout(() => {
        alertContainer.style.display = "none"
      }, 300)
    }
  }

  // Show confirmation buttons
  showConfirmationButtons() {
    const confirmationButtons = document.querySelector(".order-confirmation-buttons")
    if (confirmationButtons) {
      confirmationButtons.style.display = "flex"
      confirmationButtons.style.opacity = "0"

      // Trigger animation
      setTimeout(() => {
        confirmationButtons.style.opacity = "1"
      }, 10)
    }
  }

  // Hide confirmation buttons
  hideConfirmationButtons() {
    const confirmationButtons = document.querySelector(".order-confirmation-buttons")
    if (confirmationButtons) {
      // Fade out
      confirmationButtons.style.opacity = "0"

      // Hide after animation
      setTimeout(() => {
        confirmationButtons.style.display = "none"
      }, 300)
    }
  }

  // Confirm transcription
  confirmTranscription() {
    if (!this.transcriptionDisplay) return

    const transcription = this.transcriptionDisplay.textContent
    if (
      !transcription ||
      transcription === "Processing..." ||
      transcription === "Could not understand audio. Please try again."
    ) {
      return
    }

    // Get selected table
    const selectedTable = document.querySelector(".table.selected")
    if (!selectedTable) {
      this.showToast("Please select a table first", "error")
      return
    }

    const tableId = selectedTable.dataset.tableId

    // Show loading state
    this.showToast("Submitting order...", "info")

    // Send order to server
    fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tableId,
        orderText: transcription,
        timestamp: new Date().toISOString(),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to submit order: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Show success message
        this.showToast("Order submitted successfully", "success")

        // Reset UI
        this.resetUI()

        // Update recent orders (if applicable)
        this.updateRecentOrders()
      })
      .catch((error) => {
        console.error("Error submitting order:", error)
        this.showToast("Failed to submit order. Please try again.", "error")
      })
  }

  // Cancel transcription
  cancelTranscription() {
    // Reset UI
    this.resetUI()
  }

  // Reset UI after order submission or cancellation
  resetUI() {
    // Clear transcription
    if (this.transcriptionDisplay) {
      this.transcriptionDisplay.textContent = "Press and hold to record order"
    }

    // Hide confirmation buttons
    this.hideConfirmationButtons()

    // Hide dietary alerts
    this.hideDietaryAlerts()

    // Reset audio bars
    this.resetAudioBars()

    // Reset state
    this.isProcessing = false
  }

  // Update recent orders
  updateRecentOrders() {
    const recentOrdersContainer = document.querySelector(".recent-orders-section")
    if (!recentOrdersContainer) return

    // Get selected table
    const selectedTable = document.querySelector(".table.selected")
    if (!selectedTable) return

    const tableId = selectedTable.dataset.tableId

    // Fetch recent orders
    fetch(`/api/tables/${tableId}/orders?limit=3`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch recent orders: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Update recent orders display
        const ordersContainer = recentOrdersContainer.querySelector(".recent-orders")
        if (!ordersContainer) return

        // Clear existing orders
        ordersContainer.innerHTML = ""

        // Add new orders
        if (data.orders && Array.isArray(data.orders)) {
          data.orders.forEach((order) => {
            const orderElement = document.createElement("div")
            orderElement.className = "recent-order"

            const orderTime = new Date(order.timestamp)
            const timeString = orderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

            orderElement.innerHTML = `
            <div class="recent-order-header">
              <div class="recent-order-table">Table ${order.tableId}</div>
              <div class="recent-order-time">${timeString}</div>
            </div>
            <div class="recent-order-items">${order.orderText}</div>
          `

            ordersContainer.appendChild(orderElement)
          })
        }
      })
      .catch((error) => {
        console.error("Error updating recent orders:", error)
      })
  }

  // Start audio visualization
  startVisualization() {
    if (!this.visualizerNodes || !this.audioVisualization) return

    // Store start time
    this.recordingStartTime = Date.now()

    // Get analyzer and bars
    const { analyser } = this.visualizerNodes
    const bars = this.audioVisualization.querySelectorAll(".audio-bar")

    // Set up data array
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    // Start visualization interval
    this.visualizerIntervalId = setInterval(() => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray)

      // Calculate average levels for each bar
      const barCount = bars.length
      const frequencyStep = Math.floor(dataArray.length / barCount)

      // Update each bar
      for (let i = 0; i < barCount; i++) {
        const start = i * frequencyStep
        const end = start + frequencyStep
        let sum = 0

        // Calculate average for this frequency range
        for (let j = start; j < end; j++) {
          sum += dataArray[j]
        }

        const average = sum / frequencyStep

        // Scale height (0-60px)
        const height = Math.max(5, Math.min(60, average * 0.6))

        // Update bar height with smooth transition
        bars[i].style.height = `${height}px`
      }
    }, 50)
  }

  // Stop audio visualization
  stopVisualization() {
    if (this.visualizerIntervalId) {
      clearInterval(this.visualizerIntervalId)
      this.visualizerIntervalId = null
    }
  }

  // Reset audio bars to default state
  resetAudioBars() {
    if (!this.audioVisualization) return

    const bars = this.audioVisualization.querySelectorAll(".audio-bar")
    bars.forEach((bar) => {
      bar.style.height = "5px"
    })
  }

  // Update UI for recording state
  updateRecordingUI(isRecording) {
    if (!this.voiceButton) return

    if (isRecording) {
      // Update button appearance
      this.voiceButton.classList.add("recording")

      // Add recording icon
      this.voiceButton.innerHTML = '<i class="voice-record-button-icon">⏹</i>'

      // Add aria label for accessibility
      this.voiceButton.setAttribute("aria-label", "Stop recording")

      // Show recording indicator if available
      if (this.recordingIndicator) {
        this.recordingIndicator.style.display = "block"
      }
    } else {
      // Update button appearance
      this.voiceButton.classList.remove("recording")

      // Add microphone icon
      this.voiceButton.innerHTML = '<i class="voice-record-button-icon">🎤</i>'

      // Add aria label for accessibility
      this.voiceButton.setAttribute("aria-label", "Start recording")

      // Hide recording indicator if available
      if (this.recordingIndicator) {
        this.recordingIndicator.style.display = "none"
      }
    }
  }

  // Show toast notification
  showToast(message, type = "default", duration = 3000) {
    // Check if toast container exists, create if not
    let toastContainer = document.querySelector(".toast-container")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.className = "toast-container"
      document.body.appendChild(toastContainer)
    }

    // Create toast
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    // Add to container
    toastContainer.appendChild(toast)

    // Remove after specified duration
    setTimeout(() => {
      toast.style.opacity = "0"
      setTimeout(() => {
        toast.remove()
      }, 300)
    }, duration)
  }
}

// Initialize iPad voice recognition when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.iPadVoiceRecognition = new iPadVoiceRecognition()
})
