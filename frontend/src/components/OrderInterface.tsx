import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, CheckIcon, XCircleIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { debug } from '../utils/debug';

interface Order {
  id: string;
  text: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  order_type: 'table' | 'room_service' | 'memory_care';
  table_id?: number;
  seat_number?: number;
  room_number?: string;
  created_at: string;
}

interface Table {
  id: number;
  number: number;
  seats: number;
}

const DEBUG_OPTIONS = { component: 'OrderInterface', timestamp: true };

export const OrderInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [orderText, setOrderText] = useState('');
  const [orderType, setOrderType] = useState<'table' | 'room_service' | 'memory_care'>('table');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const queryClient = useQueryClient();

  // Debug state changes
  useEffect(() => {
    debug.logState({
      isRecording,
      orderText,
      orderType,
      selectedTable,
      selectedSeat,
      roomNumber,
      error,
    }, DEBUG_OPTIONS);
  }, [isRecording, orderText, orderType, selectedTable, selectedSeat, roomNumber, error]);

  // Fetch tables
  const { data: tables, isLoading: isLoadingTables } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      debug.logApiCall('/api/tables', 'GET', {}, DEBUG_OPTIONS);
      const response = await axios.get('/api/tables');
      debug.info('Tables fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: Partial<Order>) => {
      debug.logApiCall('/api/orders', 'POST', order, DEBUG_OPTIONS);
      const response = await axios.post('/api/orders', order);
      debug.info('Order created successfully', DEBUG_OPTIONS);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setOrderText('');
      setError(null);
      debug.info('Order creation completed', DEBUG_OPTIONS);
    },
    onError: (error: any) => {
      debug.error('Failed to create order', DEBUG_OPTIONS, error);
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
    },
  });

  const startRecording = async () => {
    try {
      debug.debug('Starting audio recording', DEBUG_OPTIONS);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          debug.debug('Audio data available, sending for transcription', DEBUG_OPTIONS);
          const formData = new FormData();
          formData.append('audio', event.data);
          formData.append('text', orderText);

          try {
            debug.logApiCall('/api/orders/transcribe', 'POST', { hasAudio: true }, DEBUG_OPTIONS);
            const response = await axios.post('/api/orders/transcribe', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            setOrderText(response.data.text);
            debug.info('Audio transcribed successfully', DEBUG_OPTIONS);
          } catch (error: any) {
            debug.error('Failed to transcribe audio', DEBUG_OPTIONS, error);
            setError('Failed to transcribe audio. Please try again.');
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      debug.info('Recording started', DEBUG_OPTIONS);
    } catch (error: any) {
      debug.error('Failed to access microphone', DEBUG_OPTIONS, error);
      setError('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      debug.debug('Stopping audio recording', DEBUG_OPTIONS);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      debug.info('Recording stopped', DEBUG_OPTIONS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    debug.debug('Attempting to submit order', DEBUG_OPTIONS);

    if (!orderText.trim()) {
      debug.warn('Order text is empty', DEBUG_OPTIONS);
      setError('Please enter an order or use voice recording');
      return;
    }

    if (orderType === 'table' && (!selectedTable || !selectedSeat)) {
      debug.warn('Missing table or seat selection', DEBUG_OPTIONS);
      setError('Please select a table and seat number');
      return;
    }

    if ((orderType === 'room_service' || orderType === 'memory_care') && !roomNumber) {
      debug.warn('Missing room number', DEBUG_OPTIONS);
      setError('Please enter a room number');
      return;
    }

    const orderData: Partial<Order> = {
      text: orderText,
      status: 'pending',
      order_type: orderType,
      table_id: orderType === 'table' ? selectedTable || undefined : undefined,
      seat_number: orderType === 'table' ? selectedSeat || undefined : undefined,
      room_number: (orderType === 'room_service' || orderType === 'memory_care') ? roomNumber : undefined,
    };

    debug.debug('Submitting order with data:', DEBUG_OPTIONS);
    debug.logState(orderData, DEBUG_OPTIONS);
    createOrderMutation.mutate(orderData);
  };

  if (isLoadingTables) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Place Order</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setOrderType('table')}
                className={`p-4 rounded-lg border ${
                  orderType === 'table'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-500'
                }`}
              >
                <HomeIcon className="h-6 w-6 mx-auto mb-2" />
                Table Service
              </button>
              <button
                type="button"
                onClick={() => setOrderType('room_service')}
                className={`p-4 rounded-lg border ${
                  orderType === 'room_service'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-500'
                }`}
              >
                <HomeIcon className="h-6 w-6 mx-auto mb-2" />
                Room Service
              </button>
              <button
                type="button"
                onClick={() => setOrderType('memory_care')}
                className={`p-4 rounded-lg border ${
                  orderType === 'memory_care'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-500'
                }`}
              >
                <HeartIcon className="h-6 w-6 mx-auto mb-2" />
                Memory Care
              </button>
            </div>
          </div>

          {/* Location Selection */}
          {orderType === 'table' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="table" className="block text-sm font-medium text-gray-700 mb-2">
                  Table
                </label>
                <select
                  id="table"
                  value={selectedTable || ''}
                  onChange={(e) => setSelectedTable(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a table</option>
                  {tables?.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.number} ({table.seats} seats)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="seat" className="block text-sm font-medium text-gray-700 mb-2">
                  Seat Number
                </label>
                <input
                  type="number"
                  id="seat"
                  min="1"
                  value={selectedSeat || ''}
                  onChange={(e) => setSelectedSeat(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                Room Number
              </label>
              <input
                type="text"
                id="room"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Order Input */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Order Details
            </label>
            <div className="flex space-x-4">
              <textarea
                id="order"
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                placeholder="Enter your order or use voice recording..."
                required
              />
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-4 rounded-lg ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRecording ? (
                    <StopIcon className="h-6 w-6" />
                  ) : (
                    <MicrophoneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {createOrderMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderInterface; 