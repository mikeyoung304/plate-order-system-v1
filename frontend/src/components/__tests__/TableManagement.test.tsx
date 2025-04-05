import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import axios from "axios"; // Keep for now, might be needed by other parts if uncommented later
import Draggable from "react-draggable";
import { debug } from "../utils/debug";
import {
  PlusIcon,
  Square2StackIcon,
  RectangleStackIcon,
  CircleStackIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon, // Keep unused icons for now
} from "@heroicons/react/24/outline";

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
type TableStatus = "available" | "occupied" | "reserved";
type TableShape = "square" | "rectangle" | "circle";
interface Seat {
  id: number;
  seat_number: number;
  status: "available" | "occupied";
}
interface TableLayout {
  width: number;
  height: number;
  tables: Table[];
}
interface TableProps {
  table: Table;
  onTableClick: (table: Table) => void;
  onDragStop: (table: Table, x: number, y: number) => void;
  scale: number;
  isSelected: boolean;
  seats: Seat[];
  isLoadingSeats: boolean;
  onSeatClick: (seat: Seat) => void;
}

// Constants
const DEFAULT_TABLE_SIZE = {
  SQUARE: { width: 100, height: 100 },
  RECTANGLE: { width: 150, height: 100 },
  CIRCLE: { width: 100, height: 100 },
};
const DEFAULT_NEW_TABLE: Partial<Table> = {
  number: 0,
  type: "standard",
  x: 50,
  y: 50,
  status: "available",
  seats: 4,
  shape: "square",
  width: DEFAULT_TABLE_SIZE.SQUARE.width,
  height: DEFAULT_TABLE_SIZE.SQUARE.height,
};
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const ZOOM_STEP = 0.1;
const RESTAURANT_BACKGROUND = "/static/img/restaurant-floor.jpg"; // Points to backend static dir

// Utility functions (Keep commented out for now to ensure they aren't the issue)
/*
const getTableColor = (status: Table['status']) => { ... };
const getTableShape = (table: Table) => { ... };
*/

// Components (Keep commented out for now)
/*
const DraggableTable: React.FC<TableProps> = ({ ... }) => { ... };
*/

const DEBUG_OPTIONS = { component: "TableManagement", timestamp: true };

export const TableManagement: React.FC = () => {
  // Restore state and hooks
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTableSeats, setSelectedTableSeats] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTable, setNewTable] = useState<Partial<Table>>(DEFAULT_NEW_TABLE);
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const floorPlanRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Keep API calls and complex logic commented out
  const layout = null; // Placeholder
  const layoutError = null; // Placeholder

  // Zoom functions (Keep definitions commented out)
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  }, []);
  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  }, []);
  const handleResetZoom = useCallback(() => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
  }, []);
  // Pan functions (Keep definitions commented out)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      /* ... */
    },
    [position],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      /* ... */
    },
    [isDragging],
  );
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  // Click handlers (Keep definitions commented out)
  const handleTableClick = async (table: Table) => {
    /* ... */
  };
  const handleSeatClick = (seat: Seat) => {
    /* ... */
  };
  const handleSaveTable = () => {
    /* ... */
  };
  const handleAddTable = (e: React.FormEvent) => {
    /* ... */
  };
  const handleDeleteTable = () => {
    /* ... */
  };
  const handleDragStop = (table: Table, x: number, y: number) => {
    /* ... */
  };

  // Restore basic JSX structure
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white shadow-md p-4 mb-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Floor Plan Management</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Table
          </button>
          {/* Zoom controls */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              className="text-gray-700 hover:text-blue-600 disabled:text-gray-400"
              aria-label="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="h-6 w-6" />
            </button>
            <span className="text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              className="text-gray-700 hover:text-blue-600 disabled:text-gray-400"
              aria-label="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="h-6 w-6" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-gray-700 hover:text-blue-600"
              aria-label="Reset zoom"
            >
              <ArrowsPointingOutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Floor plan container */}
        <div
          ref={floorPlanRef}
          className="relative w-full h-full overflow-hidden cursor-grab"
          style={{
            backgroundImage: `url(${RESTAURANT_BACKGROUND})`, // Keep background image
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute transition-transform duration-200 ease-in-out"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              width: layout?.width || 1000, // Use placeholder/default size
              height: layout?.height || 800,
            }}
          >
            {/* Keep Grid lines */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute border-t border-gray-200 border-dashed w-full opacity-30"
                  style={{ top: i * 20 }}
                />
              ))}
              {[...Array(50)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute border-l border-gray-200 border-dashed h-full opacity-30"
                  style={{ left: i * 20 }}
                />
              ))}
            </div>

            {/* Table rendering logic remains commented out */}
            {/* {layout?.tables.map(table => { ... })} */}
            <p
              style={{
                color: "white",
                background: "rgba(0,0,0,0.5)",
                padding: "10px",
              }}
            >
              Table rendering logic commented out.
            </p>
          </div>
        </div>
      </div>

      {/* Modals/Sidebars remain commented out */}
      {/* {selectedTable && ( ... )} */}
      {/* {isAdding && ( ... )} */}
    </div>
  );
};

export default TableManagement;
