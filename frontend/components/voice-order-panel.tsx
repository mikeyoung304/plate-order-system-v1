"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, AlertCircle, CheckCircle2, XCircle, Volume2, MicOff } from "lucide-react"; // Added MicOff
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

// Constants
const MAX_RECORDING_TIME = 30000; // 30 seconds
const MIN_RECORDING_TIME = 1000;  // 1 second
const AUDIO_VISUALIZER_BARS = 40;
const IS_SAFARI = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const MAX_CONNECTION_RETRIES = 3;

type VoiceOrderPanelProps = {
  tableId: string;
  tableName: string;
  seatNumber: number;
  orderType: "food" | "drink";
  onOrderSubmitted?: (orderText: string) => void;
  testMode?: boolean;
};

// Define PermissionState based on standard API values
type PermissionState = 'granted' | 'denied' | 'prompt';

export function VoiceOrderPanel({ tableId, tableName, seatNumber, orderType, onOrderSubmitted, testMode = false }: VoiceOrderPanelProps) {
  // --- State Variables ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [lastTranscription, setLastTranscription] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Corrected type to include all possible string literals plus custom states
  const [micPermission, setMicPermission] = useState<PermissionState | 'not-found' | 'error' | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const [dietaryAlerts, setDietaryAlerts] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showPermissionError, setShowPermissionError] = useState(false); // Keep for detailed error message display
  const [confidence, setConfidence] = useState(0);
  const [wsFatalError, setWsFatalError] = useState(false);

  // --- Refs ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null); // Use number for requestAnimationFrame ID
  const recordingTimeoutRef = useRef<number | null>(null); // Use number for browser timeout IDs
  const recordingStartTimeRef = useRef<number>(0);
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const recordingTimerRef = useRef<number | null>(null); // Use number for browser interval IDs
  const connectionRetryCountRef = useRef(0);

  // Refs for DOM elements
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const audioVisualizationRef = useRef<HTMLDivElement>(null);
  const transcriptionDisplayRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const recordingIndicatorRef = useRef<HTMLDivElement>(null);
  const dietaryAlertContainerRef = useRef<HTMLDivElement>(null);
  const confirmationButtonsRef = useRef<HTMLDivElement>(null);
  const toastContainerRef = useRef<HTMLDivElement>(null);
  const permissionErrorRef = useRef<HTMLDivElement>(null);

  // --- Hooks ---
  const { toast } = useToast(); // Use the hook

  // --- Helper Functions ---
  const logger = useMemo(() => ({
    info: (message: string, ...args: any[]) => console.log(`[VoiceOrder] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[VoiceOrder] ${message}`, ...args),
    warning: (message: string, ...args: any[]) => console.warn(`[VoiceOrder] ${message}`, ...args),
  }), []);

  // Use the toast hook for notifications
  const showInternalToast = useCallback((message: string, type = 'default', duration = 3000) => {
    toast({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: message,
        variant: (type === 'error' ? 'destructive' : type === 'warning' ? 'warning' as any : 'default'),
        duration: duration,
    });
  }, [toast]);

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
    // Don't reset showPermissionError here, let the permission check handle it
    setRecordingDuration(0);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
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
    // Don't close WebSocket here, keep it open if possible
    // if (wsConnectionRef.current && (wsConnectionRef.current.readyState === WebSocket.OPEN || wsConnectionRef.current.readyState === WebSocket.CONNECTING)) {
    //     logger.info("Closing WebSocket connection during reset.");
    //     wsConnectionRef.current.close();
    // }
    setIsRecording(false); setIsProcessing(false); setRecordingDuration(0);
    resetUI();
  }, [resetUI, stopAudioStream, stopVisualization, logger]);

  // --- WebSocket Logic ---
  const connectWebSocket = useCallback(() => {
    if (wsConnectionRef.current && (wsConnectionRef.current.readyState === WebSocket.OPEN || wsConnectionRef.current.readyState === WebSocket.CONNECTING)) {
      logger.info('WebSocket already open or connecting.');
      return () => { logger.info("WebSocket cleanup skipped: already connected or connecting."); }; // Return a no-op cleanup
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//localhost:8005/ws/listen`;
    logger.info(`Connecting WebSocket to ${wsUrl}`);
    setConnectionStatus('connecting');
    setWsFatalError(false); // Reset fatal error state on new connection attempt

    let localWsRef: WebSocket | null = null; // Use a local variable for the instance being created

    try {
      localWsRef = new WebSocket(wsUrl);
      wsConnectionRef.current = localWsRef; // Assign to ref only after successful creation

      localWsRef.onopen = () => {
        logger.info('WebSocket connected');
        setConnectionStatus('connected');
        connectionRetryCountRef.current = 0; // Reset retry count on successful connection
        wsConnectionRef.current?.send(JSON.stringify({ type: 'table_context', table_id: tableId, seat_number: seatNumber }));
      };

      localWsRef.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          logger.info('WS msg:', data);
          switch (data.type) {
            case 'transcript':
              // Update transcription with interim results
              if (data.payload) {
                setTranscription(data.payload);
              }
              break;
            case 'utterance_end':
              // Utterance end - can be used for UI feedback if needed, but not for transcription text
              logger.info('Utterance end detected.');
              break;
            case 'final_transcript':
              // Final transcript received
              if (data.payload) {
                setTranscription(data.payload);
                setLastTranscription(data.payload);
                setShowConfirmation(true);
                setConfidence(data.confidence * 100 || 85);
                checkDietaryAlerts(data.payload);
              }
              setIsProcessing(false);
              break;
            case 'error':
              const errorMessage = data.payload ? String(data.payload) : 'Unknown error from server';
              logger.error('WS error msg:', errorMessage);
              showInternalToast(`Transcription error: ${errorMessage}`, 'error');
              // Depending on the error, you might want to reset or attempt reconnect
              // For now, just show error and let onclose handle potential disconnection
              break;
            case 'dg_status':
              logger.info(`DG status: ${data.status}`);
              if (data.status === 'connected') {
                setConnectionStatus('connected');
              } else if (data.status === 'reconnecting' || data.status === 'connecting') { // Handle connecting state
                setConnectionStatus('connecting');
              }
              break;
            case 'connection':
              logger.info(`WS status: ${data.status}`);
              break;
            default:
              logger.warning('Unknown WS msg type:', data.type);
          }
        } catch (e: any) {
          logger.error('Error parsing WS msg:', e);
        }
      };

      localWsRef.onerror = (error: Event) => {
        logger.error('WebSocket encountered an error.', error);
        // The onerror event is often followed by onclose, so let onclose handle reconnection logic
        setConnectionStatus('error');
        // Consider setting a flag here if the error is deemed fatal and should prevent further retries
      };

      localWsRef.onclose = (event: CloseEvent) => {
        logger.info(`WebSocket closed: ${event.reason} (code: ${event.code})`);
        // Only attempt reconnect if the ref still points to this instance
        if (wsConnectionRef.current === localWsRef) {
            setConnectionStatus('disconnected');
            wsConnectionRef.current = null; // Clear the ref

            // Attempt to reconnect if the closure was not clean and not a fatal error
            if (!event.wasClean && !wsFatalError) {
              if (connectionRetryCountRef.current < MAX_CONNECTION_RETRIES) {
                const retryDelay = Math.pow(2, connectionRetryCountRef.current) * 1000; // Exponential backoff
                logger.warning(`WS reconnect attempt ${connectionRetryCountRef.current + 1} in ${retryDelay}ms...`);
                showInternalToast(`Reconnecting... (${connectionRetryCountRef.current + 1})`, "warning", retryDelay + 1000);
                connectionRetryCountRef.current += 1;
                setTimeout(connectWebSocket, retryDelay);
              } else {
                logger.error("Max WS reconnect attempts reached.");
                setWsFatalError(true); // Mark as fatal after max retries
                showInternalToast("Connection failed. Please stop/restart.", "error", 5000);
                resetRecording(); // Reset recording state if connection is lost permanently
              }
            } else if (event.code === 1000) {
                logger.info("WebSocket closed cleanly.");
            } else {
                 logger.warning("WebSocket closed uncleanly or fatal error occurred, not attempting reconnect.");
                 if (isRecording || isProcessing) {
                     showInternalToast('Voice connection lost.', 'warning');
                     resetRecording();
                 }
            }
        } else {
            logger.info("WebSocket closed, but ref points to a different instance (likely a newer connection attempt). Ignoring close event for this instance.");
        }
      };

      // Return cleanup function for this specific connection attempt
      return () => {
        logger.info("Running cleanup for WebSocket connection attempt.");
        if (localWsRef && localWsRef.readyState !== WebSocket.CLOSED) {
          logger.info("Closing WebSocket from cleanup function.");
          localWsRef.close(1000, "Component unmounting or cleanup triggered");
        }
        // If the main ref still points to this instance, clear it
        if (wsConnectionRef.current === localWsRef) {
            wsConnectionRef.current = null;
            setConnectionStatus('disconnected');
        }
      };

    } catch (error: any) {
      logger.error("Failed to create WebSocket:", error);
      showInternalToast("Could not connect to voice service.", "error");
      setConnectionStatus('error');
      setWsFatalError(true); // Mark as fatal if WebSocket creation fails
      resetUI();
      return () => { logger.info("WebSocket cleanup skipped: connection failed."); }; // Return no-op cleanup on failure
    }
  }, [tableId, seatNumber, showInternalToast, resetUI, logger, checkDietaryAlerts, isRecording, isProcessing, resetRecording, wsFatalError]);

  const sendAudioChunk = useCallback((chunk: Blob) => {
    if (wsConnectionRef.current?.readyState === WebSocket.OPEN && chunk.size > 0) {
        try { wsConnectionRef.current.send(chunk); return true; }
        catch (error: any) { logger.error("Error sending audio chunk:", error); return false; }
    } else {
        logger.warning(`Cannot send audio chunk. WebSocket state: ${wsConnectionRef.current?.readyState}`);
        return false;
    }
  }, [logger]);

  // --- Recording Logic ---
  const startVisualization = useCallback(() => {
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

  const stopRecording = useCallback(() => {
    // Only stop if actually recording
    if (!isRecording || !mediaRecorderRef.current) {
        logger.warning("Stop called but not recording or recorder not ready.");
        return;
    }
    logger.info("Attempting to stop recording...");

    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current); recordingTimeoutRef.current = null;
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current); recordingTimerRef.current = null;

    const recordingTime = Date.now() - recordingStartTimeRef.current;
    logger.info(`Recording stopped after ${recordingTime}ms`);

    if (mediaRecorderRef.current?.state === "recording") {
        try { mediaRecorderRef.current.stop(); } catch (e: any) { logger.error("Error stopping media recorder:", e); }
    } else { logger.warning("MediaRecorder not active on stop."); }

    stopVisualization();
    // Audio stream is stopped in mediaRecorder.onstop

    setIsRecording(false);

    if (recordingTime < MIN_RECORDING_TIME) {
        showInternalToast("Hold longer to record", "error");
        setIsProcessing(false);
        resetUI();
        return;
    }
    setIsProcessing(true); // Set processing only if recording was long enough
    setRecordingDuration(0);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

  }, [isRecording, showInternalToast, logger, stopVisualization, resetUI]);

  const startRecording = useCallback(async () => {
    // Explicitly check permission again before starting
    if (micPermission !== 'granted') {
        logger.warning("Start recording called but permission is not granted.");
        // Optionally show a toast or handle this case, though button state should prevent it.
        // requestMicPermission(); // Or prompt again? Might be annoying.
        return;
    }
    // Check other conditions
    if (isRecording || isProcessing || connectionStatus !== 'connected' || wsFatalError) {
        logger.warning(`Start recording called in invalid state: isRecording=${isRecording}, isProcessing=${isProcessing}, connectionStatus=${connectionStatus}, wsFatalError=${wsFatalError}`);
        if (connectionStatus !== 'connected') showInternalToast("Connecting to voice service...", "warning");
        return;
    }

    logger.info("Attempting to start recording...");
    resetUI(); setTranscription(''); setShowConfirmation(false); setDietaryAlerts([]); setShowPermissionError(false);

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

        let mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            const options = ["audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/wav"];
            mimeType = options.find(opt => MediaRecorder.isTypeSupported(opt)) || "audio/webm";
            logger.info(`Using fallback MIME type: ${mimeType}`);
        }
        logger.info(`Using MIME type: ${mimeType}`);

        mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current, { mimeType });

        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
            if (event.data.size > 0) sendAudioChunk(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            logger.info("MediaRecorder stopped.");
            if (wsConnectionRef.current?.readyState === WebSocket.OPEN) {
                wsConnectionRef.current.send(JSON.stringify({ type: 'end' })); logger.info("Sent 'end' signal.");
            } else {
                logger.warning("WebSocket not open on recorder stop. Cannot send 'end' signal.");
            }
            // Stop the audio stream tracks after recording stops
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
                logger.info("Audio stream stopped after recording.");
            }
        };
        mediaRecorderRef.current.onerror = (event: Event) => {
            logger.error("MediaRecorder error:", event); showInternalToast("Recording error.", "error"); resetRecording();
        };

        // Ensure WebSocket is connected (should be due to button state, but double-check)
        if (wsConnectionRef.current?.readyState !== WebSocket.OPEN) {
             logger.error("WebSocket not open when trying to start recorder. This shouldn't happen.");
             showInternalToast("Connection error. Please wait.", "error");
             resetRecording();
             return;
        }

        mediaRecorderRef.current.start(250); // Start sending chunks every 250ms
        setIsRecording(true); recordingStartTimeRef.current = Date.now();
        startVisualization();

        setRecordingDuration(0);
        recordingTimerRef.current = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);

        recordingTimeoutRef.current = window.setTimeout(() => {
            if (isRecording) { showInternalToast("Max recording time", "warning"); stopRecording(); }
        }, MAX_RECORDING_TIME);

        if (navigator.vibrate) navigator.vibrate(50);
        showInternalToast("Recording started", "default", 2000);

    } catch (error: any) {
        logger.error("Error starting recording:", error);
        // Permission errors should be caught by requestMicPermission now, but handle just in case
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setMicPermission('denied'); setShowPermissionError(true); showInternalToast("Microphone access denied.", "error", 5000);
        } else { showInternalToast("Could not start recording.", "error"); }
        resetRecording(); // Ensure full reset on any start error
    }
  }, [isRecording, isProcessing, micPermission, resetUI, showInternalToast, connectWebSocket, logger, startVisualization, stopRecording, sendAudioChunk, connectionStatus, wsFatalError]);


  // --- Permission Handling ---
  const requestMicPermission = useCallback(async () => {
    logger.info("Requesting microphone permission...");
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        logger.error("getUserMedia not supported");
        setMicPermission('error');
        showInternalToast("Voice input not supported by this browser.", "error", 6000);
        return;
    }
    try {
        // Requesting stream just to trigger the prompt
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If successful, permission is granted (or was already granted)
        setMicPermission('granted');
        setShowPermissionError(false);
        // Immediately stop the tracks as we don't need the stream yet
        stream.getTracks().forEach(track => track.stop());
        logger.info("Microphone permission granted.");
        showInternalToast("Microphone enabled!", "default", 2000);
    } catch (err: any) {
        logger.error(`Error requesting mic permission: ${err.name}`);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicPermission('denied');
            setShowPermissionError(true); // Show detailed error message
            showInternalToast("Microphone access denied.", "error", 5000);
        } else if (err.name === 'NotFoundError') {
            setMicPermission('not-found');
            showInternalToast("No microphone found.", "error", 5000);
        } else {
            setMicPermission('error');
            showInternalToast("Error accessing microphone.", "error", 5000);
        }
    }
  }, [logger, showInternalToast]);

  // --- Effects ---

  // Effect to check initial mic permission and connect WebSocket only when granted
  useEffect(() => {
    if (testMode) return;

    let permissionStatus: PermissionStatus | null = null;
    let cleanupWebSocket: (() => void) | null = null;

    // Function to connect/disconnect WebSocket based on permission
    const handlePermissionChange = () => {
      if (permissionStatus?.state === "granted") {
        if (!cleanupWebSocket) {
          logger.info("Mic permission granted, connecting WebSocket.");
          cleanupWebSocket = connectWebSocket(); // Connect and store cleanup
        }
      } else {
        if (cleanupWebSocket) {
          logger.info(`Mic permission is ${permissionStatus?.state}, disconnecting WebSocket.`);
          cleanupWebSocket(); // Disconnect
          cleanupWebSocket = null;
        } else {
           logger.info(`Mic permission is ${permissionStatus?.state}, WebSocket remains disconnected.`);
        }
      }
    };

    // Function to check initial permission and set up listener
    const checkPermission = async () => {
      if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        logger.error("getUserMedia not supported");
        setMicPermission('error');
        showInternalToast("Voice input not supported.", "error", 6000);
        return;
      }
      try {
        if (typeof navigator.permissions?.query === 'function') {
          // Use Permissions API if available
          permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(permissionStatus.state);
          logger.info(`Initial mic permission: ${permissionStatus.state}`);
          setShowPermissionError(permissionStatus.state === 'denied');
          handlePermissionChange(); // Connect if initially granted

          // Listen for changes
          permissionStatus.onchange = () => {
            if (permissionStatus) { // Add null check
              logger.info(`Mic permission changed: ${permissionStatus.state}`);
              setMicPermission(permissionStatus.state);
              setShowPermissionError(permissionStatus.state === 'denied');
              handlePermissionChange(); // Connect/disconnect on change
            } else {
              logger.warning("Permission status changed, but status object is null.");
            }
          };
        } else {
          // Fallback: Don't try getUserMedia here, let the user click the button if needed.
          // Assume 'prompt' state if Permissions API is not supported.
          logger.info("Permissions API not supported. Assuming 'prompt' state.");
          setMicPermission('prompt');
          setShowPermissionError(false);
          // Do not call handlePermissionChange here, wait for user interaction.
        }
      } catch (err: any) {
        // This catch block might be less likely to hit if we don't call getUserMedia fallback
        logger.error(`Mic permission check error: ${err.name} - ${err.message}`);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermission('denied');
          setShowPermissionError(true);
        } else if (err.name === 'NotFoundError') {
          setMicPermission('not-found');
        } else {
          setMicPermission('error');
        }
        showInternalToast("Error checking microphone status.", "error", 5000);
        // Ensure WebSocket is disconnected on error
        if (cleanupWebSocket) {
          cleanupWebSocket();
          cleanupWebSocket = null;
        }
      }
    };

    checkPermission();

    // Cleanup function for the effect
    return () => {
      logger.info("Cleaning up mic permission listener and WebSocket connection.");
      if (permissionStatus) {
        permissionStatus.onchange = null; // Remove listener
      }
      if (cleanupWebSocket) {
        cleanupWebSocket(); // Disconnect WebSocket
        cleanupWebSocket = null;
      }
    };
  }, [testMode, showInternalToast, logger, connectWebSocket]); // Dependencies

  // Initialize audio bars
  useEffect(() => {
    if (audioVisualizationRef.current) {
        audioVisualizationRef.current.innerHTML = '';
        for (let i = 0; i < AUDIO_VISUALIZER_BARS; i++) {
            const bar = document.createElement('div');
            bar.className = 'voice-audio-bar';
            bar.style.height = '5px';
            audioVisualizationRef.current.appendChild(bar);
        }
    }
  }, []);

  // --- Test Mode ---
  const simulateTranscription = useCallback(() => {
    if (!testMode || !isProcessing || isRecording) return;
    const sampleOrders = [ "Burger, fries, Coke.", "Salad, chicken, nut allergy.", "Veg pasta, red wine." ];
    const sampleText = sampleOrders[Math.floor(Math.random() * sampleOrders.length)];
    setTimeout(() => {
        setTranscription(sampleText); setLastTranscription(sampleText);
        setShowConfirmation(true); setIsProcessing(false); checkDietaryAlerts(sampleText);
    }, 1000 + Math.random() * 1000);
    logger.info(`Test mode: Simulated: "${sampleText}"`);
  }, [testMode, isProcessing, isRecording, checkDietaryAlerts, logger]);

  useEffect(() => {
    if (testMode && isProcessing && !isRecording) simulateTranscription();
  }, [testMode, isProcessing, isRecording, simulateTranscription]);

  // --- Cleanup ---
  useEffect(() => {
    const handlePageHide = () => {
         if (IS_SAFARI && audioContextRef.current) {
            logger.info("Safari pagehide: Closing AudioContext.");
            audioContextRef.current.close().catch((e: any) => logger.error("Error closing audio context on pagehide:", e)); // Added type
            audioContextRef.current = null;
        }
     };
    const handleTouchStart = () => {
         if (IS_SAFARI && audioContextRef.current && audioContextRef.current.state === 'suspended') {
            logger.info("Resuming suspended AudioContext on touch.");
            audioContextRef.current.resume().catch((e: any) => logger.error("Error resuming AudioContext:", e)); // Added type
        }
     };
    if (IS_SAFARI) {
         window.addEventListener('pagehide', handlePageHide);
         document.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });
     }
    return () => {
        logger.info("Cleaning up VoiceOrderPanel...");
        stopAudioStream(); // Stop audio stream here on component unmount
        stopVisualization();
        if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        if (wsConnectionRef.current && wsConnectionRef.current.readyState !== WebSocket.CLOSED) {
             wsConnectionRef.current.close();
        }
        wsConnectionRef.current = null;
        if (IS_SAFARI) {
             window.removeEventListener('pagehide', handlePageHide);
         }
    };
  }, [stopAudioStream, stopVisualization, logger]);

  // --- UI Interaction ---
  const confirmTranscription = useCallback(() => {
    const textToSubmit = transcription || "";
    if (!textToSubmit || isProcessing) return;
    logger.info('Order confirmed:', textToSubmit);
    // const orderId = storeOrder(textToSubmit); // Optional: Store order locally
    if (onOrderSubmitted) onOrderSubmitted(textToSubmit);
    else showInternalToast("Order confirmed (no submit handler)", "default");
    resetUI();
  }, [transcription, isProcessing, onOrderSubmitted, resetUI, logger, showInternalToast]);

  const cancelTranscription = useCallback(() => {
    logger.info('Order cancelled');
    resetUI();
    showInternalToast("Order cancelled", "default");
  }, [resetUI, logger, showInternalToast]);

  // New handler for button click action
  const handleRecordButtonClick = useCallback(() => {
    if (micPermission === 'prompt') {
        requestMicPermission();
    } else if (micPermission === 'denied') {
        showInternalToast("Microphone access is denied. Please enable it in your browser settings.", "error", 6000);
        setShowPermissionError(true); // Ensure detailed message is shown
    } else if (micPermission === 'granted') {
        // Do nothing on click if granted, press-and-hold handles it
        logger.info("Mic granted. Press and hold to record.");
    } else {
        // Handle other states like null, error, not-found if needed
        showInternalToast("Microphone not available or status unknown.", "error");
    }
  }, [micPermission, requestMicPermission, showInternalToast, logger]);

  // Conditional press-and-hold handlers - Ensure permission is granted before acting
  const handleMouseDown = () => {
    if (micPermission === 'granted' && !isButtonDisabled) { // Check disabled state too
        startRecording();
    } else if (micPermission !== 'granted') {
        logger.warning("Mouse down ignored: Mic permission not granted.");
        handleRecordButtonClick(); // Trigger permission request or explanation
    }
  };
  const handleMouseUp = () => {
    // Stop recording only if it was actually started (i.e., permission was granted on mouse down)
    if (isRecording) {
        stopRecording();
    }
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior like scrolling
    if (micPermission === 'granted' && !isButtonDisabled) { // Check disabled state too
        startRecording();
    } else if (micPermission !== 'granted') {
        logger.warning("Touch start ignored: Mic permission not granted.");
        handleRecordButtonClick(); // Trigger permission request or explanation
    }
  };
  const handleTouchEnd = () => {
    // Stop recording only if it was actually started
    if (isRecording) {
        stopRecording();
    }
  };


  // --- Render ---
  const renderToasts = () => ( // Using hook's toast component implicitly now
    <div ref={toastContainerRef} className="toast-container">
        {/* Toasts are rendered by the useToast hook provider */}
    </div>
  );

  const renderTableSelection = useMemo(() => (
    <div className="table-selection">
        <h3>Selected Table: <span className="selected-table-number">{tableName || 'N/A'}</span></h3>
        <div className="tables-grid">
            {tableId && (<div className="table selected" data-table-id={tableId} data-seat-number={seatNumber || ''}>
                {tableName || `Table ${tableId}`} {seatNumber ? `- Seat ${seatNumber}` : ''}
            </div>)}
        </div>
    </div>
  ), [tableId, tableName, seatNumber]);

  const transcriptionDisplayText = useMemo(() => {
    if (isProcessing) return "Processing...";
    if (transcription) return transcription;
    // Check specific permission states
    if (micPermission === 'denied') return "Microphone access denied. Please enable in Settings.";
    if (micPermission === 'not-found') return "No microphone found.";
    if (micPermission === 'error') return "Microphone error.";
    if (micPermission === 'prompt') return "Click button to enable microphone."; // Changed text
    if (micPermission === null) return "Checking microphone status..."; // Initial state
    return "Press and hold to record order"; // Granted state
  }, [isProcessing, transcription, micPermission]);

  // Format time function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine button content based on state
  const getButtonContent = () => {
    if (isProcessing) {
        return <><Volume2 className="mr-2 h-4 w-4 animate-pulse" /> Processing...</>;
    }
    if (isRecording) {
        return <><Square className="mr-2 h-4 w-4" /> Stop Recording</>;
    }
    if (micPermission === 'prompt') {
        return <><Mic className="mr-2 h-4 w-4" /> Enable Microphone</>;
    }
    if (micPermission === 'denied' || micPermission === 'error' || micPermission === 'not-found' || micPermission === null) {
        return <><MicOff className="mr-2 h-4 w-4" /> Mic Unavailable</>;
    }
    // Default (micPermission === 'granted')
    return <><Mic className="mr-2 h-4 w-4" /> Hold to Record</>;
  };

  // Determine if button should be disabled
  const isButtonDisabled = useMemo(() => {
    return isProcessing ||
           micPermission === 'denied' ||
           micPermission === 'not-found' ||
           micPermission === 'error' ||
           micPermission === null || // Disable while checking
           (micPermission === 'granted' && connectionStatus !== 'connected') || // Disable if granted but not connected
           wsFatalError;
  }, [isProcessing, micPermission, connectionStatus, wsFatalError]);


  return (
    <div className="voice-order-container">
        {renderToasts()}
        <h2>Voice Order System {testMode && <span className="test-mode-badge">(Test Mode)</span>}</h2>
        {renderTableSelection}

        <div className="voice-recognition-section">
            <div ref={recordingIndicatorRef} className={`recording-indicator ${isRecording ? 'visible' : ''}`}>
                Recording... {recordingDuration > 0 && <span className="recording-time">{formatTime(recordingDuration)}</span>}
            </div>
            <div ref={audioVisualizationRef} className="voice-audio-visualizer"> {/* Use correct class */}
                {/* Bars added via useEffect */}
            </div>
            {showPermissionError && micPermission === 'denied' && ( // Only show detailed error if denied
                <div ref={permissionErrorRef} className="permission-error">
                    <p><strong>Microphone Access Required</strong></p>
                    <p>Please grant microphone access in browser/device settings:</p>
                    <ol>
                        <li>Go to Settings {'>'} Safari/Browser</li>
                        <li>Find Microphone settings</li>
                        <li>Allow access for this site</li>
                        <li>Reload page</li>
                    </ol>
                </div>
            )}
            <div ref={transcriptionDisplayRef} className="transcription-display">
                {transcriptionDisplayText}
            </div>
            <div ref={dietaryAlertContainerRef} className={`dietary-alert ${dietaryAlerts.length > 0 ? 'visible' : ''}`}>
                <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${orderType === "food" ? "text-teal-400" : "text-amber-400"}`} />
                <span className="dietary-alert-text">
                    <strong>Dietary Note:</strong> {dietaryAlerts.join(', ')}
                </span>
            </div>
            {showConfirmation ? (
                <div ref={confirmationButtonsRef} className="confirmation-buttons">
                    <Button onClick={confirmTranscription} className="confirm-button">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Order
                    </Button>
                    <Button onClick={cancelTranscription} variant="outline" className="cancel-button">
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                </div>
            ) : (
                <motion.div className="relative" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
                    <Button
                        ref={voiceButtonRef}
                        onClick={handleRecordButtonClick} // Use onClick for initial action
                        onMouseDown={handleMouseDown}     // Conditional press
                        onMouseUp={handleMouseUp}         // Conditional release
                        onTouchStart={handleTouchStart}   // Conditional touch press
                        onTouchEnd={handleTouchEnd}       // Conditional touch release
                        disabled={isButtonDisabled}       // Updated disabled logic
                        className={`voice-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''} ${micPermission !== 'granted' ? 'mic-not-granted' : ''}`} // Add class for styling non-granted states
                    >
                        {getButtonContent()} {/* Updated button content logic */}
                    </Button>
                </motion.div>
            )}
        </div>
    </div>
  );
}
