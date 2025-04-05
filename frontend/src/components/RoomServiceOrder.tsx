import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { debug } from "../utils/debug";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/outline";

// Reuse Order interface if applicable, or define specific fields
interface Order {
  id: string;
  text: string; // This will hold the potentially edited text
  status: "pending" | "confirmed" | "cancelled";
  order_type: "table" | "room_service" | "memory_care";
  room_number?: string;
  raw_transcription?: string | null; // Add field for raw transcription
  created_at: string;
}

const DEBUG_OPTIONS = { component: "RoomServiceOrder", timestamp: true };

const RoomServiceOrder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [orderText, setOrderText] = useState(""); // Text displayed (potentially edited)
  const [rawTranscriptionResult, setRawTranscriptionResult] = useState<
    string | null
  >(null); // Store raw result
  const [roomNumber, setRoomNumber] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const queryClient = useQueryClient();

  // Simplified create order mutation for room service
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      debug.logApiCall("/api/orders", "POST", orderData, DEBUG_OPTIONS);
      const response = await api.post("/api/orders", orderData);
      return response.data;
    },
    onSuccess: () => {
      setOrderText("");
      setRoomNumber(""); // Clear room number after submission
      setRawTranscriptionResult(null); // Clear transcription
      setError(null);
      debug.info("Room service order created successfully", DEBUG_OPTIONS);
      alert("Room service order submitted!"); // Simple feedback
    },
    onError: (error: any) => {
      debug.error("Failed to create room service order", DEBUG_OPTIONS, error);
      setError(
        error.response?.data?.message ||
          "Failed to create order. Please try again.",
      );
    },
  });

  // Reusing recording logic from OrderInterface (could be extracted to a hook later)
  const startRecording = async () => {
    try {
      debug.debug("Starting audio recording", DEBUG_OPTIONS);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          debug.debug(
            "Audio data available, sending for transcription",
            DEBUG_OPTIONS,
          );
          const formData = new FormData();
          formData.append("audio", event.data);
          formData.append("text", orderText); // Send current text for context if needed

          try {
            debug.logApiCall(
              "/api/orders/transcribe",
              "POST",
              { hasAudio: true },
              DEBUG_OPTIONS,
            );
            const response = await api.post(
              "/api/orders/transcribe",
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
            const transcribedText = response.data.text;
            setOrderText(transcribedText); // Update displayed text
            setRawTranscriptionResult(transcribedText); // Store raw result
            debug.info("Audio transcribed successfully", DEBUG_OPTIONS);
          } catch (error: any) {
            debug.error("Failed to transcribe audio", DEBUG_OPTIONS, error);
            setRawTranscriptionResult(null); // Clear raw result on error
            setError("Failed to transcribe audio. Please try again.");
          }
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      debug.error("Failed to access microphone", DEBUG_OPTIONS, err);
      setError("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      debug.debug("Stopping audio recording", DEBUG_OPTIONS);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!orderText.trim()) {
      setError("Please enter or record an order.");
      return;
    }
    if (!roomNumber.trim()) {
      setError("Please enter a room number.");
      return;
    }

    // Include raw_transcription in the payload
    const orderData: Partial<Order> & { text: string } = {
      text: orderText.trim(), // Send potentially edited text as 'details'
      raw_transcription: rawTranscriptionResult, // Send stored raw transcription
      status: "pending",
      order_type: "room_service",
      room_number: roomNumber,
      // meal_period could be added if needed
    };
    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-dark-text text-center">
        Room Service Order
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-dark-secondary p-6 rounded-lg shadow-md space-y-6"
      >
        {error && (
          <div className="p-3 bg-red-900 border border-red-700 rounded-md">
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}
        <div>
          <label
            htmlFor="roomNumber"
            className="block text-sm font-medium text-dark-text-secondary mb-1"
          >
            Room Number
          </label>
          <input
            id="roomNumber"
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="w-full rounded-md bg-dark-primary border-dark-border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-dark-text sm:text-sm"
            required
            placeholder="Enter room number"
          />
        </div>

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
              rows={5}
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              className="w-full rounded-md bg-dark-primary border-dark-border focus:border-blue-500 focus:ring-blue-500 text-dark-text sm:text-sm"
              placeholder="Enter order details or hold button to record..."
              required
            />
            <div className="absolute bottom-2 right-2 flex items-center">
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 animate-pulse"
                    : "bg-dark-button-bg hover:bg-dark-button-hover focus:ring-blue-500"
                }`}
                aria-label={isRecording ? "Stop Recording" : "Hold to Record"}
              >
                {isRecording ? (
                  <StopIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createOrderMutation.isPending
              ? "Submitting..."
              : "Submit Room Service Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomServiceOrder;
