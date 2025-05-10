import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Corrected import path if needed
import { Mic, Square, AlertCircle, CheckCircle2, XCircle, Volume2, MicOff, Loader2 } from "lucide-react"; // Added Loader2
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { mockAPI } from "@/mocks/mockData";

// Constants
const MAX_RECORDING_TIME = 30000; // 30 seconds
const MIN_RECORDING_TIME = 1000;  // 1 second
const AUDIO_VISUALIZER_BARS = 40;
const IS_SAFARI = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const OPENAI_API_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_MODEL = "whisper-1";

type VoiceOrderPanelProps = {
  tableId: string;
  tableName: string;
  seatNumber: number;
  orderType: "food" | "drink";
  onOrderSubmitted?: (orderText: string) => void;
  testMode?: boolean; // Keep test mode for potential future use or simulation
};

// Define PermissionState based on standard API values
type PermissionState = 'granted' | 'denied' | 'prompt';

export function VoiceOrderPanel({ tableId, tableName, seatNumber, orderType, onOrderSubmitted, testMode = false }: VoiceOrderPanelProps) {
  // --- State Variables ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Covers API call duration now
  const [transcription, setTranscription] = useState("");
  const [lastTranscription, setLastTranscription] = useState(""); // Keep for confirmation step
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [micPermission, setMicPermission] = useState<PermissionState | 'not-found' | 'error' | null>(null);
  const [dietaryAlerts, setDietaryAlerts] = useState<string[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [confidence, setConfidence] = useState(0); // Keep, though Whisper doesn't provide it directly

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // To store audio chunks

  // Refs for DOM elements (keep as they are used for UI)
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const audioVisualizationRef = useRef<HTMLDivElement>(null);
  // ... other UI refs ...

  // --- Hooks ---
  const { toast } = useToast();

  // --- Helper Functions ---
  const logger = useMemo(() => ({
    info: (message: string, ...args: any[]) => console.log(`[VoiceOrder] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[VoiceOrder] ${message}`, ...args),
    warning: (message: string, ...args: any[]) => console.warn(`[VoiceOrder] ${message}`, ...args),
  }), []);

  const showInternalToast = useCallback((message: string, type = 'default', duration = 3000) => {
    toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: (type === 'error' ? 'destructive' : type === 'warning' ? 'warning' as any : 'default'),
        duration: duration,
    });
  }, [toast]);

  // Keep dietary alerts logic
  const checkDietaryAlerts = useCallback((text: string) => {
    if (!text) return;
    const alertKeywords = {
        'nut allergy': ['nut', 'peanut', 'almond', 'walnut', 'cashew', 'pistachio', 'pecan'],
        'gluten-free': ['gluten', 'gluten-free', 'wheat'],
        'dairy-free': ['dairy', 'milk', 'lactose', 'cheese', 'butter', 'cream'],
        'vegetarian': ['vegetarian', 'no meat'],
        'vegan': ['vegan', 'no animal', 'plant based', 'plant-based'],
        'shellfish allergy': ['shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'scallop'],
        'spicy': ['not spicy', 'mild', 'no spice']
    };
    setDietaryAlerts([]);
    const lowerText = text.toLowerCase();
    const foundAlerts = Object.entries(alertKeywords)
        .filter(([, keywords]: [string, string[]]) => keywords.some((keyword: string) => lowerText.includes(keyword.toLowerCase()))) // Added types
        .map(([alert]) => alert);
    if (foundAlerts.length > 0) setDietaryAlerts(foundAlerts);
  }, []);

  const resetUI = useCallback(() => {
    setIsRecording(false); setIsProcessing(false); setTranscription('');
    setShowConfirmation(false); setDietaryAlerts([]);
    if (audioVisualizationRef.current) {
        const bars = audioVisualizationRef.current.querySelectorAll('.voice-audio-bar');
        bars.forEach(bar => { if (bar instanceof HTMLElement) bar.style.height = '5px'; });
    }
    setRecordingDuration(0);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    audioChunksRef.current = []; // Clear stored audio chunks
  }, []);

  const stopAudioStream = useCallback(() => {
    if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null; logger.info("Audio stream stopped.");
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); logger.info("AudioContext closed."); }
        catch (e: any) { logger.error("Error closing AudioContext:", e); } // Added type
        finally { audioContextRef.current = null; }
    }
  }, [logger]);

  const stopVisualization = useCallback(() => {
    if (visualizerIntervalRef.current) {
        cancelAnimationFrame(visualizerIntervalRef.current);
        visualizerIntervalRef.current = null;
    }
    if (audioVisualizationRef.current) {
        const bars = audioVisualizationRef.current.querySelectorAll('.voice-audio-bar');
        bars.forEach(bar => { if (bar instanceof HTMLElement) bar.style.height = '5px'; });
    }
  }, []);

  // Simplified reset, no WebSocket logic
  const resetRecording = useCallback(() => {
    logger.info("Resetting recording state...");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e: any) { logger.error(`Error stopping media recorder during reset: ${e.message}`); } // Added type
    }
    stopAudioStream(); stopVisualization();
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setIsRecording(false); setIsProcessing(false); setRecordingDuration(0);
    audioChunksRef.current = []; // Clear chunks on reset
    resetUI();
  }, [resetUI, stopAudioStream, stopVisualization, logger]);


  // --- Whisper API Call (via Backend Route) ---
  const sendToWhisper = useCallback(async (audioBlob: Blob) => {
    try {
      logger.info(`Sending audio (${(audioBlob.size / 1024).toFixed(2)} KB) for transcription...`);
      
      // Use mock API directly instead of making a fetch call
      const transcriptionResult = await mockAPI.transcribeAudio(audioBlob);
      
      logger.info("Mock transcription response:", transcriptionResult);
      
      if (!transcriptionResult.text || typeof transcriptionResult.text !== 'string') {
        logger.error("Mock transcription returned invalid text format:", transcriptionResult);
        showInternalToast("Transcription failed: Invalid response format", "error");
        throw new Error("Invalid mock transcription format");
      }
      
      return transcriptionResult.text.trim(); // Return the transcribed text
    } catch (error: any) {
      logger.error("Error in mock transcription:", error);
      showInternalToast("Transcription failed. Could not process audio.", "error");
      throw error;
    }
  }, [logger, showInternalToast]);


  // --- Permission Handling ---
  const requestMicPermission = useCallback(async () => {
    logger.info("Requesting microphone permission...");
    setShowPermissionError(false); // Hide previous errors
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        logger.error("getUserMedia not supported");
        setMicPermission('error');
        setShowPermissionError(true);
        showInternalToast("Voice input not supported by this browser.", "error", 6000);
        return 'error'; // Return status
    }
    try {
        // Request stream to trigger prompt and check permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop the tracks if we only needed to check permission
        stream.getTracks().forEach(track => track.stop());
        logger.info("Microphone permission granted.");
        setMicPermission('granted');
        setShowPermissionError(false);
        return 'granted'; // Return status
    } catch (error: any) {
        logger.error("Error getting microphone permission:", error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setMicPermission('denied');
            setShowPermissionError(true);
            showInternalToast("Microphone access denied. Please enable it in browser settings and refresh.", "error", 5000);
            return 'denied'; // Return status
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
             setMicPermission('not-found');
             setShowPermissionError(true);
             showInternalToast("No microphone found. Please connect a microphone and refresh.", "error", 5000);
             return 'not-found'; // Return status
        } else {
            setMicPermission('error');
            setShowPermissionError(true);
            showInternalToast(`Error accessing microphone: ${error.message}`, "error", 5000);
            return 'error'; // Return status
        }
    }
  }, [logger, showInternalToast]);


  // --- Recording Logic ---
  const startVisualization = useCallback(() => {
    // ... (visualization logic remains the same) ...
    if (!analyserRef.current || !audioVisualizationRef.current) return;
    const analyser = analyserRef.current;
    const bars = audioVisualizationRef.current.querySelectorAll('.voice-audio-bar');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
        if (!isRecording || !analyserRef.current) {
             if (visualizerIntervalRef.current) cancelAnimationFrame(visualizerIntervalRef.current);
             visualizerIntervalRef.current = null;
             return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        for (let i = 0; i < AUDIO_VISUALIZER_BARS; i++) {
            const bar = bars[i];
            if (bar instanceof HTMLElement) {
                const barHeight = (dataArray[i] || 0) * 0.25;
                const height = Math.max(5, Math.min(60, barHeight * 0.6));
                bar.style.height = `${height}px`;
            }
        }
        visualizerIntervalRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, [isRecording]);

  const stopRecording = useCallback(async () => { // Make async to await API call
    if (!isRecording || !mediaRecorderRef.current) {
        logger.warning("Stop called but not recording or recorder not ready.");
        return;
    }
    logger.info("Attempting to stop recording...");

    // Clear timers immediately
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current); recordingTimeoutRef.current = null;
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current); recordingTimerRef.current = null;

    const recordingTime = Date.now() - recordingStartTimeRef.current;
    logger.info(`Recording stopped after ${recordingTime}ms`);

    // Stop the recorder - this triggers the 'onstop' event where we process the blob
    if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop(); // This will trigger onstop
    } else {
        logger.warning("MediaRecorder not active on stop.");
        // If not active, maybe it already stopped? Reset UI just in case.
        resetRecording();
        return;
    }

    stopVisualization();
    setIsRecording(false); // Update state immediately
    setRecordingDuration(0); // Reset duration display

    // Vibrate feedback
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    // Check minimum recording time *before* setting processing state
    if (recordingTime < MIN_RECORDING_TIME) {
        showInternalToast("Hold longer to record", "error");
        resetUI(); // Reset UI fully, including clearing chunks
        return;
    }

    // Set processing state *after* minimum time check
    setIsProcessing(true);
    showInternalToast("Processing audio...", "default", 5000); // Inform user

    // The actual processing happens in the mediaRecorder.onstop handler now

  }, [isRecording, showInternalToast, logger, stopVisualization, resetUI, resetRecording]); // Added resetRecording dependency

  const startRecording = useCallback(async () => {
    if (micPermission !== 'granted') {
        logger.warning("Start recording called but permission is not granted.");
        requestMicPermission(); // Re-request permission if not granted
        return;
    }
    if (isRecording || isProcessing) { // Simplified check
        logger.warning(`Start recording called in invalid state: isRecording=${isRecording}, isProcessing=${isProcessing}`);
        return;
    }

    logger.info("Attempting to start recording...");
    resetUI(); setTranscription(''); setShowConfirmation(false); setDietaryAlerts([]); setShowPermissionError(false);
    audioChunksRef.current = []; // Ensure chunks are cleared before starting

    try {
        const constraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 } };
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints);

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100, latencyHint: 'interactive' });
        }
        if (IS_SAFARI && audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        // Determine preferred MIME type, fallback to webm or wav
        let mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/wav"; // Fallback to WAV if webm not supported
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            logger.error("No suitable audio format supported (webm/wav). Cannot record.");
            showInternalToast("Audio recording format not supported.", "error");
            stopAudioStream(); // Clean up stream
            return;
        }
        logger.info(`Using MIME type: ${mimeType}`);

        mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current, { mimeType });

        // Collect chunks
        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
                // logger.info(`Collected chunk: ${event.data.size} bytes`); // Optional: for debugging
            }
        };

        // Process the full audio blob on stop
        mediaRecorderRef.current.onstop = async () => {
            logger.info("MediaRecorder stopped. Processing collected audio chunks...");
            stopAudioStream(); // Stop the tracks now that recorder is stopped

            if (audioChunksRef.current.length === 0) {
                logger.warning("No audio chunks recorded.");
                showInternalToast("No audio data captured.", "warning");
                resetRecording(); // Reset fully
                return;
            }

            // Combine chunks into a single Blob
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            audioChunksRef.current = []; // Clear chunks after creating blob

            logger.info(`Combined audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

            // Send to Whisper API only if processing state is still true
            // (handles cases where user cancels quickly or min time wasn't met)
            if (isProcessing) {
                try {
                    const transcriptText = await sendToWhisper(audioBlob);
                    if (transcriptText) {
                        setTranscription(transcriptText);
                        setLastTranscription(transcriptText); // For confirmation display
                        setShowConfirmation(true);
                        setConfidence(90); // Whisper doesn't give confidence, set a default or remove
                        checkDietaryAlerts(transcriptText);
                    } else {
                        // Handle case where sendToWhisper returns empty string (shouldn't happen if errors are thrown)
                        logger.warning("sendToWhisper returned empty text.");
                        showInternalToast("Transcription returned empty.", "warning");
                    }
                } catch (error) {
                    // Error already logged and toasted in sendToWhisper
                    logger.error("Error during transcription process:", error);
                    // Reset UI partially, keep error message visible
                    setIsProcessing(false);
                    // Optionally reset transcription display here if needed
                    // setTranscription("Error during transcription.");
                } finally {
                    // Always ensure processing is false after attempt, unless an error requires manual reset
                    if (isProcessing) { // Check again in case error handling changed it
                       setIsProcessing(false);
                    }
                }
            } else {
                 logger.info("Processing was cancelled before API call.");
                 // Ensure UI is fully reset if processing was cancelled (e.g., min time not met)
                 resetRecording();
            }
        };

        mediaRecorderRef.current.onerror = (event: Event) => {
            logger.error("MediaRecorder error:", event);
            showInternalToast("Recording error.", "error");
            resetRecording();
        };

        mediaRecorderRef.current.start(1000); // Collect chunks every second (adjust if needed)
        setIsRecording(true); recordingStartTimeRef.current = Date.now();
        startVisualization();

        setRecordingDuration(0);
        recordingTimerRef.current = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);

        recordingTimeoutRef.current = window.setTimeout(() => {
            if (isRecording) {
                logger.info("Max recording time reached.");
                showInternalToast("Max recording time reached", "warning");
                stopRecording(); // This will trigger the processing flow
            }
        }, MAX_RECORDING_TIME);

        if (navigator.vibrate) navigator.vibrate(50);
        showInternalToast("Recording started", "default", 2000);

    } catch (error: any) {
        logger.error("Error starting recording:", error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setMicPermission('denied'); setShowPermissionError(true); showInternalToast("Microphone access denied.", "error", 5000);
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
             setMicPermission('not-found'); setShowPermissionError(true); showInternalToast("No microphone found.", "error", 5000);
        } else {
            showInternalToast(`Could not start recording: ${error.message}`, "error");
        }
        resetRecording(); // Ensure full reset on any start error
    }
  }, [micPermission, isRecording, isProcessing, resetUI, showInternalToast, logger, startVisualization, stopRecording, sendToWhisper, checkDietaryAlerts, requestMicPermission, stopAudioStream, resetRecording]); // Added dependencies


  // Effect to check permission on mount and handle changes
  useEffect(() => {
    let isMounted = true;

    const checkPermission = async () => {
        if (typeof navigator.permissions?.query !== 'function') {
            logger.warning("Permissions API not fully supported. Relying on initial getUserMedia check.");
            // Attempt initial check if permission state is unknown
            if (micPermission === null) {
                 const initialStatus = await requestMicPermission();
                 if (isMounted) setMicPermission(initialStatus);
            }
            return;
        }

        try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName }); // Cast needed for older TS versions
            if (isMounted) {
                setMicPermission(permissionStatus.state);
                setShowPermissionError(permissionStatus.state === 'denied');
            }

            permissionStatus.onchange = () => {
                if (isMounted) {
                    logger.info(`Microphone permission state changed to: ${permissionStatus.state}`);
                    setMicPermission(permissionStatus.state);
                    setShowPermissionError(permissionStatus.state === 'denied');
                    if (permissionStatus.state === 'denied' && isRecording) {
                        showInternalToast("Microphone access revoked.", "error");
                        resetRecording(); // Stop recording if permission revoked mid-session
                    }
                }
            };
        } catch (error) {
            logger.error("Error querying microphone permission:", error);
            // Fallback to getUserMedia check if query fails
             if (isMounted && micPermission === null) {
                 const initialStatus = await requestMicPermission();
                 if (isMounted) setMicPermission(initialStatus);
            }
        }
    };

    checkPermission();

    return () => {
        isMounted = false;
        // Cleanup: Stop recording and streams if component unmounts
        resetRecording();
        logger.info("VoiceOrderPanel unmounted, cleaning up.");
    };
    // Run only on mount and unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed dependencies to ensure it runs only once on mount


  // --- UI Event Handlers ---
  const confirmTranscription = useCallback(() => {
    logger.info("Transcription confirmed:", transcription);
    if (onOrderSubmitted) {
        onOrderSubmitted(transcription);
    } else {
        logger.warning("onOrderSubmitted callback not provided.");
        // Fallback: maybe just log or display differently
    }
    showInternalToast("Order submitted!", "success");
    resetUI();
  }, [transcription, onOrderSubmitted, resetUI, logger, showInternalToast]);

  const cancelTranscription = useCallback(() => {
    logger.info("Transcription cancelled.");
    resetUI();
    showInternalToast("Order cancelled", "default");
  }, [resetUI, logger, showInternalToast]);

  // Combined handler for button click/tap
  const handleRecordButtonPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (micPermission === 'granted' && !isProcessing) {
      startRecording();
    } else if (micPermission !== 'granted') {
      requestMicPermission(); // Prompt for permission if not granted
    }
    // If isProcessing, button should be disabled, do nothing.
  }, [isRecording, isProcessing, micPermission, startRecording, stopRecording, requestMicPermission]);


  // --- Rendering Logic ---

  const transcriptionDisplayText = useMemo(() => {
    if (isProcessing) return "Processing...";
    if (isRecording) return "Listening...";
    if (showConfirmation && transcription) return transcription;
    if (showConfirmation && !transcription) return "No speech detected."; // Handle empty transcription case
    if (micPermission === 'denied') return "Mic access denied.";
    if (micPermission === 'not-found') return "No mic found.";
    if (micPermission === 'error') return "Mic error.";
    if (micPermission === 'prompt') return "Click mic to allow access.";
    return `Tap mic to order ${orderType}`; // Default prompt
  }, [isRecording, isProcessing, showConfirmation, transcription, micPermission, orderType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getButtonIcon = () => {
    if (isProcessing) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isRecording) return <Square className="h-6 w-6 text-red-500 fill-red-500" />; // Indicate stop
    if (micPermission === 'denied' || micPermission === 'not-found' || micPermission === 'error') return <MicOff className="h-6 w-6 text-red-500" />;
    return <Mic className="h-6 w-6" />; // Default record icon
  };

  const isButtonDisabled = useMemo(() => {
      // Disable if processing, or if permission is denied/error *after* initial check
      return isProcessing || (micPermission !== null && micPermission !== 'granted' && micPermission !== 'prompt');
  }, [isProcessing, micPermission]);


  // --- JSX ---
  return (
    <div className="voice-order-panel p-4 border rounded-lg shadow-md bg-card text-card-foreground flex flex-col items-center space-y-4 max-w-md mx-auto">
      {/* Title/Context */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {tableName} - Seat {seatNumber} ({orderType})
        </p>
      </div>

      {/* Transcription Display Area */}
      <div
        // ref={transcriptionDisplayRef} // Keep ref if needed elsewhere
        className="w-full min-h-[60px] p-3 border rounded-md bg-muted text-muted-foreground flex items-center justify-center text-center"
      >
        <p className="text-lg font-medium">{transcriptionDisplayText}</p>
      </div>

      {/* Permission Error Display */}
      {showPermissionError && (micPermission === 'denied' || micPermission === 'not-found' || micPermission === 'error') && (
        <div /* ref={permissionErrorRef} */ className="permission-error text-red-600 text-sm text-center p-2 border border-red-200 bg-red-50 rounded-md">
          <AlertCircle className="inline-block h-4 w-4 mr-1" />
          {micPermission === 'denied' && "Microphone access denied. Please enable it in your browser settings and refresh."}
          {micPermission === 'not-found' && "No microphone found. Please connect a microphone and refresh."}
          {micPermission === 'error' && "Could not access microphone. Please check browser/system settings."}
        </div>
      )}

      {/* Audio Visualization & Recording Indicator */}
      <div className="w-full h-[60px] flex items-center justify-center space-x-1 overflow-hidden" ref={audioVisualizationRef}>
        {isRecording && Array.from({ length: AUDIO_VISUALIZER_BARS }).map((_, i) => (
          <div
            key={i}
            className="voice-audio-bar w-1 bg-primary rounded-full"
            style={{ height: '5px', transition: 'height 0.1s ease-out' }}
          />
        ))}
        {isRecording && (
           <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-1 rounded">
               {formatTime(recordingDuration)} / {formatTime(MAX_RECORDING_TIME / 1000)}
           </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col items-center space-y-3">
        {!showConfirmation ? (
          // Recording Button
          <motion.div className="relative" whileTap={{ scale: isButtonDisabled ? 1 : 0.95 }} whileHover={{ scale: isButtonDisabled ? 1 : 1.05 }}>
            <Button
              ref={voiceButtonRef}
              size="lg"
              className={`w-20 h-20 rounded-full shadow-lg ${isRecording ? 'bg-red-100 hover:bg-red-200' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
              onClick={handleRecordButtonPress}
              disabled={isButtonDisabled}
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {getButtonIcon()}
            </Button>
            {/* Recording pulse animation */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary opacity-75"
                animate={{ scale: [1, 1.2, 1], opacity: [0.75, 0, 0.75] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ pointerEvents: 'none' }} // Ensure it doesn't block clicks
              />
            )}
          </motion.div>
        ) : (
          // Confirmation Buttons
          <div /* ref={confirmationButtonsRef} */ className="confirmation-buttons w-full flex justify-center space-x-4">
            <Button variant="outline" size="lg" onClick={cancelTranscription} /* ref={cancelButtonRef} */>
              <XCircle className="mr-2 h-5 w-5" /> Cancel
            </Button>
            <Button size="lg" onClick={confirmTranscription} /* ref={confirmButtonRef} */>
              <CheckCircle2 className="mr-2 h-5 w-5" /> Confirm
            </Button>
          </div>
        )}
      </div>

       {/* Dietary Alerts */}
       {dietaryAlerts.length > 0 && (
            <div /* ref={dietaryAlertContainerRef} */ className="dietary-alerts w-full p-3 border border-yellow-300 bg-yellow-50 rounded-md text-yellow-800">
                <h4 className="font-semibold mb-1"><AlertCircle className="inline-block h-4 w-4 mr-1" /> Potential Dietary Alert:</h4>
                <ul className="list-disc list-inside text-sm">
                    {dietaryAlerts.map(alert => <li key={alert}>{alert.charAt(0).toUpperCase() + alert.slice(1)}</li>)}
                </ul>
            </div>
        )}

    </div>
  );
}
