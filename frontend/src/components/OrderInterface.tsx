import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import axios from 'axios';
import { debug } from '../utils/debug';
import {
  MicrophoneIcon,
  StopIcon,
  StarIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { HomeIcon, HeartIcon } from '@heroicons/react/24/solid';

interface Order {
  id: string;
  text: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  order_type: 'table' | 'room_service' | 'memory_care';
  table_id?: number;
  seat_number?: number;
  room_number?: string;
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

interface Table {
  id: number;
  number: number;
  seats: number;
}

interface QuickOrderOption {
  id: string;
  details: string;
  frequency: number;
}

interface DailySpecial {
  id: number;
  name: string;
  description: string;
  meal_period: string;
  date: string;
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
  const [quickOrderOptions, setQuickOrderOptions] = useState<QuickOrderOption[]>([]);
  const [identifiedResident, setIdentifiedResident] = useState<Resident | null>(null);
  const [currentMealPeriod, setCurrentMealPeriod] = useState<string>('');
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
      identifiedResident,
      currentMealPeriod,
    }, DEBUG_OPTIONS);
  }, [isRecording, orderText, orderType, selectedTable, selectedSeat, roomNumber, error, identifiedResident, currentMealPeriod]);

  // Get current meal period
  const { data: mealPeriodData, isLoading: isLoadingMealPeriod } = useQuery<string>({
    queryKey: ['meal-period'],
    queryFn: async () => {
      debug.logApiCall('/api/meal-period/current', 'GET', {}, DEBUG_OPTIONS);
      const response = await api.get('/api/meal-period/current');
      debug.info('Meal period fetched successfully', DEBUG_OPTIONS);
      return response.data.name;
    },
    retry: 2,
  });

  // Update currentMealPeriod state when data is fetched
  useEffect(() => {
    if (mealPeriodData) {
      setCurrentMealPeriod(mealPeriodData);
    }
  }, [mealPeriodData]);

  // Fetch tables
  const { data: tables, isLoading: isLoadingTables } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      debug.logApiCall('/api/tables', 'GET', {}, DEBUG_OPTIONS);
      const response = await api.get('/api/tables');
      debug.info('Tables fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
  });

  // Fetch daily special
  const { data: dailySpecial, isLoading: isLoadingSpecial, error: dailySpecialError } = useQuery<DailySpecial>({
    queryKey: ['daily-special', currentMealPeriod],
    queryFn: async () => {
      debug.logApiCall('/api/daily-specials/current', 'GET', {}, DEBUG_OPTIONS);
      const response = await api.get('/api/daily-specials/current');
      debug.info('Daily special fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
    enabled: !!currentMealPeriod
  });

  // Handle daily special error
  useEffect(() => {
    if (dailySpecialError) {
      // It's okay if there's no daily special
      debug.warn('No daily special found', DEBUG_OPTIONS);
    }
  }, [dailySpecialError]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: Partial<Order>) => {
      debug.logApiCall('/api/orders', 'POST', order, DEBUG_OPTIONS);
      const response = await api.post('/api/orders', order);
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

  // Fetch quick order options when table/seat is selected
  useEffect(() => {
    const getQuickOrderOptions = async () => {
      if (selectedTable && selectedSeat && currentMealPeriod) {
        try {
          debug.logApiCall(`/api/quick-orders/table/${selectedTable}/seat/${selectedSeat}?meal_period=${currentMealPeriod}`, 'GET', {}, DEBUG_OPTIONS);
          const response = await api.get(`/api/quick-orders/table/${selectedTable}/seat/${selectedSeat}?meal_period=${currentMealPeriod}`);
          setQuickOrderOptions(response.data.options || []);
          setIdentifiedResident(response.data.resident || null);
          debug.info('Quick order options fetched successfully', DEBUG_OPTIONS);
        } catch (error) {
          debug.warn('Failed to fetch quick order options', DEBUG_OPTIONS);
          setQuickOrderOptions([]);
          setIdentifiedResident(null);
        }
      } else {
        setQuickOrderOptions([]);
        setIdentifiedResident(null);
      }
    };

    getQuickOrderOptions();
  }, [selectedTable, selectedSeat, currentMealPeriod]);

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
            const response = await axios.post('http://localhost:10000/api/orders/transcribe', formData, {
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
      meal_period: currentMealPeriod,
    };

    debug.debug('Submitting order with data:', DEBUG_OPTIONS);
    debug.logState(orderData, DEBUG_OPTIONS);
    createOrderMutation.mutate(orderData);
  };

  const handleQuickOrderSelect = (option: QuickOrderOption) => {
    setOrderText(option.details);
    debug.info(`Selected quick order: ${option.details}`, DEBUG_OPTIONS);
  };

  const handleDailySpecialSelect = () => {
    if (dailySpecial) {
      setOrderText(`Daily Special: ${dailySpecial.name}${dailySpecial.description ? ` - ${dailySpecial.description}` : ''}`);
      debug.info(`Selected daily special: ${dailySpecial.name}`, DEBUG_OPTIONS);
    }
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Place Order</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <span className="text-blue-700 font-medium capitalize">{currentMealPeriod} Service</span>
          </div>
        </div>

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
                      Table {table.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="seat" className="block text-sm font-medium text-gray-700 mb-2">
                  Seat Number
                </label>
                <select
                  id="seat"
                  value={selectedSeat || ''}
                  onChange={(e) => setSelectedSeat(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={!selectedTable}
                >
                  <option value="">Select a seat</option>
                  {selectedTable && tables?.find(t => t.id === selectedTable)?.seats && (
                    Array.from({ length: tables?.find(t => t.id === selectedTable)?.seats || 0 }, (_, i) => i + 1).map(seatNum => (
                      <option key={seatNum} value={seatNum}>
                        Seat {seatNum}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Room Number
              </label>
              <input
                id="roomNumber"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Identified Resident */}
          {identifiedResident && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold">{identifiedResident.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{identifiedResident.name}</h3>
                  {identifiedResident.medical_dietary && identifiedResident.medical_dietary.length > 0 && (
                    <p className="text-sm text-red-600">
                      Dietary Restrictions: {identifiedResident.medical_dietary.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Order Options */}
          {quickOrderOptions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                Quick Order Options
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {quickOrderOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleQuickOrderSelect(option)}
                    className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <p className="font-medium">{option.details}</p>
                    <p className="text-xs text-gray-500">Ordered {option.frequency} times</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Daily Special */}
          {dailySpecial && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SparklesIcon className="h-4 w-4 text-purple-500 mr-1" />
                Today's {currentMealPeriod} Special
              </h3>
              <button
                type="button"
                onClick={handleDailySpecialSelect}
                className="w-full text-left p-3 border border-purple-200 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
              >
                <p className="font-medium text-purple-800">{dailySpecial.name}</p>
                {dailySpecial.description && (
                  <p className="text-sm text-purple-600">{dailySpecial.description}</p>
                )}
              </button>
            </div>
          )}

          {/* Order Input */}
          <div>
            <label htmlFor="orderText" className="block text-sm font-medium text-gray-700 mb-2">
              Order Details
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <textarea
                id="orderText"
                rows={4}
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter order details or use voice recording..."
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <StopIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <MicrophoneIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderInterface; 