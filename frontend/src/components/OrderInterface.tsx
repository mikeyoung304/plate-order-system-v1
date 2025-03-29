import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, CheckIcon, XIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Order {
  id: string;
  table_id: number;
  seat_number: number;
  details: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export const OrderInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const queryClient = useQueryClient();

  // Fetch orders for the current table
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders', 1], // Assuming table 1 for now
    queryFn: async () => {
      const response = await axios.get('/api/orders/table/1');
      return response.data;
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (audioData: string) => {
      const response = await axios.post('/api/orders/voice', { audio_data: audioData });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsRecording(false);
      setAudioData(null);
    },
  });

  // Confirm order mutation
  const confirmOrderMutation = useMutation({
    mutationFn: async ({ orderId, confirmed }: { orderId: string; confirmed: boolean }) => {
      const response = await axios.post(`/api/orders/${orderId}/confirm`, { confirmed });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioData(base64Audio.split(',')[1]);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSubmitOrder = () => {
    if (audioData) {
      createOrderMutation.mutate(audioData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Table Orders</h2>
        
        {/* Recording Interface */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              {isRecording ? (
                <StopIcon className="h-6 w-6" />
              ) : (
                <MicrophoneIcon className="h-6 w-6" />
              )}
            </button>
            {audioData && (
              <button
                onClick={handleSubmitOrder}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit Order
              </button>
            )}
          </div>
          {isRecording && (
            <div className="mt-4 text-center text-red-500 animate-pulse">
              Recording in progress...
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center">Loading orders...</div>
          ) : (
            orders?.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      Table {order.table_id} - Seat {order.seat_number}
                    </p>
                    <p className="text-gray-600">{order.details}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            confirmOrderMutation.mutate({
                              orderId: order.id,
                              confirmed: true,
                            })
                          }
                          className="p-2 text-green-500 hover:text-green-600"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            confirmOrderMutation.mutate({
                              orderId: order.id,
                              confirmed: false,
                            })
                          }
                          className="p-2 text-red-500 hover:text-red-600"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        order.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 