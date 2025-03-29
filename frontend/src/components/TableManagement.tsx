import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface Table {
  id: number;
  number: number;
  type: string;
  x: number;
  y: number;
  status: 'available' | 'occupied' | 'reserved';
  current_orders: number;
}

interface TableLayout {
  width: number;
  height: number;
  tables: Table[];
}

export const TableManagement: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch table layout
  const { data: layout } = useQuery<TableLayout>({
    queryKey: ['table-layout'],
    queryFn: async () => {
      const response = await axios.get('/api/tables/layout');
      return response.data;
    },
  });

  // Update table mutation
  const updateTableMutation = useMutation({
    mutationFn: async (table: Table) => {
      const response = await axios.put(`/api/tables/${table.id}`, table);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-layout'] });
      setIsEditing(false);
      setSelectedTable(null);
    },
  });

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsEditing(true);
  };

  const handleSaveTable = () => {
    if (selectedTable) {
      updateTableMutation.mutate(selectedTable);
    }
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

  return (
    <div className="space-y-6">
      {/* Table Layout */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Table Layout</h2>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Table
          </button>
        </div>

        <div
          className="relative border rounded-lg p-4"
          style={{
            width: `${layout?.width || 800}px`,
            height: `${layout?.height || 600}px`,
          }}
        >
          {layout?.tables.map((table) => (
            <div
              key={table.id}
              className={`absolute cursor-pointer rounded-lg p-2 flex items-center justify-center ${
                getTableColor(table.status)
              }`}
              style={{
                left: `${table.x}px`,
                top: `${table.y}px`,
                width: '100px',
                height: '100px',
              }}
              onClick={() => handleTableClick(table)}
            >
              <div className="text-center">
                <p className="font-semibold">Table {table.number}</p>
                <p className="text-sm">{table.type}</p>
                {table.current_orders > 0 && (
                  <p className="text-sm">
                    {table.current_orders} {table.current_orders === 1 ? 'order' : 'orders'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Table {selectedTable.number} Details
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTable(null);
                }}
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
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
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
                  Type
                </label>
                <input
                  type="text"
                  value={selectedTable.type}
                  onChange={(e) =>
                    setSelectedTable({
                      ...selectedTable,
                      type: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedTable(null);
                  }}
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