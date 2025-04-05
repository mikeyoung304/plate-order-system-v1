import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import api from "../utils/api";
// import axios from 'axios'; // No longer needed? Commenting out.
import Draggable from "react-draggable"; // Restore Draggable import
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
type TableShape = "square" | "rectangle" | "circle" | "round"; // Added 'round'
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
  scale: number; // Keep scale prop for potential future use within DraggableTable itself
  isSelected: boolean;
  seats: Seat[];
  isLoadingSeats: boolean;
  onSeatClick: (seat: Seat) => void;
  isAdminMode: boolean; // Add prop to control draggability
}

// Constants
const DEFAULT_TABLE_SIZE = {
  SQUARE: { width: 100, height: 100 },
  RECTANGLE: { width: 150, height: 100 },
  CIRCLE: { width: 100, height: 100 },
};
// Use more central default coordinates for new tables
const DEFAULT_NEW_TABLE: Partial<Table> = {
  number: 0,
  type: "standard",
  x: 300,
  y: 300,
  status: "available",
  seats: 4,
  shape: "square",
  width: DEFAULT_TABLE_SIZE.SQUARE.width,
  height: DEFAULT_TABLE_SIZE.SQUARE.height,
};
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const ZOOM_STEP = 0.1;
// Correct path to point to backend server serving static files
const RESTAURANT_BACKGROUND =
  "http://localhost:10000/static/img/restaurant-floor.jpg";
const TABLE_TRANSITION = "transition-all duration-500 ease-in-out";

// Utility functions - Enhanced colors for dark theme with glass effect
const getTableColor = (status: Table["status"]) => {
  switch (status) {
    case "available":
      // Use brighter text on darker background with glass effect
      return "bg-green-800 bg-opacity-60 border-green-500 text-green-100 backdrop-blur-sm shadow-lg shadow-green-900/20";
    case "occupied":
      return "bg-red-800 bg-opacity-60 border-red-500 text-red-100 backdrop-blur-sm shadow-lg shadow-red-900/20";
    case "reserved":
      return "bg-yellow-800 bg-opacity-60 border-yellow-500 text-yellow-100 backdrop-blur-sm shadow-lg shadow-yellow-900/20";
    default:
      return "bg-dark-accent border-dark-border text-dark-text-secondary backdrop-blur-sm";
  }
};

const getTableShape = (table: Table) => {
  // Restore function definition
  switch (table.shape) {
    case "circle":
    case "round": // Also treat 'round' as a circle
      return "rounded-full";
    case "rectangle":
      return "rounded-lg";
    default:
      return "rounded-lg";
  }
};

// Components
// Restore DraggableTable component definition
const DraggableTable: React.FC<TableProps> = ({
  // Restore component definition
  table,
  onTableClick,
  onDragStop,
  scale, // Use the scale passed down
  isSelected,
  seats,
  isLoadingSeats,
  onSeatClick,
  isAdminMode, // Destructure isAdminMode
}) => {
  const nodeRef = useRef(null);

  const handleDragStop = (e: any, data: any) => {
    const snappedX = Math.round(data.x / 20) * 20;
    const snappedY = Math.round(data.y / 20) * 20;
    onDragStop(table, snappedX, snappedY);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: table.x, y: table.y }}
      onStop={handleDragStop}
      bounds="parent"
      grid={[20, 20]}
      scale={scale} // Pass the current zoom scale to Draggable
      disabled={!isAdminMode} // Disable dragging if not in admin mode
    >
      <div
        ref={nodeRef}
        onClick={() => onTableClick(table)}
        // Enhanced styling with animations and visual feedback
        className={`absolute p-4 border-2 shadow-lg ${getTableColor(table.status)} ${getTableShape(table)} 
          ${TABLE_TRANSITION} 
          ${isAdminMode ? "cursor-move" : "cursor-pointer"}
          hover:shadow-xl hover:border-opacity-100 hover:scale-105
          ${isSelected ? "ring-4 ring-blue-500 ring-opacity-60 shadow-2xl" : ""}
        `}
        style={{
          width: table.width,
          height: table.height,
          // No internal transform needed if Draggable handles scale
          zIndex: isSelected ? 30 : table.current_orders > 0 ? 20 : 10,
          transform: `${isSelected ? "translateZ(10px)" : ""}`, // 3D effect for selected table
        }}
        role="button"
        aria-label={`Table ${table.number} - ${table.seats} seats - ${table.status}`}
      >
        {/* Restore original text details */}
        <div className="text-center">
          <div className="font-bold">Table {table.number}</div>
          <div className="text-sm opacity-90">{table.seats} seats</div>
          <div className="text-xs capitalize opacity-80">{table.type}</div>
          {table.current_orders > 0 && (
            <div className="text-xs font-semibold text-red-300 animate-pulse mt-1">
              {" "}
              {/* Adjusted pulse color */}
              {table.current_orders} active{" "}
              {table.current_orders === 1 ? "order" : "orders"}
            </div>
          )}
        </div>

        {/* Enhanced seat rendering with animations */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center flex-wrap p-2 bg-black bg-opacity-40 backdrop-blur-sm rounded-lg animate-fade-in">
            {" "}
            {/* Darker overlay with blur */}
            {isLoadingSeats ? (
              <div className="text-xs text-white animate-pulse flex items-center">
                <svg
                  className="animate-spin h-4 w-4 mr-1 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading seats...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full h-full place-items-center">
                {seats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`
                      w-7 h-7 rounded-full m-1 border-2 flex items-center justify-center text-xs font-bold
                      ${
                        seat.status === "occupied"
                          ? "bg-red-500 border-red-300 text-white animate-ping-slow"
                          : "bg-green-500 border-green-300 text-white"
                      }
                      cursor-pointer hover:scale-125 hover:ring-2 hover:ring-blue-400 
                      ring-offset-2 ring-offset-black ring-offset-opacity-30
                      transform transition-all duration-300 ease-in-out
                      shadow-md hover:shadow-lg
                    `}
                    title={`Seat ${seat.seat_number} - ${seat.status}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent table click from firing
                      onSeatClick(seat);
                    }}
                  >
                    {seat.seat_number}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

const DEBUG_OPTIONS = { component: "TableManagement", timestamp: true };

export const TableManagement: React.FC = () => {
  // Restore state and hooks
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTableSeats, setSelectedTableSeats] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isAddingTable, setIsAddingTable] = useState(false); // Renamed state for clarity
  const [newTableData, setNewTableData] =
    useState<Partial<Table>>(DEFAULT_NEW_TABLE); // Renamed state
  const [scale, setScale] = useState(1.0); // Component's scale state for zoom
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Component's position state for pan
  const [isDragging, setIsDragging] = useState(false);
  // Remove displayedTables state - render directly from useQuery data
  const floorPlanRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation(); // Get location
  const isAdminMode = location.pathname === "/admin"; // Check if current path is admin

  // Restore API call for layout
  const {
    data: layout,
    error: layoutError,
    isLoading: isLayoutLoading,
  } = useQuery<TableLayout>({
    // Added isLoading state capture
    queryKey: ["table-layout"],
    queryFn: async () => {
      debug.logApiCall("/api/tables/layout", "GET", {}, DEBUG_OPTIONS);
      const response = await api.get("/api/tables/layout");
      debug.info("Table layout fetched successfully", DEBUG_OPTIONS);
      return response.data;
    },
    retry: 2,
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent flicker
    // Keep previous data while fetching new data in the background (React Query v4/v5 syntax)
    placeholderData: (previousData) => previousData, // Use placeholderData to keep previous data during refetch
  });

  // *** ADDED DEBUG LOG ***
  console.log("[TableManagement] Layout Query State:", {
    isLayoutLoading,
    layoutError,
    layoutData: layout, // Log the actual data received
  });

  // Remove useEffect hooks related to displayedTables

  // --- Mutations ---
  const updateTableMutation = useMutation({
    mutationFn: async (updatedTable: Partial<Table> & { id: number }) => {
      debug.logApiCall(
        `/api/tables/${updatedTable.id}`,
        "PUT",
        updatedTable,
        DEBUG_OPTIONS,
      );
      const response = await api.put(
        `/api/tables/${updatedTable.id}`,
        updatedTable,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-layout"] });
      debug.info(
        "Table updated successfully, invalidated layout query",
        DEBUG_OPTIONS,
      );
    },
    onError: (error) => {
      debug.error("Failed to update table", DEBUG_OPTIONS, error as Error);
      alert("Failed to update table position.");
    },
  });

  // Mutation for creating a table
  const createTableMutation = useMutation({
    mutationFn: async (tableData: Partial<Table>) => {
      // Ensure required fields are present before sending
      const payload = {
        number: parseInt(String(tableData.number), 10) || 0, // Ensure number is integer
        seats: parseInt(String(tableData.seats), 10) || 4, // Ensure seats is integer
        shape: tableData.shape || "square",
        type: tableData.type || "standard",
        x: tableData.x || 50,
        y: tableData.y || 50,
        width:
          tableData.width ||
          DEFAULT_TABLE_SIZE[
            tableData.shape?.toUpperCase() as keyof typeof DEFAULT_TABLE_SIZE
          ]?.width ||
          DEFAULT_TABLE_SIZE.SQUARE.width,
        height:
          tableData.height ||
          DEFAULT_TABLE_SIZE[
            tableData.shape?.toUpperCase() as keyof typeof DEFAULT_TABLE_SIZE
          ]?.height ||
          DEFAULT_TABLE_SIZE.SQUARE.height,
        status: "available",
      };
      debug.logApiCall("/api/tables", "POST", payload, DEBUG_OPTIONS);
      const response = await api.post("/api/tables", payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Add 'data' parameter to log response if needed
      debug.info(
        `Table ${data.number} created successfully in DB, attempting to invalidate layout query...`,
        DEBUG_OPTIONS,
      ); // Log success with table number
      queryClient.invalidateQueries({ queryKey: ["table-layout"] }); // This key matches the useQuery key
      setIsAddingTable(false);
      setNewTableData(DEFAULT_NEW_TABLE);
    },
    onError: (error: any) => {
      debug.error("Failed to create table", DEBUG_OPTIONS, error as Error);
      alert(
        `Failed to create table: ${error.response?.data?.detail || error.message}`,
      );
    },
  });

  // --- Zoom functions ---
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(scale + ZOOM_STEP, MAX_SCALE);
    setScale(newScale);
    debug.debug(`Zoom In - New Scale: ${newScale.toFixed(2)}`, DEBUG_OPTIONS);
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
    setScale(newScale);
    debug.debug(`Zoom Out - New Scale: ${newScale.toFixed(2)}`, DEBUG_OPTIONS);
  }, [scale]);

  const handleResetZoom = useCallback(() => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setSelectedTable(null); // Also deselect table on zoom reset
    setSelectedTableSeats([]);
    debug.debug("Reset Zoom/Pan and Deselect Table", DEBUG_OPTIONS);
  }, []); // Removed setScale, setPosition from dependencies as they cause infinite loops if included

  // --- Pan functions ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Prevent dragging tables when panning the background
      if (
        e.target === floorPlanRef.current ||
        (e.target as HTMLElement).parentElement === floorPlanRef.current
      ) {
        setIsDragging(true);
        dragStartPos.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
        if (floorPlanRef.current) {
          floorPlanRef.current.style.cursor = "grabbing";
        }
        debug.debug(
          `Pan Start - ClientX: ${e.clientX}, ClientY: ${e.clientY}`,
          DEBUG_OPTIONS,
        );
      }
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !floorPlanRef.current) return;
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      setPosition({ x: newX, y: newY });
      // Optional: Add debug log here if needed, but can be noisy
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (floorPlanRef.current) {
        floorPlanRef.current.style.cursor = "grab";
      }
      debug.debug(
        `Pan End - Final Position: { x: ${position.x.toFixed(0)}, y: ${position.y.toFixed(0)} }`,
        DEBUG_OPTIONS,
      );
    }
  }, [isDragging, position]);

  // --- Click handlers ---
  const handleTableClick = async (table: Table) => {
    debug.debug(
      `Table Clicked - ID: ${table.id}, Current Selection: ${selectedTable?.id}`,
      DEBUG_OPTIONS,
    );

    const TARGET_ZOOM_SCALE = 1.75; // How much to zoom in

    if (selectedTable?.id === table.id) {
      // Deselect if clicking the same table again - Reset Zoom/Pan
      handleResetZoom(); // Use the reset function
      debug.debug(
        `Table Deselected & Zoom Reset - ID: ${table.id}`,
        DEBUG_OPTIONS,
      );
    } else {
      // Select the new table
      setSelectedTable(table);
      setIsLoadingSeats(true);
      setSelectedTableSeats([]); // Clear previous seats

      // --- Calculate Zoom & Pan ---
      if (floorPlanRef.current) {
        const container = floorPlanRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Center the table's center point
        const tableCenterX = table.x + table.width / 2;
        const tableCenterY = table.y + table.height / 2;

        const newPosX = containerWidth / 2 - tableCenterX * TARGET_ZOOM_SCALE;
        const newPosY = containerHeight / 2 - tableCenterY * TARGET_ZOOM_SCALE;

        setScale(TARGET_ZOOM_SCALE);
        setPosition({ x: newPosX, y: newPosY });
        debug.debug(
          `Zoomed to table ${table.id}. Scale: ${TARGET_ZOOM_SCALE}, Pos: {${newPosX.toFixed(0)}, ${newPosY.toFixed(0)}}`,
          DEBUG_OPTIONS,
        );
      } else {
        debug.warn(
          "Floor plan ref not available for zoom calculation",
          DEBUG_OPTIONS,
        );
      }
      // --- End Calculate Zoom & Pan ---

      // Fetch seats
      try {
        debug.logApiCall(
          `/api/tables/${table.id}/seats`,
          "GET",
          {},
          DEBUG_OPTIONS,
        );
        const response = await api.get(`/api/tables/${table.id}/seats`);
        setSelectedTableSeats(response.data);
        debug.info(
          `Seats fetched successfully - Table ID: ${table.id}, Count: ${response.data.length}`,
          DEBUG_OPTIONS,
        );
      } catch (error) {
        debug.error(
          `Failed to fetch seats for table ${table.id}`,
          DEBUG_OPTIONS,
          error as Error,
        ); // Keep error call as is
        alert(`Failed to load seats for table ${table.number}.`);
      } finally {
        setIsLoadingSeats(false);
      }
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!selectedTable) return;
    debug.debug(
      `Seat Clicked - Table ID: ${selectedTable.id}, Seat ID: ${seat.id}, Seat #: ${seat.seat_number}`,
      DEBUG_OPTIONS,
    );
    // Navigate to order interface, passing table and seat info
    navigate(`/order/${selectedTable.id}/${seat.id}`);
  };

  // --- Add/Edit/Delete handlers ---
  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure debug call strictly matches signature: debug(message: string, options: DebugOptions)
    const message = `Submitting new table: ${JSON.stringify(newTableData)}`;
    debug.debug(message, DEBUG_OPTIONS);
    // Basic validation
    if (!newTableData.number || newTableData.number <= 0) {
      alert("Please enter a valid table number.");
      return;
    }
    if (!newTableData.seats || newTableData.seats <= 0) {
      alert("Please enter a valid number of seats.");
      return;
    }
    createTableMutation.mutate(newTableData);
  };

  // Placeholder for editing selected table (modal/sidebar)
  const handleEditTable = () => {
    if (!selectedTable) return;
    // Corrected debug call: Pass data within the message string or use logState
    debug.debug(
      `Edit Table Clicked (Not Implemented) - ID: ${selectedTable.id}`,
      DEBUG_OPTIONS,
    );
    // Logic to open an edit modal/sidebar would go here
  };

  // Placeholder for deleting selected table
  const handleDeleteTable = () => {
    if (!selectedTable) return;
    if (
      window.confirm(
        `Are you sure you want to delete Table ${selectedTable.number}?`,
      )
    ) {
      // Corrected debug call
      debug.debug(
        `Delete Table Clicked (Not Implemented) - ID: ${selectedTable.id}`,
        DEBUG_OPTIONS,
      );
      // deleteTableMutation.mutate(selectedTable.id); // Mutation would go here
    }
  };

  // --- Drag handler ---
  const handleDragStop = (table: Table, x: number, y: number) => {
    debug.debug(
      `Table Drag Stop - ID: ${table.id}, New Pos: { x: ${x.toFixed(0)}, y: ${y.toFixed(0)} }`,
      DEBUG_OPTIONS,
    );
    // Update table position via API
    updateTableMutation.mutate({ id: table.id, x, y });
  };

  // Restore basic JSX structure
  return (
    // Use dark theme classes
    // Restore h-full now that parent <main> is flex flex-col
    <div className="flex flex-col h-full bg-dark-primary text-dark-text">
      {/* Header */}
      <div className="bg-dark-secondary shadow-md p-4 mb-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          {isAdminMode ? "Admin: Floor Plan Editor" : "Server View"}
        </h1>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Conditionally render Add/Edit/Delete buttons */}
          {isAdminMode && (
            <>
              <button
                onClick={() => setIsAddingTable(true)} // Use renamed state setter
                className="flex items-center gap-1 bg-dark-button-bg text-white px-3 py-2 rounded hover:bg-dark-button-hover transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Table
              </button>
              {/* Add Edit/Delete buttons - enable when a table is selected */}
              <button
                onClick={handleEditTable}
                disabled={!selectedTable}
                className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Placeholder Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
                Edit Selected
              </button>
              <button
                onClick={handleDeleteTable}
                disabled={!selectedTable}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Placeholder Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Delete Selected
              </button>
            </>
            // Removed extra </button> tag here
          )}
          {/* Zoom controls */}
          <div
            className={`flex items-center space-x-2 ${isAdminMode ? "" : "ml-auto"}`}
          >
            {" "}
            {/* Adjust margin based on mode */}
            <button
              onClick={handleZoomOut}
              disabled={scale <= MIN_SCALE}
              className="text-dark-text-secondary hover:text-blue-400 disabled:text-gray-600"
              aria-label="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="h-6 w-6" />
            </button>
            <span className="text-sm font-medium w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= MAX_SCALE}
              className="text-dark-text-secondary hover:text-blue-400 disabled:text-gray-600"
              aria-label="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="h-6 w-6" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-dark-text-secondary hover:text-blue-400"
              aria-label="Reset zoom"
            >
              <ArrowsPointingOutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area - Let flex-1 handle height expansion */}
      {/* This div now correctly takes height from its flex parent (<main>) */}
      {/* Remove overflow, add border */}
      {/* Remove yellow border */}
      <div className="flex-1 relative bg-dark-accent rounded-lg shadow-inner">
        {/* Floor plan container */}
        <div
          ref={floorPlanRef}
          // Restore original classes, including overflow-hidden
          // Restore h-full, remove border and fixed height style
          className={`relative w-full h-full border-pink-500 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`} // Dynamic cursor, RESTORED h-full
          style={{
            // height: '600px', // REMOVED FIXED HEIGHT
            backgroundImage: `url(${RESTAURANT_BACKGROUND})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            // Restore original classes and transform style for pan/zoom
            className="absolute transition-transform duration-200 ease-in-out" // Restore transition
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, // Restore transform
              transformOrigin: "0 0",
              // Use dimensions from layout data - Ensure layout exists before accessing
              width: layout ? layout.width : 1200, // Default if layout is loading/undefined
              height: layout ? layout.height : 800, // Default if layout is loading/undefined
            }}
          >
            {/* Keep Grid lines */}
            {/* Grid lines with dark theme adjustment */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute border-t border-dark-border border-dashed w-full opacity-20"
                  style={{ top: i * 20 }}
                />
              ))}
              {[...Array(50)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute border-l border-dark-border border-dashed h-full opacity-20"
                  style={{ left: i * 20 }}
                />
              ))}
            </div>

            {/* Render tables - Pass isAdminMode */}
            {/* Render tables directly using layout data and status flags */}
            {(() => {
              // *** ADDED DEBUG LOG ***
              console.log("[TableManagement] Entering render logic block:", {
                layoutExists: !!layout,
                hasTables: !!(layout && layout.tables),
                tableCount: layout?.tables?.length,
              });

              // Use isLoading, isError, and layout data directly
              if (layoutError) {
                // Check for error first
                console.log(
                  "[TableManagement] Render: Displaying Error Message",
                );
                return (
                  <p className="text-red-400 bg-dark-secondary p-4 rounded shadow text-center">
                    Error loading tables. Check connection or backend logs.
                  </p>
                );
              }

              // Use isLayoutLoading for initial load check
              if (isLayoutLoading && !layout) {
                // Check loading state explicitly
                console.log(
                  "[TableManagement] Render: Displaying Loading Message",
                );
                return (
                  <p className="text-dark-text-secondary bg-dark-secondary p-4 rounded shadow text-center">
                    Loading tables...
                  </p>
                );
              }

              // If layout exists and has tables, render them
              if (
                layout &&
                layout.tables &&
                Array.isArray(layout.tables) &&
                layout.tables.length > 0
              ) {
                console.log(
                  `[TableManagement] Render: Mapping ${layout.tables.length} tables...`,
                );
                debug.debug(
                  `Rendering Floor Plan - isAdmin: ${isAdminMode}, Layout Data: (${layout.tables.length} tables)`,
                  DEBUG_OPTIONS,
                );
                return layout.tables.map((table) => {
                  // *** ADDED DEBUG LOG ***
                  console.log(
                    `[TableManagement] Render: Rendering table ID ${table.id}, Number ${table.number}`,
                  );
                  debug.debug(
                    ` --> Rendering Table ${table.number} (ID: ${table.id}) directly from layout data`,
                    DEBUG_OPTIONS,
                  );
                  return (
                    // Added parentheses for clarity
                    <DraggableTable
                      key={table.id}
                      table={table}
                      onTableClick={handleTableClick}
                      onDragStop={handleDragStop}
                      scale={scale} // Pass correct scale state here
                      isSelected={selectedTable?.id === table.id}
                      seats={
                        selectedTable?.id === table.id ? selectedTableSeats : []
                      }
                      isLoadingSeats={
                        selectedTable?.id === table.id && isLoadingSeats
                      }
                      onSeatClick={handleSeatClick}
                      isAdminMode={isAdminMode} // Pass admin mode status
                    />
                  ); // End of return for DraggableTable
                }); // End of map function
              } else {
                // Handles the case where layout exists but layout.tables is empty or not an array
                console.log(
                  '[TableManagement] Render: Displaying "No tables defined" message. Layout:',
                  layout,
                );
                return (
                  <p className="text-dark-text-secondary bg-dark-secondary p-4 rounded shadow text-center">
                    No tables defined in the layout.
                  </p>
                );
              }
            })()}
            {/* Corrected IIFE structure */}
          </div>
        </div>
      </div>

      {/* Add Table Modal */}
      {isAdminMode && isAddingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-dark-secondary p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium mb-4 text-dark-text">
              Add New Table
            </h3>
            {/* Add Table Modal Form - Apply dark theme styles */}
            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              {/* Input field styling */}
              {[
                {
                  id: "tableNumber",
                  label: "Table Number",
                  type: "number",
                  value: newTableData.number || "",
                  key: "number",
                },
                {
                  id: "tableSeats",
                  label: "Seats",
                  type: "number",
                  value: newTableData.seats || "",
                  key: "seats",
                },
              ].map((field) => (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-dark-text-secondary"
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    value={field.value}
                    onChange={(e) =>
                      setNewTableData({
                        ...newTableData,
                        [field.key]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 block w-full rounded-md bg-dark-primary border-dark-border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-dark-text sm:text-sm"
                    required
                  />
                </div>
              ))}
              {/* Select field styling */}
              <div>
                <label
                  htmlFor="tableShape"
                  className="block text-sm font-medium text-dark-text-secondary"
                >
                  Shape
                </label>
                <select
                  id="tableShape"
                  value={newTableData.shape || "square"}
                  onChange={(e) =>
                    setNewTableData({
                      ...newTableData,
                      shape: e.target.value as TableShape,
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-dark-primary border-dark-border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-dark-text sm:text-sm"
                >
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="circle">Circle</option>
                </select>
              </div>
              {/* Add inputs for type, width, height if needed */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingTable(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-dark-text-secondary bg-dark-accent hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTableMutation.isPending} // Use isPending instead of isLoading
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-dark-button-bg hover:bg-dark-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-blue-500 disabled:opacity-50"
                >
                  {createTableMutation.isPending ? "Adding..." : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Placeholder for Edit Table Modal/Sidebar */}
      {/* {isAdminMode && selectedTable && isEditingTable && ( ... )} */}
    </div>
  );
};

export default TableManagement;
