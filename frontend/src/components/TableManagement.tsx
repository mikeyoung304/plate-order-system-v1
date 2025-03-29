import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Draggable from 'react-draggable';
import { debug } from '../utils/debug';
import {
  PlusIcon,
  Square2StackIcon,
  RectangleStackIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

// Types
interface Table {
  id: number;
  number: number;
  type: string;
  x: number;
  y: number;
  status: TableStatus;
  current_orders: number;
  seats: number;
  shape: TableShape;
  width: number;
  height: number;
}

type TableStatus = 'available' | 'occupied' | 'reserved';
type TableShape = 'square' | 'rectangle' | 'circle';
type TableType = 'standard' | 'booth' | 'high-top' | 'outdoor';

interface TableLayout {
  width: number;
  height: number;
  tables: Table[];
}

interface TableProps {
  table: Table;
  onTableClick: (table: Table) => void;
  onDragStop: (table: Table, x: number, y: number) => void;
}

// Constants
const DEFAULT_TABLE_SIZE = {
  SQUARE: { width: 100, height: 100 },
  RECTANGLE: { width: 150, height: 100 },
  CIRCLE: { width: 100, height: 100 },
};

const DEFAULT_NEW_TABLE: Partial<Table> = {
  number: 0,
  type: 'standard',
  x: 50,
  y: 50,
  status: 'available',
  seats: 4,
  shape: 'square',
  width: DEFAULT_TABLE_SIZE.SQUARE.width,
  height: DEFAULT_TABLE_SIZE.SQUARE.height,
};

const TABLE_TYPES: TableType[] = ['standard', 'booth', 'high-top', 'outdoor'];

// Components
const TableShapeButton: React.FC<{
  shape: TableShape;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ shape, selected, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-lg border ${
      selected
        ? 'border-blue-500 bg-blue-50 text-blue-700'
        : 'border-gray-200 hover:border-blue-500'
    }`}
    aria-label={`Select ${label} shape`}
    aria-pressed={selected}
  >
    {icon}
    <span className="block mt-2">{label}</span>
  </button>
);

const DraggableTable: React.FC<TableProps> = ({ table, onTableClick, onDragStop }) => {
  const nodeRef = useRef(null);
  
  const statusStyles = {
    available: 'bg-green-100 border-green-500',
    occupied: 'bg-red-100 border-red-500',
    reserved: 'bg-yellow-100 border-yellow-500',
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: table.x, y: table.y }}
      onStop={(e, data) => onDragStop(table, data.x, data.y)}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        onClick={() => onTableClick(table)}
        className={`absolute cursor-move p-4 rounded-lg border-2 ${statusStyles[table.status]}`}
        style={{
          width: table.width,
          height: table.height,
          borderRadius: table.shape === 'circle' ? '50%' : undefined,
        }}
        role="button"
        aria-label={`Table ${table.number} - ${table.seats} seats - ${table.status}`}
      >
        <div className="text-center">
          <div className="font-bold">Table {table.number}</div>
          <div className="text-sm">{table.seats} seats</div>
          <div className="text-xs capitalize">{table.type}</div>
          {table.current_orders > 0 && (
            <div className="text-xs text-gray-600">
              {table.current_orders} active {table.current_orders === 1 ? 'order' : 'orders'}
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

const DEBUG_OPTIONS = { component: 'TableManagement', timestamp: true };

export const TableManagement: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTable, setNewTable] = useState<Partial<Table>>(DEFAULT_NEW_TABLE);
  const queryClient = useQueryClient();

  // Debug state changes
  useEffect(() => {
    debug.logState({ selectedTable, isAdding, newTable }, DEBUG_OPTIONS);
  }, [selectedTable, isAdding, newTable]);

  // Fetch table layout
  const { data: layout, error: layoutError } = useQuery<TableLayout>({
    queryKey: ['table-layout'],
    queryFn: async () => {
      debug.logApiCall('/api/tables/layout', 'GET', {}, DEBUG_OPTIONS);
      const response = await axios.get('/api/tables/layout');
      debug.info('Table layout fetched successfully', DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
  });

  // Handle layout error
  useEffect(() => {
    if (layoutError) {
      debug.error('Failed to fetch table layout', DEBUG_OPTIONS, layoutError as Error);
      alert('Failed to load table layout. Please refresh the page.');
    }
  }, [layoutError]);

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (table: Partial<Table>) => {
      debug.logApiCall('/api/tables', 'POST', table, DEBUG_OPTIONS);
      const response = await axios.post('/api/tables', table);
      debug.info('Table created successfully', DEBUG_OPTIONS);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-layout'] });
      setIsAdding(false);
      setNewTable(DEFAULT_NEW_TABLE);
      debug.info('Table creation completed', DEBUG_OPTIONS);
    },
    onError: (error: any) => {
      debug.error('Failed to create table', DEBUG_OPTIONS, error);
      alert(error.response?.data?.message || 'Failed to create table. Please try again.');
    },
  });

  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async (table: Table) => {
      debug.logApiCall(`/api/tables/${table.id}`, 'PUT', table, DEBUG_OPTIONS);
      const response = await axios.put(`/api/tables/${table.id}`, table);
      debug.info('Table updated successfully', DEBUG_OPTIONS);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-layout'] });
      setSelectedTable(null);
      debug.info('Table update completed', DEBUG_OPTIONS);
    },
    onError: (error: any) => {
      debug.error('Failed to update table', DEBUG_OPTIONS, error);
      alert(error.response?.data?.message || 'Failed to update table. Please try again.');
    },
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: number) => {
      debug.logApiCall(`/api/tables/${tableId}`, 'DELETE', {}, DEBUG_OPTIONS);
      await axios.delete(`/api/tables/${tableId}`);
      debug.info('Table deleted successfully', DEBUG_OPTIONS);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-layout'] });
      setSelectedTable(null);
      debug.info('Table deletion completed', DEBUG_OPTIONS);
    },
    onError: (error: any) => {
      debug.error('Failed to delete table', DEBUG_OPTIONS, error);
      alert(error.response?.data?.message || 'Failed to delete table. Please try again.');
    },
  });

  const handleTableClick = (table: Table) => {
    debug.debug(`Table ${table.id} clicked`, DEBUG_OPTIONS);
    setSelectedTable(table);
  };

  const handleSaveTable = () => {
    if (selectedTable) {
      debug.debug(`Saving changes for table ${selectedTable.id}`, DEBUG_OPTIONS);
      updateTableMutation.mutate(selectedTable);
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    debug.debug('Attempting to add new table', DEBUG_OPTIONS);
    
    if (!newTable.number || !newTable.seats || !newTable.shape) {
      debug.warn('Missing required fields for new table', DEBUG_OPTIONS);
      alert('Please fill in all required fields');
      return;
    }

    // Add default position if not set
    const tableToCreate = {
      ...newTable,
      x: newTable.x || 50,
      y: newTable.y || 50,
      width: newTable.shape === 'rectangle' ? DEFAULT_TABLE_SIZE.RECTANGLE.width : DEFAULT_TABLE_SIZE.SQUARE.width,
      height: newTable.shape === 'rectangle' ? DEFAULT_TABLE_SIZE.RECTANGLE.height : DEFAULT_TABLE_SIZE.SQUARE.height,
    };
    
    debug.debug('Creating new table with data:', DEBUG_OPTIONS);
    debug.logState(tableToCreate, DEBUG_OPTIONS);
    createTableMutation.mutate(tableToCreate);
  };

  const handleDeleteTable = () => {
    if (selectedTable) {
      debug.debug(`Attempting to delete table ${selectedTable.id}`, DEBUG_OPTIONS);
      if (window.confirm('Are you sure you want to delete this table?')) {
        deleteTableMutation.mutate(selectedTable.id);
      }
    }
  };

  const handleDragStop = (table: Table, x: number, y: number) => {
    debug.debug(`Table ${table.id} dragged to position (${x}, ${y})`, DEBUG_OPTIONS);
    updateTableMutation.mutate({
      ...table,
      x: Math.round(x),
      y: Math.round(y),
    });
  };

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableShape = (table: Table) => {
    switch (table.shape) {
      case 'circle':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded-lg';
      default:
        return 'rounded-lg';
    }
  };

  if (layoutError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-medium">Error Loading Table Layout</h2>
        <p className="text-red-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Layout */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Table Layout</h2>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Table
          </button>
        </div>

        <div className="relative border rounded-lg p-4" style={{ width: 800, height: 600 }}>
          {layout?.tables?.map((table: Table) => (
            <DraggableTable
              key={table.id}
              table={table}
              onTableClick={handleTableClick}
              onDragStop={handleDragStop}
            />
          ))}
        </div>
      </div>

      {/* Add Table Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Table</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700">
                  Table Number
                </label>
                <input
                  type="number"
                  id="tableNumber"
                  required
                  min="1"
                  value={newTable.number || ''}
                  onChange={(e) => setNewTable({ ...newTable, number: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                  Number of Seats
                </label>
                <input
                  type="number"
                  id="seats"
                  required
                  min="1"
                  value={newTable.seats || ''}
                  onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="shape" className="block text-sm font-medium text-gray-700">
                  Table Shape
                </label>
                <select
                  id="shape"
                  required
                  value={newTable.shape}
                  onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as Table['shape'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a shape</option>
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="circle">Circle</option>
                </select>
              </div>

              <div>
                <label htmlFor="table-type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  id="table-type"
                  required
                  value={newTable.type}
                  onChange={(e) =>
                    setNewTable({ ...newTable, type: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="booth">Booth</option>
                  <option value="high-top">High Top</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  disabled={createTableMutation.isPending}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTableMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {createTableMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Add Table'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Table {selectedTable.number} Details
              </h3>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={selectedTable.status}
                  onChange={(e) =>
                    setSelectedTable({
                      ...selectedTable,
                      status: e.target.value as Table['status'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shape
                </label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setSelectedTable({ ...selectedTable, shape: 'square' })}
                    className={`p-4 rounded-lg border ${
                      selectedTable.shape === 'square'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <Square2StackIcon className="h-6 w-6 mx-auto mb-2" />
                    Square
                  </button>
                  <button
                    onClick={() => setSelectedTable({ ...selectedTable, shape: 'rectangle' })}
                    className={`p-4 rounded-lg border ${
                      selectedTable.shape === 'rectangle'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <RectangleStackIcon className="h-6 w-6 mx-auto mb-2" />
                    Rectangle
                  </button>
                  <button
                    onClick={() => setSelectedTable({ ...selectedTable, shape: 'circle' })}
                    className={`p-4 rounded-lg border ${
                      selectedTable.shape === 'circle'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}
                  >
                    <CircleStackIcon className="h-6 w-6 mx-auto mb-2" />
                    Circle
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  id="edit-type"
                  value={selectedTable.type}
                  onChange={(e) =>
                    setSelectedTable({
                      ...selectedTable,
                      type: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="booth">Booth</option>
                  <option value="high-top">High Top</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-seats" className="block text-sm font-medium text-gray-700">
                  Number of Seats
                </label>
                <input
                  id="edit-seats"
                  type="number"
                  value={selectedTable.seats}
                  onChange={(e) =>
                    setSelectedTable({
                      ...selectedTable,
                      seats: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteTable}
                  className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete Table
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTable}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement; 