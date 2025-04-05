import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom"; // Import useParams instead of useLocation
import api from "../utils/api";
// import axios from 'axios'; // Keep commented out
import { debug } from "../utils/debug";
import {
  MicrophoneIcon,
  StopIcon,
  StarIcon,
  // ClockIcon, // Already removed
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { HomeIcon, HeartIcon } from "@heroicons/react/24/solid";

interface Order {
  id: string;
  text: string;
  status: "pending" | "confirmed" | "cancelled";
  order_type: "table" | "room_service" | "memory_care";
  table_id?: number;
  seat_number?: number;
  room_number?: string;
  raw_transcription?: string | null; // Add the missing field
  created_at: string;
  meal_period?: string;
  is_favorite?: boolean;
}

interface Resident {
  id: number;
  name: string;
  preferred_table_id?: number;
  preferred_seat_number?: number;
  medical_dietary?: string[];
  texture_prefs?: string[];
}

// Use a specific type for the basic table info needed for the dropdown
interface TableBasicInfo {
  id: number;
  number: number;
  seats: number;
}

interface QuickOrderOption {
  id: string;
  details: string;
  frequency: number;
}

// interface DailySpecial { // Already removed
// ...
// }

const DEBUG_OPTIONS = { component: "OrderInterface", timestamp: true };

export const OrderInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [orderText, setOrderText] = useState(""); // Text displayed (potentially edited)
  const [rawTranscriptionResult, setRawTranscriptionResult] = useState<
    string | null
  >(null); // Store raw result
  const [orderType, setOrderType] = useState<
    "table" | "room_service" | "memory_care"
  >("table");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [quickOrderOptions, setQuickOrderOptions] = useState<
    QuickOrderOption[]
  >([]);
  const [identifiedResident, setIdentifiedResident] = useState<Resident | null>(
    null,
  );
  // const [currentMealPeriod, setCurrentMealPeriod] = useState<string>(''); // Already removed
  const [transcriptionStatus, setTranscriptionStatus] = useState<
    "idle" | "recording" | "processing" | "success" | "error"
  >("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioVisualizerRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const queryClient = useQueryClient();
  const { tableId: tableIdParam, seatId: seatIdParam } = useParams<{
    tableId: string;
    seatId: string;
  }>(); // Get params
  const [orderStep, setOrderStep] = useState<"category" | "record">("category"); // State for multi-step flow
  const [selectedCategory, setSelectedCategory] = useState<
    "food" | "drinks" | null
  >(null); // Store selected category

  // Debug state changes
  useEffect(() => {
    debug.logState(
      {
        isRecording,
        orderText,
        rawTranscriptionResult, // Debug new state
        orderType,
        selectedTable,
        selectedSeat,
        roomNumber,
        error,
        identifiedResident,
        // currentMealPeriod, // Already removed
        transcriptionStatus,
      },
      DEBUG_OPTIONS,
    );
  }, [
    isRecording,
    orderText,
    rawTranscriptionResult,
    orderType,
    selectedTable,
    selectedSeat,
    roomNumber,
    error,
    identifiedResident,
    /* currentMealPeriod, */ transcriptionStatus,
  ]); // Already removed currentMealPeriod dependency

  // Set up audio visualization
  useEffect(() => {
    if (isRecording && mediaRecorderRef.current) {
      const canvas = audioVisualizerRef.current;
      if (!canvas) return;

      // Set up audio context and analyzer if they don't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        // Connect the microphone stream to the analyzer
        const source = audioContextRef.current.createMediaStreamSource(
          mediaRecorderRef.current.stream,
        );
        source.connect(analyserRef.current);
      }

      const ctx = canvas.getContext("2d");
      if (!ctx || !analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      // Draw the visualization
      const draw = () => {
        if (!isRecording) return;
        requestAnimationFrame(draw);

        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.fillStyle = "rgba(14, 17, 23, 0.8)";
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          const barWidth = (WIDTH / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * HEIGHT;

            // Gradient based on frequency
            const gradient = ctx.createLinearGradient(
              0,
              HEIGHT,
              0,
              HEIGHT - barHeight,
            );
            gradient.addColorStop(0, "rgba(29, 78, 216, 0.8)");
            gradient.addColorStop(1, "rgba(59, 130, 246, 0.5)");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }
        }
      };

      draw();
    }

    return () => {
      if (audioContextRef.current && !isRecording) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [isRecording]);

  // Effect to initialize state from URL parameters
  useEffect(() => {
    if (tableIdParam && seatIdParam) {
      const tableIdNum = parseInt(tableIdParam, 10);
      const seatIdNum = parseInt(seatIdParam, 10);
      if (!isNaN(tableIdNum) && !isNaN(seatIdNum)) {
        debug.info(
          `Received table/seat from URL params: Table ${tableIdNum}, Seat ${seatIdNum}`,
          DEBUG_OPTIONS,
        );
        setOrderType("table"); // Ensure order type is table
        setSelectedTable(tableIdNum);
        setSelectedSeat(seatIdNum);
        // Optionally, clear room number if navigating from table view
        setRoomNumber("");
      } else {
        debug.warn(
          `Invalid table/seat params received: ${tableIdParam}, ${seatIdParam}`,
          DEBUG_OPTIONS,
        );
        // Handle invalid params, e.g., navigate back or show error
      }
    }
    // Clear selection if params are missing (e.g., direct navigation to /orders without params)
    // else {
    //   setSelectedTable(null);
    //   setSelectedSeat(null);
    // }
  }, [tableIdParam, seatIdParam]); // Re-run if URL params change

  // Meal Period Fetching already removed

  // Fetch basic table list for dropdown
  const { data: tables, isLoading: isLoadingTables } = useQuery<
    TableBasicInfo[]
  >({
    queryKey: ["tables-list"], // Update query key
    queryFn: async () => {
      debug.logApiCall("/api/tables/list", "GET", {}, DEBUG_OPTIONS); // Use new endpoint
      const response = await api.get("/api/tables/list"); // Use new endpoint
      debug.info("Basic table list fetched successfully", DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
  });

  // Daily Special Fetching already removed

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: Partial<Order>) => {
      debug.logApiCall("/api/orders", "POST", order, DEBUG_OPTIONS);
      const response = await api.post("/api/orders", order);
      debug.info("Order created successfully", DEBUG_OPTIONS);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] }); // Maybe invalidate activeOrders too?
      setOrderText("");
      setRawTranscriptionResult(null); // Clear raw transcription on success
      setError(null);
      debug.info("Order creation completed", DEBUG_OPTIONS);
    },
    onError: (error: any) => {
      debug.error("Failed to create order", DEBUG_OPTIONS, error);
      setError(
        error.response?.data?.message ||
          "Failed to create order. Please try again.",
      );
    },
  });

  // Fetch quick order options when table/seat is selected
  useEffect(() => {
    const getQuickOrderOptions = async () => {
      // Check if currentMealPeriod exists before using it (it's removed, so this check needs update)
      if (selectedTable && selectedSeat) {
        // currentMealPeriod check already removed
        try {
          // Removed meal_period query parameter
          debug.logApiCall(
            `/api/quick-orders/table/${selectedTable}/seat/${selectedSeat}`,
            "GET",
            {},
            DEBUG_OPTIONS,
          );
          const response = await api.get(
            `/api/quick-orders/table/${selectedTable}/seat/${selectedSeat}`,
          );
          setQuickOrderOptions(response.data.options || []);
          setIdentifiedResident(response.data.resident || null);
          debug.info("Quick order options fetched successfully", DEBUG_OPTIONS);
        } catch (error) {
          debug.warn("Failed to fetch quick order options", DEBUG_OPTIONS);
          setQuickOrderOptions([]);
          setIdentifiedResident(null);
        }
      } else {
        setQuickOrderOptions([]);
        setIdentifiedResident(null);
      }
    };

    getQuickOrderOptions();
  }, [selectedTable, selectedSeat]); // Already removed currentMealPeriod dependency

  const startRecording = async () => {
    try {
      debug.debug("Starting audio recording", DEBUG_OPTIONS);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Find a supported MIME type
      const supportedTypes = [
        "audio/webm;codecs=opus", // Prefer webm with opus
        "audio/webm", // Fallback to webm
        "audio/ogg;codecs=opus", // Original preference
        "audio/ogg", // Fallback ogg
        "audio/mp4", // Another common format
      ];
      const supportedMimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      debug.logState(
        `Supported MIME type found: ${supportedMimeType || "Browser Default"}`,
        DEBUG_OPTIONS,
      ); // Corrected method name

      // Create MediaRecorder with the supported type, or let the browser choose default
      const recorderOptions = supportedMimeType
        ? { mimeType: supportedMimeType }
        : {};
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      // Show visual feedback for recording in progress
      const pulseEffect = document.createElement("div");
      pulseEffect.className =
        "absolute inset-0 bg-red-500 bg-opacity-20 rounded-full animate-ping";
      const micButton = document.querySelector("#voice-record-button");
      if (micButton) micButton.appendChild(pulseEffect);

      mediaRecorder.ondataavailable = (event) => {
        console.log("ondataavailable event fired:", event); // Log the event object
        if (event.data.size > 0) {
          console.log("Pushing audio chunk, size:", event.data.size); // Log chunk size
          audioChunks.push(event.data);
        } else {
          console.log("ondataavailable fired with empty data chunk."); // Log if data size is 0
        }
      };

      mediaRecorder.onstop = async () => {
        debug.debug(
          "Audio recording stopped, processing chunks",
          DEBUG_OPTIONS,
        );
        // Removed check for audioChunks.length === 0, as it might be unreliable
        // Always attempt to create the blob and process

        // Process audio chunks
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(",")[1]; // Remove data URL prefix
          if (!base64Audio) {
            debug.error("Failed to convert audio to base64", DEBUG_OPTIONS);
            setError("Failed to process audio data. Please try again.");
            return;
          }

          debug.debug("Sending audio for transcription", DEBUG_OPTIONS);
          try {
            // Use voice endpoint with base64 data
            debug.logApiCall(
              "/api/orders/voice",
              "POST",
              { hasAudio: true },
              DEBUG_OPTIONS,
            );
            const response = await api.post("/api/orders/voice", {
              audio_data: base64Audio,
            });

            const transcribedText = response.data.transcription;
            setOrderText(transcribedText); // Update displayed text
            setRawTranscriptionResult(transcribedText); // Store raw result
            debug.info("Audio transcribed successfully", DEBUG_OPTIONS);

            // Add visual feedback for successful transcription
            setTranscriptionStatus("success");
            setTimeout(() => setTranscriptionStatus("idle"), 2000);
          } catch (error: any) {
            debug.error("Failed to transcribe audio", DEBUG_OPTIONS, error);
            setRawTranscriptionResult(null); // Clear raw result on error
            setError("Failed to transcribe audio. Please try again.");
            setTranscriptionStatus("error");
            setTimeout(() => setTranscriptionStatus("idle"), 2000);
          }
        };
      };

      mediaRecorder.start(1000); // Add 1-second timeslice
      setIsRecording(true);
      setTranscriptionStatus("recording");
      debug.info("Recording started", DEBUG_OPTIONS);
    } catch (error: any) {
      // Log the actual error object from getUserMedia
      console.error("getUserMedia failed:", error);
      debug.error("Failed to access microphone", DEBUG_OPTIONS, error);
      // Add error name and message to the displayed error
      setError(
        `Failed to access microphone. Please check permissions. (${error.name}: ${error.message})`,
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      debug.debug(
        "Stopping audio recording after short delay...",
        DEBUG_OPTIONS,
      );
      // Add a small delay before stopping to allow data collection
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, 100); // 100ms delay, adjust if needed
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      setTranscriptionStatus("processing");
      debug.info("Recording stopped, processing started", DEBUG_OPTIONS);

      // Clean up audio context and analyzer
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }

      // Clean up the pulse effect
      const micButton = document.querySelector("#voice-record-button");
      const pulseEffect = micButton?.querySelector(".animate-ping");
      if (pulseEffect) pulseEffect.remove();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    debug.debug("Attempting to submit order", DEBUG_OPTIONS);

    if (!orderText.trim()) {
      debug.warn("Order text is empty", DEBUG_OPTIONS);
      setError("Please enter an order or use voice recording");
      return;
    }

    if (orderType === "table" && (!selectedTable || !selectedSeat)) {
      debug.warn("Missing table or seat selection", DEBUG_OPTIONS);
      setError("Please select a table and seat number");
      return;
    }

    if (
      (orderType === "room_service" || orderType === "memory_care") &&
      !roomNumber
    ) {
      debug.warn("Missing room number", DEBUG_OPTIONS);
      setError("Please enter a room number");
      return;
    }

    const orderData: Partial<Order> & { text: string } = {
      // Ensure text is always sent
      text: orderText.trim(), // Send the potentially edited text as 'details'
      raw_transcription: rawTranscriptionResult, // Send the stored raw transcription
      status: "pending",
      order_type: orderType,
      table_id: orderType === "table" ? selectedTable || undefined : undefined,
      seat_number:
        orderType === "table" ? selectedSeat || undefined : undefined,
      room_number:
        orderType === "room_service" || orderType === "memory_care"
          ? roomNumber
          : undefined,
      // meal_period: currentMealPeriod, // Already removed
    };

    debug.debug("Submitting order with data:", DEBUG_OPTIONS);
    debug.logState(orderData, DEBUG_OPTIONS);
    createOrderMutation.mutate(orderData);
  };

  const handleQuickOrderSelect = (option: QuickOrderOption) => {
    setOrderText(option.details);
    debug.info(`Selected quick order: ${option.details}`, DEBUG_OPTIONS);
  };

  // handleDailySpecialSelect already removed

  if (isLoadingTables) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    // Apply dark theme padding/margins if needed, or rely on Layout's padding
    <div className="max-w-4xl mx-auto">
      {/* Use dark theme background and text colors */}
      <div className="bg-dark-secondary shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-text">Place Order</h2>
          {/* Adjust meal period display for dark theme */}
          {/* Meal Period Display already removed */}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md">
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Removed Order Type Selection - Assume 'table' based on navigation */}
          {/* Removed Location Selection - Assume table/seat passed via params */}

          {/* Step 1: Category Selection */}
          {orderStep === "category" && (
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                Select Order Category
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Food Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("food");
                    setOrderStep("record");
                    debug.info("Selected category: Food", DEBUG_OPTIONS);
                  }}
                  className={`p-6 rounded-lg border transition-colors flex flex-col items-center justify-center ${
                    selectedCategory === "food"
                      ? "border-blue-500 bg-dark-accent text-blue-300"
                      : "border-dark-border hover:border-blue-500 text-dark-text-secondary hover:text-dark-text"
                  }`}
                >
                  {/* Placeholder Icon for Food */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 mb-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  Food
                </button>
                {/* Drinks Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("drinks");
                    setOrderStep("record");
                    debug.info("Selected category: Drinks", DEBUG_OPTIONS);
                  }}
                  className={`p-6 rounded-lg border transition-colors flex flex-col items-center justify-center ${
                    selectedCategory === "drinks"
                      ? "border-blue-500 bg-dark-accent text-blue-300"
                      : "border-dark-border hover:border-blue-500 text-dark-text-secondary hover:text-dark-text"
                  }`}
                >
                  {/* Placeholder Icon for Drinks */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 mb-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                    />{" "}
                    {/* Simple arrow for now */}
                  </svg>
                  Drinks
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Recording Interface (Only show after category selected) */}
          {orderStep === "record" && (
            <>
              {/* Keep Identified Resident, Quick Orders, Daily Special */}

              {/* Identified Resident - Dark Theme */}
              {identifiedResident && (
                <div className="p-4 bg-dark-accent rounded-lg border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900 bg-opacity-50 rounded-full flex items-center justify-center border border-blue-700">
                      <span className="text-blue-300 font-bold">
                        {identifiedResident.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-text">
                        {identifiedResident.name}
                      </h3>
                      {identifiedResident.medical_dietary &&
                        identifiedResident.medical_dietary.length > 0 && (
                          <p className="text-sm text-red-400">
                            Dietary Restrictions:{" "}
                            {identifiedResident.medical_dietary.join(", ")}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Order Options - Dark Theme */}
              {quickOrderOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-dark-text-secondary mb-2 flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    Quick Order Options
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {quickOrderOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleQuickOrderSelect(option)}
                        className="text-left p-3 border border-dark-border rounded-md bg-dark-primary hover:bg-dark-accent hover:border-blue-700 transition-colors"
                      >
                        <p className="font-medium text-dark-text">
                          {option.details}
                        </p>
                        <p className="text-xs text-dark-text-secondary">
                          Ordered {option.frequency} times
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Special Section Fully Removed */}

              {/* Order Input - Dark Theme */}
              <div>
                <label
                  htmlFor="orderText"
                  className="block text-sm font-medium text-dark-text-secondary mb-1"
                >
                  Order Details
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <textarea
                    id="orderText"
                    rows={4}
                    value={orderText}
                    onChange={(e) => setOrderText(e.target.value)}
                    className="w-full rounded-md bg-dark-primary border-dark-border focus:border-blue-500 focus:ring-blue-500 text-dark-text sm:text-sm" // Dark theme styles
                    placeholder="Enter order details or hold button to record..."
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {/* Voice recording controls with visual feedback */}
                    <div className="relative">
                      <button
                        id="voice-record-button"
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording} // Stop if mouse leaves button while pressed
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary relative z-10 ${
                          isRecording
                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" // Red when recording (animation handled separately)
                            : transcriptionStatus === "success"
                              ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" // Green for successful transcription
                              : transcriptionStatus === "error"
                                ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500" // Yellow for error
                                : "bg-dark-button-bg hover:bg-dark-button-hover focus:ring-blue-500" // Default dark theme
                        }`}
                        aria-label={
                          isRecording
                            ? "Release to Stop Recording"
                            : "Hold to Record Voice Order"
                        }
                        disabled={!selectedTable && orderType === "table"}
                      >
                        {isRecording ? (
                          <StopIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <MicrophoneIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      {/* Audio visualizer */}
                      {isRecording && (
                        <div className="absolute -top-12 -left-24 w-64 h-8 bg-dark-secondary bg-opacity-80 rounded-lg overflow-hidden border border-dark-border z-20">
                          <canvas
                            ref={audioVisualizerRef}
                            className="w-full h-full"
                            width="256"
                            height="32"
                          />
                        </div>
                      )}

                      {/* Status indicator */}
                      {transcriptionStatus === "processing" && (
                        <div className="absolute -top-8 right-0 text-xs text-blue-300 animate-pulse">
                          Processing...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button - Dark Theme */}
              <div>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-dark-button-bg hover:bg-dark-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-blue-500 disabled:opacity-50"
                >
                  {createOrderMutation.isPending
                    ? "Submitting..."
                    : "Submit Order"}
                </button>
              </div>
            </> // End of conditional rendering block
          )}
        </form>
      </div>
    </div>
  );
};

export default OrderInterface;
