"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react" // Added useMemo
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Trash2,
  Save,
  Move,
  CircleIcon,
  Square,
  RectangleHorizontal,
  Grid,
  Undo2,
  Redo2,
  Copy,
  Layers,
  ChevronRight,
  Settings,
  Info,
  Loader2, // Added Loader icon
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Helper constant for minimum size
const MIN_SIZE = 20;

// Frontend Table Type
type Table = {
  id: string // Frontend uses string ID (can be temp like `table-${timestamp}` or backend ID like `backend-${intId}`)
  type: "circle" | "rectangle" | "square"
  x: number
  y: number
  width: number
  height: number
  seats: number
  label: string
  rotation?: number
  status?: "available" | "occupied" | "reserved" // Match frontend needs, map from backend status if needed
  zIndex?: number
}

// Backend Table Type (based on schemas.py) - for mapping
type BackendTable = {
    id: number; // Backend uses integer ID
    name: string;
    shape: "circle" | "rectangle" | "square";
    width: number;
    height: number;
    position_x: number;
    position_y: number;
    rotation: number;
    seat_count: number;
    zone?: string | null;
    status: "available" | "reserved" | "out_of_service"; // Backend statuses
    floor_plan_id: string;
};

// Backend Payloads (based on schemas.py)
type TableCreatePayload = {
    name: string;
    shape: "circle" | "rectangle" | "square";
    width: number;
    height: number;
    position_x: number;
    position_y: number;
    rotation: number;
    seat_count: number;
    zone?: string | null;
    status: "available" | "reserved" | "out_of_service";
    floor_plan_id: string;
};

type TableUpdatePayload = {
    name?: string;
    shape?: "circle" | "rectangle" | "square";
    width?: number;
    height?: number;
    position_x?: number;
    position_y?: number;
    rotation?: number;
    seat_count?: number;
    zone?: string | null;
    status?: "available" | "reserved" | "out_of_service";
};


type FloorPlanEditorProps = {
  floorPlanId: string
}

export function FloorPlanEditor({ floorPlanId }: FloorPlanEditorProps) {
  // State for tables and UI
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [newTableType, setNewTableType] = useState<"circle" | "rectangle" | "square">("circle")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [isGridVisible, setIsGridVisible] = useState(true)
  const [gridSize, setGridSize] = useState(50)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [isControlsPanelOpen, setIsControlsPanelOpen] = useState(true)
  const [isTablesPanelOpen, setIsTablesPanelOpen] = useState(true)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 }) // Stores canvas coordinates at resize start
  const [isRotating, setIsRotating] = useState(false)
  const [rotateStart, setRotateStart] = useState(0) // Stores angle in RADIANS at rotation start
  const [initialRotation, setInitialRotation] = useState(0); // Stores initial table rotation in DEGREES on rotate start
  const [undoStack, setUndoStack] = useState<Table[][]>([])
  const [redoStack, setRedoStack] = useState<Table[][]>([])
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 }) // Stores screen coordinates at pan start
  const [showTooltips, setShowTooltips] = useState(true)
  const [showTableLabels, setShowTableLabels] = useState(true)
  const [showTableSeats, setShowTableSeats] = useState(true)
  const [showTableDimensions, setShowTableDimensions] = useState(false)
  const [showTableStatus, setShowTableStatus] = useState(true)
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [isSaving, setIsSaving] = useState(false); // Added saving state

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Logger for debugging
  const logger = useMemo(() => ({
      info: (message: string, ...args: any[]) => console.log(`[FloorPlanEditor] ${message}`, ...args),
      error: (message: string, ...args: any[]) => console.error(`[FloorPlanEditor] ${message}`, ...args),
      warning: (message: string, ...args: any[]) => console.warn(`[FloorPlanEditor] ${message}`, ...args),
  }), []);

  // Helper function to create a default table
  const createDefaultTable = (): Table => ({
    id: `table-${Date.now()}`, // Temporary ID
    type: "circle",
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    seats: 4,
    label: "Table 1",
    rotation: 0,
    status: "available",
    zIndex: 1,
  });

  // Helper function to map backend table status to frontend status
  const mapBackendStatusToFrontend = (backendStatus: BackendTable['status']): Table['status'] => {
      switch (backendStatus) {
          case "available": return "available";
          case "reserved": return "reserved";
          case "out_of_service": return "reserved"; // Map OOS to reserved for now
          // Add mapping for 'occupied' if backend adds it
          default: return "available";
      }
  };

  // Helper function to map frontend table status to backend status
  const mapFrontendStatusToBackend = (frontendStatus: Table['status']): BackendTable['status'] => {
      switch (frontendStatus) {
          case "available": return "available";
          case "reserved": return "reserved";
          case "occupied": return "reserved"; // Map occupied to reserved for backend (adjust if backend adds 'occupied')
          default: return "available";
      }
  };


  // Helper function to map backend table structure to frontend
  const mapBackendTableToFrontend = (backendTable: BackendTable): Table => {
    return {
      id: `backend-${backendTable.id}`, // Prefix backend IDs to distinguish them
      type: backendTable.shape,
      x: backendTable.position_x,
      y: backendTable.position_y,
      width: backendTable.width,
      height: backendTable.height,
      seats: backendTable.seat_count,
      label: backendTable.name,
      rotation: backendTable.rotation || 0,
      status: mapBackendStatusToFrontend(backendTable.status),
      zIndex: 1, // zIndex might need to be fetched or managed differently
    };
  };

  // Helper function to map frontend table to backend CREATE payload
  const mapFrontendTableToCreatePayload = (table: Table): TableCreatePayload => ({
      name: table.label,
      shape: table.type,
      width: table.width,
      height: table.height,
      position_x: table.x,
      position_y: table.y,
      rotation: table.rotation || 0,
      seat_count: table.seats,
      status: mapFrontendStatusToBackend(table.status),
      floor_plan_id: floorPlanId, // Add floor plan ID
      // zone: table.zone, // Add zone if implemented
  });

  // Helper function to map frontend table changes to backend UPDATE payload
  const mapFrontendTableToUpdatePayload = (frontendTable: Table, backendTable: BackendTable): TableUpdatePayload | null => {
      const payload: TableUpdatePayload = {};
      let hasChanges = false;

      // Compare relevant fields and add to payload if changed
      // Use Math.round for positions/dimensions to avoid tiny floating point differences triggering updates
      if (frontendTable.label !== backendTable.name) { payload.name = frontendTable.label; hasChanges = true; }
      if (frontendTable.type !== backendTable.shape) { payload.shape = frontendTable.type; hasChanges = true; }
      if (Math.round(frontendTable.width) !== Math.round(backendTable.width)) { payload.width = frontendTable.width; hasChanges = true; }
      if (Math.round(frontendTable.height) !== Math.round(backendTable.height)) { payload.height = frontendTable.height; hasChanges = true; }
      if (Math.round(frontendTable.x) !== Math.round(backendTable.position_x)) { payload.position_x = frontendTable.x; hasChanges = true; }
      if (Math.round(frontendTable.y) !== Math.round(backendTable.position_y)) { payload.position_y = frontendTable.y; hasChanges = true; }
      if (Math.round(frontendTable.rotation || 0) !== Math.round(backendTable.rotation || 0)) { payload.rotation = frontendTable.rotation || 0; hasChanges = true; }
      if (frontendTable.seats !== backendTable.seat_count) { payload.seat_count = frontendTable.seats; hasChanges = true; }
      const backendMappedStatus = mapFrontendStatusToBackend(frontendTable.status);
      if (backendMappedStatus !== backendTable.status) { payload.status = backendMappedStatus; hasChanges = true; }
      // Add zone comparison if implemented: if (frontendTable.zone !== backendTable.zone) { payload.zone = frontendTable.zone; hasChanges = true; }

      return hasChanges ? payload : null;
  };


  // Load initial tables from API
  const loadTablesFromAPI = useMemo(() => async (shouldInitializeUndo = false) => {
    if (!floorPlanId) {
        logger.warning("floorPlanId is missing, cannot load tables.");
        const defaultTable = createDefaultTable();
        setTables([defaultTable]);
        if (shouldInitializeUndo) setUndoStack([[defaultTable]]);
        setIsLoading(false);
        return;
    }

    logger.info(`Loading tables for floor plan ID: ${floorPlanId}`);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`);
      if (!response.ok) {
        if (response.status === 404) {
            logger.warning(`Floor plan ${floorPlanId} not found on backend.`);
             const defaultTable = createDefaultTable();
             setTables([defaultTable]);
             if (shouldInitializeUndo) setUndoStack([[defaultTable]]);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
          const backendTables: BackendTable[] = await response.json();
          if (backendTables && backendTables.length > 0) {
            const frontendTables = backendTables.map(mapBackendTableToFrontend);
            logger.info(`Loaded ${frontendTables.length} tables from API.`);
            setTables(frontendTables);
            if (shouldInitializeUndo) setUndoStack([frontendTables]); // Initialize undo stack only on initial load
          } else {
            logger.info("No tables found for this floor plan ID, using empty state.");
            setTables([]);
            if (shouldInitializeUndo) setUndoStack([[]]);
          }
      }
    } catch (error) {
      logger.error("Error loading tables from API:", error);
      toast({
        title: "Error Loading Floor Plan",
        description: "Could not load tables from the server. Please try again later.",
        variant: "destructive",
      });
      // Fallback to empty state on error
      setTables([]);
      if (shouldInitializeUndo) setUndoStack([[]]);
    } finally {
        setIsLoading(false);
    }
  }, [floorPlanId, logger, toast]); // Recalculate only when floorPlanId changes

  useEffect(() => {
    loadTablesFromAPI(true); // Pass true to initialize undo stack on initial load
  }, [loadTablesFromAPI]); // Run the memoized function


  // Adjust canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(1200, containerRef.current.clientWidth - 20)
        setCanvasSize({
          width,
          height: width * 0.75, // 4:3 aspect ratio
        })
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
    }
  }, [])

    // Save tables to localStorage whenever they change (Will be replaced by API call)
    // useEffect(() => {
    //   // Temporarily disabled until API integration
    // }, [tables, floorPlanId, logger, undoStack]);

  // Calculate seat positions around a table
  const calculateSeatPositions = (
    type: string,
    x: number,
    y: number,
    width: number,
    height: number,
    seats: number,
  ): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = []
    const seatOffset = 15 / zoomLevel // Distance from table edge

    if (type === "circle") {
      const radius = width / 2 + seatOffset
      const centerX = x + width / 2
      const centerY = y + height / 2
      for (let i = 0; i < seats; i++) {
        const angle = (i / seats) * 2 * Math.PI
        positions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        })
      }
    } else {
      // Rectangle or Square
      const perimeter = 2 * (width + height)
      if (seats <= 0) return []; // Avoid division by zero
      const spacing = perimeter / seats
      let currentDistance = spacing / 2 // Start half spacing in

      for (let i = 0; i < seats; i++) {
        let posX = 0
        let posY = 0

        if (currentDistance <= width) { // Top edge
          posX = x + currentDistance
          posY = y - seatOffset
        } else if (currentDistance <= width + height) { // Right edge
          posX = x + width + seatOffset
          posY = y + (currentDistance - width)
        } else if (currentDistance <= 2 * width + height) { // Bottom edge
          posX = x + width - (currentDistance - width - height)
          posY = y + height + seatOffset
        } else { // Left edge
          posX = x - seatOffset
          posY = y + height - (currentDistance - 2 * width - height)
        }
        positions.push({ x: posX, y: posY })
        currentDistance += spacing
      }
    }
    return positions
  }


  // Draw the floor plan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoomLevel, zoomLevel)

    // Draw grid
    if (isGridVisible) {
      ctx.beginPath()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1 / zoomLevel

      // Calculate grid bounds based on viewport
      const viewLeft = -panOffset.x / zoomLevel;
      const viewTop = -panOffset.y / zoomLevel;
      const viewRight = (canvasSize.width - panOffset.x) / zoomLevel;
      const viewBottom = (canvasSize.height - panOffset.y) / zoomLevel;

      const startX = Math.floor(viewLeft / gridSize) * gridSize;
      const startY = Math.floor(viewTop / gridSize) * gridSize;
      const endX = Math.ceil(viewRight / gridSize) * gridSize;
      const endY = Math.ceil(viewBottom / gridSize) * gridSize;


      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, viewTop)
        ctx.lineTo(x, viewBottom)
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(viewLeft, y)
        ctx.lineTo(viewRight, y)
      }
      ctx.stroke()
    }


    // Sort tables by zIndex for correct layering
    const sortedTables = [...tables].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Draw each table
    sortedTables.forEach((table) => {
      ctx.save();
      const rotation = (table.rotation || 0) * (Math.PI / 180);
      const centerX = table.x + table.width / 2;
      const centerY = table.y + table.height / 2;

      // Translate and rotate context
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      ctx.translate(-centerX, -centerY);

      // Set styles based on selection/hover/status
      const isSelected = selectedTable?.id === table.id;
      const isHovered = hoveredTable === table.id;
      ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.5)" : isHovered ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)";
      ctx.strokeStyle = isSelected ? "#3B82F6" : isHovered ? "#ffffff" : "#6b7280";
      ctx.lineWidth = isSelected ? 3 / zoomLevel : 1.5 / zoomLevel;

      // Draw table shape
      ctx.beginPath();
      if (table.type === "circle") {
        ctx.arc(centerX, centerY, table.width / 2, 0, 2 * Math.PI);
      } else { // Rectangle or Square
        ctx.rect(table.x, table.y, table.width, table.height);
      }
      ctx.fill();
      ctx.stroke();

      // Draw seats if enabled
      if (showTableSeats) {
        const seatPositions = calculateSeatPositions(table.type, table.x, table.y, table.width, table.height, table.seats);
        ctx.fillStyle = "#cbd5e1";
        const seatRadius = 5 / zoomLevel;
        seatPositions.forEach(pos => {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, seatRadius, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Draw label if enabled
      if (showTableLabels) {
        ctx.fillStyle = "#e5e7eb";
        ctx.font = `${14 / zoomLevel}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(table.label, centerX, centerY);
      }

      // Draw dimensions if enabled
      if (showTableDimensions) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = `${10 / zoomLevel}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${Math.round(table.width)}x${Math.round(table.height)}`, centerX, table.y - 5 / zoomLevel);
      }

      // Draw status indicator if enabled
      if (showTableStatus && table.status) {
          let statusColor = "#6b7280"; // Default gray
          if (table.status === "available") statusColor = "#10B981"; // Emerald
          else if (table.status === "occupied") statusColor = "#EF4444"; // Red
          else if (table.status === "reserved") statusColor = "#F59E0B"; // Amber

          ctx.fillStyle = statusColor;
          ctx.beginPath();
          // Position indicator inside top-right corner
          ctx.arc(table.x + table.width - 8 / zoomLevel, table.y + 8 / zoomLevel, 5 / zoomLevel, 0, 2 * Math.PI);
          ctx.fill();
      }


      ctx.restore(); // Restore context rotation/translation
    });


    // Draw selection handles/rotation handle if a table is selected
    if (selectedTable) {
      const table = tables.find(t => t.id === selectedTable.id);
      if (table) {
          ctx.save();
          const rotation = (table.rotation || 0) * (Math.PI / 180);
          const centerX = table.x + table.width / 2;
          const centerY = table.y + table.height / 2;

          // Translate and rotate context for handles
          ctx.translate(centerX, centerY);
          ctx.rotate(rotation);
          ctx.translate(-centerX, -centerY);

          const handleDrawSize = 8 / zoomLevel; // Visual size
          const handleOffset = handleDrawSize / 2;
          ctx.fillStyle = "#3B82F6"; // Blue handles

          let handles: { x: number; y: number }[] = [];
          if (table.type === "circle") {
              const radius = table.width / 2;
              handles = [
                  { x: centerX, y: table.y }, // Top-center
                  { x: table.x + table.width, y: centerY }, // Right-center
                  { x: centerX, y: table.y + table.height }, // Bottom-center
                  { x: table.x, y: centerY }, // Left-center
              ];
          } else {
              handles = [
                  { x: table.x, y: table.y }, // Top-left
                  { x: table.x + table.width / 2, y: table.y }, // Top-center
                  { x: table.x + table.width, y: table.y }, // Top-right
                  { x: table.x + table.width, y: table.y + table.height / 2 }, // Right-center
                  { x: table.x + table.width, y: table.y + table.height }, // Bottom-right
                  { x: table.x + table.width / 2, y: table.y + table.height }, // Bottom-center
                  { x: table.x, y: table.y + table.height }, // Bottom-left
                  { x: table.x, y: table.y + table.height / 2 }, // Left-center
              ];
          }


          handles.forEach(handle => {
              ctx.fillRect(handle.x - handleOffset, handle.y - handleOffset, handleDrawSize, handleDrawSize);
          });

          // Draw rotation handle (circle above top-center)
          const rotationHandleRadius = 6 / zoomLevel;
          const rotationHandleLineOffset = 25 / zoomLevel; // Distance above top edge
          const rotationHandleX = centerX;
          // Calculate Y position for the center of the rotation handle circle
          const rotationHandleY = table.y - rotationHandleLineOffset - rotationHandleRadius;

          ctx.beginPath();
          ctx.arc(rotationHandleX, rotationHandleY, rotationHandleRadius, 0, 2 * Math.PI);
          ctx.fill();
          // Line connecting to table
          ctx.beginPath();
          ctx.moveTo(centerX, table.y); // Start line from top-center edge
          ctx.lineTo(rotationHandleX, rotationHandleY); // End line at center of rotation handle
          ctx.strokeStyle = "#3B82F6";
          ctx.lineWidth = 1 / zoomLevel;
          ctx.stroke();


          ctx.restore(); // Restore context rotation/translation
      }
    }


    ctx.restore() // Restore main context scale/translation
  }, [
    tables, selectedTable, hoveredTable, canvasSize, isGridVisible, gridSize,
    zoomLevel, panOffset, showTableLabels, showTableSeats, showTableDimensions, showTableStatus, calculateSeatPositions // Added calculateSeatPositions dependency
  ])


  // Convert screen coordinates to canvas coordinates considering pan and zoom
  const screenToCanvas = (screenX: number, screenY: number): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const canvasX = (screenX - rect.left - panOffset.x) / zoomLevel
    const canvasY = (screenY - rect.top - panOffset.y) / zoomLevel

    return { x: canvasX, y: canvasY }
  }

  // Snap value to the nearest grid line if enabled
  const snapToGridValue = (value: number): number => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value
  }

  // Find the topmost table at a given canvas position
  const findTableAtPosition = (x: number, y: number): Table | null => {
    // Iterate in reverse (topmost first)
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i]
      const rotation = (table.rotation || 0) * (Math.PI / 180)
      const centerX = table.x + table.width / 2
      const centerY = table.y + table.height / 2

      // Translate point to table's local coordinate system (considering rotation)
      const translatedX = x - centerX
      const translatedY = y - centerY
      const rotatedX = translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation)
      const rotatedY = translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation)
      const localX = rotatedX + centerX
      const localY = rotatedY + centerY

      // Check collision based on type
      if (table.type === "circle") {
        const radius = table.width / 2
        const distSq = (localX - centerX) ** 2 + (localY - centerY) ** 2
        if (distSq <= radius ** 2) {
          return table
        }
      } else {
        // Rectangle or Square - Check collision in the table's local (unrotated) coordinates
        if (
          localX >= table.x &&
          localX <= table.x + table.width &&
          localY >= table.y &&
          localY <= table.y + table.height
        ) {
          return table
        }
      }
    }
    return null
  }

  // Find which resize handle is at a given canvas position
  const findResizeHandleAtPosition = (x: number, y: number): string | null => {
    if (!selectedTable) return null

    const handleHitboxSize = 20 / zoomLevel // Increased clickable area slightly
    const table = selectedTable
    const rotation = (table.rotation || 0) * (Math.PI / 180)
    const centerX = table.x + table.width / 2
    const centerY = table.y + table.height / 2

    // Translate point to table's local coordinate system
    const translatedX = x - centerX
    const translatedY = y - centerY
    const rotatedX = translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation)
    const rotatedY = translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation)
    const localX = rotatedX + centerX
    const localY = rotatedY + centerY

    // Define handle positions in the table's local (unrotated) coordinate space
    let handles: { x: number; y: number; dir: string }[] = []

    if (table.type === "circle") {
        const radius = table.width / 2;
        handles = [
            { x: centerX, y: table.y, dir: "tc" }, // Top-center
            { x: table.x + table.width, y: centerY, dir: "rc" }, // Right-center
            { x: centerX, y: table.y + table.height, dir: "bc" }, // Bottom-center
            { x: table.x, y: centerY, dir: "lc" }, // Left-center
        ];
    } else {
        handles = [
            { x: table.x, y: table.y, dir: "tl" }, // Top-left
            { x: table.x + table.width / 2, y: table.y, dir: "tc" }, // Top-center
            { x: table.x + table.width, y: table.y, dir: "tr" }, // Top-right
            { x: table.x + table.width, y: table.y + table.height / 2, dir: "rc" }, // Right-center
            { x: table.x + table.width, y: table.y + table.height, dir: "br" }, // Bottom-right
            { x: table.x + table.width / 2, y: table.y + table.height, dir: "bc" }, // Bottom-center
            { x: table.x, y: table.y + table.height, dir: "bl" }, // Bottom-left
            { x: table.x, y: table.y + table.height / 2, dir: "lc" }, // Left-center
        ];
    }


    for (const handle of handles) {
      // Check collision in the table's non-rotated coordinate space
      if (
        localX >= handle.x - handleHitboxSize / 2 &&
        localX <= handle.x + handleHitboxSize / 2 &&
        localY >= handle.y - handleHitboxSize / 2 &&
        localY <= handle.y + handleHitboxSize / 2
      ) {
        return handle.dir
      }
    }
    return null
  }

  // Find if rotation handle is at a given canvas position
  const findRotationHandleAtPosition = (x: number, y: number): boolean => {
    if (!selectedTable) return false

    const handleHitboxRadius = 15 / zoomLevel // Increased clickable radius
    const table = selectedTable
    const rotation = (table.rotation || 0) * (Math.PI / 180)
    const centerX = table.x + table.width / 2
    const centerY = table.y + table.height / 2

    // Calculate rotation handle's visual center position (relative to table center, then rotated)
    // Matches the drawing logic in useEffect
    const rotationHandleDrawRadius = 6 / zoomLevel;
    const rotationHandleLineOffset = 25 / zoomLevel;
    const handleOffsetX_unrotated = 0;
    const handleOffsetY_unrotated = - (table.height / 2) - rotationHandleLineOffset - rotationHandleDrawRadius; // Y offset from center to handle center

    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    // Calculate absolute canvas coordinates of the rotation handle's center
    const handleCenterX = centerX + (handleOffsetX_unrotated * cosR - handleOffsetY_unrotated * sinR);
    const handleCenterY = centerY + (handleOffsetX_unrotated * sinR + handleOffsetY_unrotated * cosR);


    // Check distance from mouse (canvas coords) to handle center (canvas coords)
    const distSq = (x - handleCenterX) ** 2 + (y - handleCenterY) ** 2
    return distSq <= handleHitboxRadius ** 2 // Use the larger hitbox radius for check
  }

  // Add a new table
    const handleAddTable = () => {
      logger.info(`handleAddTable called with newTableType: ${newTableType}`);
    // Save current state to undo stack
    setUndoStack([...undoStack, [...tables]])
    setRedoStack([])

    // Create new table with proper dimensions based on type
    const newTable: Table = {
      id: `table-${Date.now()}`, // Temporary frontend ID
      type: newTableType,
      x: snapToGridValue(200),
      y: snapToGridValue(200),
      width: newTableType === "circle" ? 100 : newTableType === "rectangle" ? 160 : 120,
      height: newTableType === "circle" ? 100 : newTableType === "rectangle" ? 80 : 120,
      seats: newTableType === "circle" ? 4 : 6,
      label: `Table ${tables.length + 1}`,
      rotation: 0,
      status: "available",
      zIndex: Math.max(...tables.map((t) => t.zIndex || 0), 0) + 1,
    }

    const updatedTables = [...tables, newTable]
    setTables(updatedTables)
    setSelectedTable(newTable)

    // Show success toast
    toast({
      title: "Table added",
      description: `New ${newTableType} table has been added. Drag to position it.`,
      duration: 3000,
    })
  }

  // Delete selected table
  const handleDeleteTable = () => {
    if (!selectedTable) return

    // Save current state to undo stack
    setUndoStack([...undoStack, [...tables]])
    setRedoStack([])

    const updatedTables = tables.filter((table) => table.id !== selectedTable.id)
    setTables(updatedTables)
    setSelectedTable(null)

    // Show success toast
    toast({
      title: "Table deleted",
      description: `${selectedTable.label} has been removed.`,
      duration: 2000,
    })
  }

  // Duplicate selected table
  const handleDuplicateTable = () => {
    if (!selectedTable) return

    // Save current state to undo stack
    setUndoStack([...undoStack, [...tables]])
    setRedoStack([])

    const newTable: Table = {
      ...selectedTable,
      id: `table-${Date.now()}`, // New temporary frontend ID
      x: selectedTable.x + 20,
      y: selectedTable.y + 20,
      label: `${selectedTable.label} (Copy)`,
      zIndex: Math.max(...tables.map((t) => t.zIndex || 0), 0) + 1,
    }

    const updatedTables = [...tables, newTable]
    setTables(updatedTables)
    setSelectedTable(newTable)

    toast({
      title: "Table duplicated",
      description: `${selectedTable.label} has been duplicated.`,
      duration: 2000,
    })
  }

  // Update selected table properties
  const handleUpdateTable = (property: keyof Table, value: any) => {
    if (!selectedTable) return

    // For certain properties, we want to save the state for undo
    const propertiesThatNeedUndo = ["label", "seats", "width", "height", "type", "status", "rotation"] // Added rotation
    if (propertiesThatNeedUndo.includes(property as string)) {
      setUndoStack([...undoStack, [...tables]])
      setRedoStack([])
    }

    setTables((prevTables) =>
      prevTables.map((table) => (table.id === selectedTable.id ? { ...table, [property]: value } : table)),
    )

    setSelectedTable((prevSelected) => prevSelected ? { // Update selected table state safely
      ...prevSelected,
      [property]: value,
    } : null);
  }

  // Undo last action
  const handleUndo = () => {
    if (undoStack.length <= 1) return

    const newUndoStack = [...undoStack]
    const lastState = newUndoStack.pop()

    if (lastState) {
      setRedoStack([...redoStack, [...tables]])
      setTables(lastState)
      setUndoStack(newUndoStack)
      setSelectedTable(null) // Deselect after undo/redo

      toast({
        title: "Undo",
        description: "Last action undone",
        duration: 1500,
      })
    }
  }

  // Redo last undone action
  const handleRedo = () => {
    if (redoStack.length === 0) return

    const newRedoStack = [...redoStack]
    const nextState = newRedoStack.pop()

    if (nextState) {
      setUndoStack([...undoStack, [...tables]])
      setTables(nextState)
      setRedoStack(newRedoStack)
      setSelectedTable(null) // Deselect after undo/redo

      toast({
        title: "Redo",
        description: "Action redone",
        duration: 1500,
      })
    }
  }

  // Bring selected table to front
  const handleBringToFront = () => {
    if (!selectedTable) return

    setUndoStack([...undoStack, [...tables]])
    setRedoStack([])

    const maxZIndex = Math.max(...tables.map((t) => t.zIndex || 0), 0)

    setTables((prevTables) =>
      prevTables.map((table) => (table.id === selectedTable.id ? { ...table, zIndex: maxZIndex + 1 } : table)),
    )

    setSelectedTable((prevSelected) => prevSelected ? { // Update selected table state safely
      ...prevSelected,
      zIndex: maxZIndex + 1,
    } : null);

    toast({
      title: "Bring to Front",
      description: `${selectedTable.label} is now on top`,
      duration: 1500,
    })
  }

  // Send selected table to back
  const handleSendToBack = () => {
    if (!selectedTable) return

    setUndoStack([...undoStack, [...tables]])
    setRedoStack([])

    const minZIndex = Math.min(...tables.map((t) => t.zIndex || 0), 0)

    setTables((prevTables) =>
      prevTables.map((table) => (table.id === selectedTable.id ? { ...table, zIndex: minZIndex - 1 } : table)),
    )

    setSelectedTable((prevSelected) => prevSelected ? { // Update selected table state safely
      ...prevSelected,
      zIndex: minZIndex - 1,
    } : null);

    toast({
      title: "Send to Back",
      description: `${selectedTable.label} is now at the bottom`,
      duration: 1500,
    })
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Skip if we were just dragging or resizing or rotating
    if (isDragging || isResizing || isRotating) {
      // Allow completing the action on click release, but don't process click itself
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Check if clicked on a resize handle
    if (selectedTable) {
      const resizeDir = findResizeHandleAtPosition(x, y)
      if (resizeDir) return // Don't deselect if clicked on a resize handle

      // Check if clicked on rotation handle
      if (findRotationHandleAtPosition(x, y)) return
    }

    // Check if clicked on a table
    const clickedTable = findTableAtPosition(x, y)
    setSelectedTable(clickedTable)
  }

  // Handle mouse down for dragging, resizing, rotating
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only handle left mouse button
    if (e.button !== 0) return

    const { x, y } = screenToCanvas(e.clientX, e.clientY)

    // Check if mouse down on a resize handle first
    if (selectedTable) {
      const resizeDir = findResizeHandleAtPosition(x, y)
      if (resizeDir) {
        setIsResizing(true)
        setResizeDirection(resizeDir)
        setResizeStart({ x, y }) // Store initial canvas coords for delta calculation

        // Save current state to undo stack before starting resize
        setUndoStack([...undoStack, [...tables]])
        setRedoStack([])
        return // Don't check for rotation or drag if resizing
      }

      // Check if mouse down on rotation handle
      if (findRotationHandleAtPosition(x, y)) {
        setIsRotating(true)
        // Calculate initial angle relative to table center
        const centerX = selectedTable.x + selectedTable.width / 2
        const centerY = selectedTable.y + selectedTable.height / 2
        const startAngleRad = Math.atan2(y - centerY, x - centerX)
        setRotateStart(startAngleRad) // Store initial angle in RADIANS
        setInitialRotation(selectedTable.rotation || 0); // Store initial table rotation in DEGREES

        // Save current state to undo stack before starting rotation
        setUndoStack([...undoStack, [...tables]])
        setRedoStack([])
        return // Don't check for drag if rotating
      }
    }

    // Check if mouse down on any table for dragging
    const clickedTable = findTableAtPosition(x, y)

    if (clickedTable) {
      // If clicking on a different table than the selected one, select it first
      if (!selectedTable || selectedTable.id !== clickedTable.id) {
        setSelectedTable(clickedTable)
      }

      setIsDragging(true)
      // Use clickedTable here to ensure offset is based on the table being dragged
      setDragOffset({ x: x - clickedTable.x, y: y - clickedTable.y })

      // Save current state to undo stack before starting drag
      setUndoStack([...undoStack, [...tables]])
      setRedoStack([])

      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } else if (e.ctrlKey || e.metaKey) { // Allow panning with Ctrl/Cmd + Left Click
      // Start panning with left mouse button + Ctrl/Cmd key
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY }) // Store screen coords for panning delta
    } else {
      // If clicked on empty space (and not panning), deselect table
       setSelectedTable(null);
    }
  }

  // Handle right mouse button down for panning
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    // Start panning with right mouse button
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY }) // Store screen coords for panning delta
  }

  // Handle mouse move for dragging, resizing, rotating, or panning
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY) // Current mouse position in canvas coords
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle panning
    if (isPanning) {
      const dx = e.clientX - panStart.x; // Delta in screen coordinates
      const dy = e.clientY - panStart.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setPanStart({ x: e.clientX, y: e.clientY }); // Update pan start for next move
      canvas.style.cursor = "grabbing";
      return;
    }

    // Handle rotation
    if (isRotating && selectedTable) {
      const centerX = selectedTable.x + selectedTable.width / 2;
      const centerY = selectedTable.y + selectedTable.height / 2;
      // Calculate angle from table center to current mouse position
      const currentAngleRad = Math.atan2(y - centerY, x - centerX);
      // Calculate change in angle from the start of rotation (initial mouse down)
      let deltaAngleRad = currentAngleRad - rotateStart;

      // Calculate the new rotation in radians based on the initial table rotation + delta
      let newRotationRad = (initialRotation * Math.PI / 180) + deltaAngleRad;

      // Convert back to degrees for storing and snapping
      let newRotationDeg = newRotationRad * 180 / Math.PI;

      // Snap rotation to 15-degree increments if Shift key is held
      if (e.shiftKey) {
        newRotationDeg = Math.round(newRotationDeg / 15) * 15;
      }

      // Normalize rotation to be within 0-360 degrees
      newRotationDeg = (newRotationDeg % 360 + 360) % 360;

      setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, rotation: newRotationDeg } : t));
      setSelectedTable(prev => prev ? { ...prev, rotation: newRotationDeg } : null);

      canvas.style.cursor = "grabbing"; // Or a specific rotation cursor
      return;
    }

    // Handle resizing (Corrected Circle Logic)
    if (isResizing && selectedTable && resizeDirection) {
      const table = selectedTable;
      const centerX = table.x + table.width / 2;
      const centerY = table.y + table.height / 2;

      // 1. Calculate mouse delta in canvas coordinates (current vs start of resize)
      const dx = x - resizeStart.x;
      const dy = y - resizeStart.y;

      // 2. Get table rotation in radians
      const rotationRad = (table.rotation || 0) * (Math.PI / 180);
      const cosR = Math.cos(rotationRad);
      const sinR = Math.sin(rotationRad);

      // 3. Calculate local mouse delta (rotate mouse delta into table's coordinate system)
      const localDx = dx * cosR + dy * sinR;
      const localDy = -dx * sinR + dy * cosR;

      let dw = 0; // Change in width
      let dh = 0; // Change in height

      // 4. Determine width/height changes based on which handle is dragged
      if (table.type === "circle") {
          let diameterDelta = 0;
          // Calculate change based on handle dragged (apply change * 2 for diameter)
          if (resizeDirection === 'tc') diameterDelta = -localDy * 2;
          else if (resizeDirection === 'bc') diameterDelta = localDy * 2;
          else if (resizeDirection === 'lc') diameterDelta = -localDx * 2;
          else if (resizeDirection === 'rc') diameterDelta = localDx * 2;
          dw = diameterDelta;
          dh = diameterDelta;
      } else {
          // For rectangles/squares
          if (resizeDirection.includes("l")) dw = -localDx;
          if (resizeDirection.includes("r")) dw = localDx;
          if (resizeDirection.includes("t")) dh = -localDy;
          if (resizeDirection.includes("b")) dh = localDy;
      }


      // 5. Calculate potential new dimensions BEFORE constraints
      let potentialWidth = table.width + dw;
      let potentialHeight = table.height + dh;

      // 6. Apply minimum size constraints
      potentialWidth = Math.max(MIN_SIZE, potentialWidth);
      potentialHeight = Math.max(MIN_SIZE, potentialHeight);

      // 7. Handle aspect ratio for squares (unless Alt key is pressed) and circles
      if (table.type === "square" && !e.altKey) {
         // Maintain square aspect ratio based on the larger change magnitude
         if (Math.abs(dw) > Math.abs(dh)) {
             potentialHeight = potentialWidth;
         } else {
             potentialWidth = potentialHeight;
         }
      } else if (table.type === "circle") {
          // Ensure width and height remain equal after constraint
          const potentialDiameter = Math.max(potentialWidth, potentialHeight);
          potentialWidth = potentialDiameter;
          potentialHeight = potentialDiameter;
      }

      // 8. Recalculate actual change in dimensions after constraints/aspect ratio
      const actualDw = potentialWidth - table.width;
      const actualDh = potentialHeight - table.height;

      // 9. Calculate position adjustment to keep the center fixed
      const shiftX = -actualDw / 2; // Local shift along table's width axis
      const shiftY = -actualDh / 2; // Local shift along table's height axis

      // Rotate the shift back to canvas coordinates
      const rotatedShiftX = shiftX * cosR - shiftY * sinR;
      const rotatedShiftY = shiftX * sinR + shiftY * cosR;

      let newX = table.x + rotatedShiftX;
      let newY = table.y + rotatedShiftY;
      let newWidth = potentialWidth;
      let newHeight = potentialHeight;

      // 10. Apply Snapping (to the new top-left position)
      if (snapToGrid) {
        // Snap the adjusted top-left corner
        const snappedX = snapToGridValue(newX);
        const snappedY = snapToGridValue(newY);
        // Adjust position based on snapping
        newX = snappedX;
        newY = snappedY;
      }

      // 11. Update State
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, x: newX, y: newY, width: newWidth, height: newHeight } : t));
      setSelectedTable(prev => prev ? { ...prev, x: newX, y: newY, width: newWidth, height: newHeight } : null);

      // 12. Update resizeStart for the next mouse move calculation
      // Use the *current* mouse position in canvas coordinates to calculate delta for next frame
      setResizeStart({ x, y });

      // Cursor style is handled later in the function
      return; // Prevent falling through to dragging logic
    }


    // Handle dragging
    if (isDragging && selectedTable) {
      let newX = x - dragOffset.x;
      let newY = y - dragOffset.y;
      if (snapToGrid) {
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
      }
      setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, x: newX, y: newY } : t));
      setSelectedTable(prev => prev ? { ...prev, x: newX, y: newY } : null);
      canvas.style.cursor = "grabbing";
    } else {
      // Update cursor based on hover state only if not dragging/resizing/rotating/panning
      const hoveredTableFound = findTableAtPosition(x, y);
      setHoveredTable(hoveredTableFound?.id || null);

      let cursorStyle = "default";
      if (selectedTable) {
        const resizeDir = findResizeHandleAtPosition(x, y);
        if (resizeDir) {
          // Determine cursor based on handle direction and table rotation
          const angle = (selectedTable.rotation || 0) % 360;
          if (resizeDir === "tl" || resizeDir === "br") cursorStyle = getDiagonalResizeCursor(angle, 'nwse');
          else if (resizeDir === "tr" || resizeDir === "bl") cursorStyle = getDiagonalResizeCursor(angle, 'nesw');
          else if (resizeDir === "tc" || resizeDir === "bc") cursorStyle = getStraightResizeCursor(angle, 'ns');
          else if (resizeDir === "lc" || resizeDir === "rc") cursorStyle = getStraightResizeCursor(angle, 'ew');
        } else if (findRotationHandleAtPosition(x, y)) {
          cursorStyle = "grab"; // Or a specific rotation cursor like 'crosshair' or custom
        } else if (hoveredTableFound?.id === selectedTable.id) {
           cursorStyle = "move";
        }
      } else if (hoveredTableFound) {
         cursorStyle = "move";
      } else if (e.ctrlKey || e.metaKey) {
         cursorStyle = "grab"; // Indicate panning possible
      }
      canvas.style.cursor = cursorStyle;
    }
  }

  // Helper functions for dynamic resize cursors based on rotation
  const getDiagonalResizeCursor = (angle: number, baseCursor: 'nwse' | 'nesw'): string => {
      const normalizedAngle = ((angle % 180) + 180) % 180; // Normalize angle to 0-180
      // Adjust cursor based on 45-degree segments
      if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) return baseCursor === 'nwse' ? 'ns-resize' : 'ew-resize';
      if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) return baseCursor === 'nwse' ? 'nesw-resize' : 'nwse-resize'; // Swap base
      if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) return baseCursor === 'nwse' ? 'ew-resize' : 'ns-resize';
      return `${baseCursor}-resize`; // Default for 0-22.5 and 157.5-180
  };

  const getStraightResizeCursor = (angle: number, baseCursor: 'ns' | 'ew'): string => {
      const normalizedAngle = ((angle % 180) + 180) % 180;
      if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) return baseCursor === 'ns' ? 'nesw-resize' : 'nwse-resize';
      if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) return baseCursor === 'ns' ? 'ew-resize' : 'ns-resize'; // Swap base
      if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) return baseCursor === 'ns' ? 'nwse-resize' : 'nesw-resize';
      return `${baseCursor}-resize`;
  };


  // Handle mouse up
  const handleMouseUp = () => {
    if (isDragging || isResizing || isRotating) {
      // Optional: Add toast notifications for completed actions
      // if (isDragging && selectedTable) toast({ title: "Table moved", description: `${selectedTable.label} repositioned.`, duration: 1500 });
      // else if (isResizing && selectedTable) toast({ title: "Table resized", description: `${selectedTable.label} dimensions updated.`, duration: 1500 });
      // else if (isRotating && selectedTable) toast({ title: "Table rotated", description: `${selectedTable.label} rotation updated.`, duration: 1500 });

      // Finalize state in undo stack if needed (better to do on mouse down)
    }
    setIsDragging(false); setIsResizing(false); setIsRotating(false); setIsPanning(false);
    if (canvasRef.current) {
        canvasRef.current.style.cursor = "default"; // Reset cursor explicitly
    }
  }

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9; // Zoom speed
    const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor)); // Clamp zoom level

    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position relative to canvas origin
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate where the mouse points in the *canvas coordinate space* before zoom
    const pointXBeforeZoom = (mouseX - panOffset.x) / zoomLevel;
    const pointYBeforeZoom = (mouseY - panOffset.y) / zoomLevel;

    // Calculate the new pan offset to keep the pointed-at location fixed under the cursor
    const newPanOffsetX = mouseX - pointXBeforeZoom * newZoomLevel;
    const newPanOffsetY = mouseY - pointYBeforeZoom * newZoomLevel;

    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
  }

  // Reset view
  const handleResetView = () => {
    setZoomLevel(1); setPanOffset({ x: 0, y: 0 });
    toast({ title: "View reset", duration: 1500 });
  }

  // Save floor plan to API
  const handleSaveFloorPlan = async () => {
    logger.info("Attempting to save floor plan to API...");
    setIsSaving(true);
    setSelectedTable(null); // Deselect table during save

    let backendTables: BackendTable[] = [];
    try {
        // 1. Fetch current state from backend
        const fetchResponse = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`);
        if (!fetchResponse.ok) {
            if (fetchResponse.status === 404) {
                logger.warning(`Floor plan ${floorPlanId} not found on backend during save attempt.`);
                // If the floor plan doesn't exist, we might need to create it first,
                // but for now, we'll assume it exists and proceed with empty backendTables.
            } else {
                throw new Error(`Failed to fetch current tables: ${fetchResponse.status}`);
            }
        } else {
            backendTables = await fetchResponse.json();
        }

        // 2. Compare frontend state with backend state
        const frontendTableMap = new Map(tables.map(t => [t.id, t]));
        const backendTableMap = new Map(backendTables.map(t => [`backend-${t.id}`, t])); // Use prefixed ID for mapping

        const frontendIds = new Set(frontendTableMap.keys());
        const backendIds = new Set(backendTableMap.keys());

        const tablesToDelete: number[] = []; // Store backend integer IDs
        const tablesToUpdate: { backendId: number; payload: TableUpdatePayload }[] = [];
        const tablesToAdd: TableCreatePayload[] = [];

        // Find deletions: Tables in backend but not frontend
        backendIds.forEach(backendPrefixedId => {
            if (!frontendIds.has(backendPrefixedId)) {
                const backendTable = backendTableMap.get(backendPrefixedId);
                if (backendTable) {
                    tablesToDelete.push(backendTable.id);
                }
            }
        });

        // Find additions and updates: Tables in frontend
        frontendIds.forEach(frontendId => {
            const frontendTable = frontendTableMap.get(frontendId);
            if (!frontendTable) return;

            if (frontendId.startsWith('table-')) {
                // New table (has temporary ID)
                tablesToAdd.push(mapFrontendTableToCreatePayload(frontendTable));
            } else if (backendIds.has(frontendId)) {
                // Existing table (has backend ID), check for updates
                const backendTable = backendTableMap.get(frontendId);
                if (backendTable) {
                    const updatePayload = mapFrontendTableToUpdatePayload(frontendTable, backendTable);
                    if (updatePayload) { // Only update if there are actual changes
                        tablesToUpdate.push({ backendId: backendTable.id, payload: updatePayload });
                    }
                }
            } else {
                logger.warning(`Frontend table with ID ${frontendId} not found in backend map during save.`);
            }
        });

        logger.info(`Tables to add: ${tablesToAdd.length}, update: ${tablesToUpdate.length}, delete: ${tablesToDelete.length}`);

        // 3. Perform API calls concurrently
        const apiCalls: Promise<Response>[] = []; // Expecting Fetch Response objects

        // Deletions
        tablesToDelete.forEach(id => {
            logger.info(`Scheduling DELETE for table ID: ${id}`);
            apiCalls.push(fetch(`/api/v1/tables/${id}`, { method: 'DELETE' }));
        });

        // Updates
        tablesToUpdate.forEach(({ backendId, payload }) => {
             logger.info(`Scheduling PUT for table ID: ${backendId}`, payload);
            apiCalls.push(fetch(`/api/v1/tables/${backendId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }));
        });

        // Additions
        tablesToAdd.forEach(payload => {
             logger.info(`Scheduling POST for new table: ${payload.name}`);
            apiCalls.push(fetch(`/api/v1/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }));
        });

        // Execute all calls and wait for them to settle
        const results = await Promise.allSettled(apiCalls);

        // Check results and show feedback
        let successCount = 0;
        let errorCount = 0;
        const errorDetailsPromises: Promise<any>[] = []; // For parsing error bodies

        results.forEach((result, index) => {
            let operationType = "Unknown";
            if (index < tablesToDelete.length) operationType = "DELETE";
            else if (index < tablesToDelete.length + tablesToUpdate.length) operationType = "UPDATE";
            else operationType = "CREATE";

            if (result.status === 'fulfilled') {
                 // Check if the response was ok (status 2xx)
                 if (result.value instanceof Response && !result.value.ok) {
                    logger.error(`API call (${operationType}) failed with status: ${result.value.status}`);
                    // Queue up parsing the error body
                    errorDetailsPromises.push(
                        result.value.json().catch(() => ({ detail: 'Failed to parse error body' }))
                    );
                    errorCount++;
                 } else {
                    successCount++;
                 }
            } else {
                logger.error(`API call (${operationType}) rejected:`, result.reason);
                errorCount++;
                errorDetailsPromises.push(Promise.resolve({ detail: result.reason?.message || 'Unknown rejection reason' })); // Add rejection reason
            }
        });

        // Process any error details after all initial checks
        if (errorDetailsPromises.length > 0) {
            const errorDetailsResults = await Promise.allSettled(errorDetailsPromises);
            errorDetailsResults.forEach(detailResult => {
                if (detailResult.status === 'fulfilled') {
                    logger.error('Error details:', detailResult.value);
                } else {
                     logger.error('Failed to process error details:', detailResult.reason);
                }
            });
        }


        if (errorCount > 0) {
            toast({
                title: "Save Partially Failed",
                description: `${errorCount} operation(s) failed. ${successCount} succeeded. Check console for details.`,
                variant: "destructive",
                duration: 5000,
            });
        } else if (successCount > 0 || (tablesToAdd.length === 0 && tablesToUpdate.length === 0 && tablesToDelete.length === 0)) {
             // Show success if any operation succeeded OR if there were no changes to make
            toast({
                title: "Floor Plan Saved",
                description: "Your changes have been saved successfully.",
                duration: 3000,
            });
            // Reload tables from API to get backend IDs for newly added tables and ensure consistency
            await loadTablesFromAPI(false); // Pass false to avoid resetting undo stack
        } else {
             toast({
                title: "No Changes",
                description: "No changes detected to save.",
                duration: 2000,
            });
        }

    } catch (error) {
        logger.error("Error during the save process:", error);
        toast({
            title: "Save Failed",
            description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
            duration: 5000,
        });
    } finally {
        setIsSaving(false);
    }
  };


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "Delete" || e.key === "Backspace") { // Added Backspace
          if (selectedTable) handleDeleteTable();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); handleRedo(); }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedTable) { e.preventDefault(); handleDuplicateTable(); }
      if (e.key === "g") setIsGridVisible(!isGridVisible);
      if (e.key === "s") setSnapToGrid(!snapToGrid);
      if (e.key === "r") handleResetView();
      // Nudge selected table with arrow keys
      if (selectedTable && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const moveDistance = e.shiftKey ? (snapToGrid ? gridSize : 10) : 1; // Larger nudge with Shift
        let newX = selectedTable.x; let newY = selectedTable.y;
        if (e.key === "ArrowLeft") newX -= moveDistance;
        if (e.key === "ArrowRight") newX += moveDistance;
        if (e.key === "ArrowUp") newY -= moveDistance;
        if (e.key === "ArrowDown") newY += moveDistance;

        // Apply snapping after nudge if enabled
        if (snapToGrid && !e.shiftKey) { // Don't snap large nudges
             newX = snapToGridValue(newX);
             newY = snapToGridValue(newY);
        }

        // Save state for undo before moving
        setUndoStack([...undoStack, [...tables]]);
        setRedoStack([]);

        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, x: newX, y: newY } : t));
        setSelectedTable(prev => prev ? { ...prev, x: newX, y: newY } : null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTable, isGridVisible, snapToGrid, tables, undoStack, redoStack, gridSize, handleDeleteTable, handleUndo, handleRedo, handleDuplicateTable, handleResetView]); // Added gridSize dependency


  // Toolbar buttons component
  const ToolbarButton = ({ icon, label, onClick, disabled = false, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; active?: boolean }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={active ? "default" : "outline"} size="icon" onClick={onClick} disabled={disabled || isSaving} className={cn("h-9 w-9", active && "bg-blue-600 text-white hover:bg-blue-700")}>
            {icon} <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        {showTooltips && <TooltipContent>{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );

  // Status badge component
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "available": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Available</Badge>;
      case "occupied": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Occupied</Badge>;
      case "reserved": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Reserved</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Main toolbar */}
      <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2">
          <ToolbarButton icon={<Undo2 className="h-4 w-4" />} label="Undo (Ctrl+Z)" onClick={handleUndo} disabled={undoStack.length <= 1 || isSaving} />
          <ToolbarButton icon={<Redo2 className="h-4 w-4" />} label="Redo (Ctrl+Y)" onClick={handleRedo} disabled={redoStack.length === 0 || isSaving} />
          <div className="h-6 border-l border-gray-700 mx-1" />
          <ToolbarButton icon={<Grid className="h-4 w-4" />} label={isGridVisible ? "Hide Grid (G)" : "Show Grid (G)"} onClick={() => setIsGridVisible(!isGridVisible)} active={isGridVisible} disabled={isSaving}/>
          <ToolbarButton icon={<Move className="h-4 w-4" />} label={snapToGrid ? "Snap to Grid (S)" : "Free Movement (S)"} onClick={() => setSnapToGrid(!snapToGrid)} active={snapToGrid} disabled={isSaving}/>
          <div className="h-6 border-l border-gray-700 mx-1" />
          <ToolbarButton icon={<CircleIcon className="h-4 w-4" />} label="Add Circle Table" onClick={() => { setNewTableType("circle"); handleAddTable(); }} disabled={isSaving}/>
          <ToolbarButton icon={<Square className="h-4 w-4" />} label="Add Square Table" onClick={() => { logger.info("Add Square button clicked"); setNewTableType("square"); setTimeout(() => handleAddTable(), 0); }} disabled={isSaving}/>
          <ToolbarButton icon={<RectangleHorizontal className="h-4 w-4" />} label="Add Rectangle Table" onClick={() => { logger.info("Add Rectangle button clicked"); setNewTableType("rectangle"); setTimeout(() => handleAddTable(), 0); }} disabled={isSaving}/>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetView} className="text-sm gap-1" disabled={isSaving}>Reset View</Button>
          <Button variant="default" size="sm" onClick={handleSaveFloorPlan} className="text-sm gap-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main canvas area */}
        <div ref={containerRef} className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 shadow-lg">
          {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-50">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
          )}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // End drag/resize/pan if mouse leaves canvas
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
            className={cn("w-full h-auto", (isDragging || isResizing || isRotating || isPanning) ? "" : "cursor-default", isLoading && "opacity-50")} // Let handleMouseMove set cursor, dim if loading
          />
          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg border border-gray-800">
            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.max(0.1, zoomLevel / 1.2))} className="h-8 w-8 text-gray-400">
              <span className="text-lg">−</span>
            </Button>
            <span className="text-sm text-gray-300 min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.min(5, zoomLevel * 1.2))} className="h-8 w-8 text-gray-400">
              <span className="text-lg">+</span>
            </Button>
          </div>
        </div>

        {/* Side panel with controls */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Table properties panel */}
          <Collapsible open={isTablesPanelOpen} onOpenChange={setIsTablesPanelOpen} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50">
                <div className="flex items-center gap-2"> <Settings className="h-5 w-5 text-gray-400" /> <h3 className="text-lg font-medium">Table Properties</h3> </div>
                <ChevronRight className={`h-5 w-5 transition-transform ${isTablesPanelOpen ? 'rotate-90' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t border-gray-800">
                {selectedTable ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="table-label" className="text-sm font-medium">Table Label</Label>
                      <Input id="table-label" value={selectedTable.label} onChange={(e) => handleUpdateTable("label", e.target.value)} className="bg-gray-800/50 border-gray-700 mt-1" disabled={isSaving}/>
                    </div>
                    <div>
                      <Label htmlFor="table-seats" className="text-sm font-medium">Seats</Label>
                      <Input id="table-seats" type="number" min={1} max={20} value={selectedTable.seats} onChange={(e) => handleUpdateTable("seats", Number.parseInt(e.target.value) || 1)} className="bg-gray-800/50 border-gray-700 mt-1" disabled={isSaving}/>
                    </div>
                    <div>
                      <Label htmlFor="table-status" className="text-sm font-medium">Status</Label>
                      <Select value={selectedTable.status || "available"} onValueChange={(value) => handleUpdateTable("status", value)} disabled={isSaving}>
                        <SelectTrigger id="table-status" className="bg-gray-800/50 border-gray-700 mt-1"> <SelectValue placeholder="Select status" /> </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="table-width" className="text-sm font-medium">Width</Label>
                        <Input id="table-width" type="number" min={MIN_SIZE} max={1000} value={Math.round(selectedTable.width)} onChange={(e) => handleUpdateTable("width", Number.parseInt(e.target.value) || MIN_SIZE)} className="bg-gray-800/50 border-gray-700 mt-1" disabled={isSaving}/>
                      </div>
                      <div>
                        <Label htmlFor="table-height" className="text-sm font-medium">Height</Label>
                        <Input id="table-height" type="number" min={MIN_SIZE} max={1000} value={Math.round(selectedTable.height)} onChange={(e) => handleUpdateTable("height", Number.parseInt(e.target.value) || MIN_SIZE)} disabled={selectedTable.type === "circle" || selectedTable.type === "square" || isSaving} className="bg-gray-800/50 border-gray-700 mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="table-rotation" className="text-sm font-medium">Rotation</Label>
                      <div className="flex items-center gap-2">
                        <Slider id="table-rotation" min={0} max={360} step={1} value={[Math.round(selectedTable.rotation || 0)]} onValueChange={(value) => handleUpdateTable("rotation", value[0])} className="flex-1" disabled={isSaving}/>
                        <span className="text-sm w-10 text-right">{Math.round(selectedTable.rotation || 0)}°</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={handleBringToFront} className="flex-1 text-xs gap-1" disabled={isSaving}> <Layers className="h-3 w-3" /> Bring Front </Button>
                        <Button variant="outline" size="sm" onClick={handleSendToBack} className="flex-1 text-xs gap-1" disabled={isSaving}> <Layers className="h-3 w-3" /> Send Back </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={handleDuplicateTable} className="flex-1 text-xs gap-1" disabled={isSaving}> <Copy className="h-3 w-3" /> Duplicate </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteTable} className="flex-1 text-xs gap-1" disabled={isSaving}> <Trash2 className="h-3 w-3" /> Delete </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Info className="h-10 w-10 mx-auto text-gray-500 mb-2" />
                    <p>Select a table to edit</p>
                    <p className="text-sm mt-1">Add tables using the toolbar</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Display options panel */}
          <Collapsible open={isControlsPanelOpen} onOpenChange={setIsControlsPanelOpen} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50">
                <div className="flex items-center gap-2"> <Settings className="h-5 w-5 text-gray-400" /> <h3 className="text-lg font-medium">Display Options</h3> </div>
                <ChevronRight className={`h-5 w-5 transition-transform ${isControlsPanelOpen ? 'rotate-90' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t border-gray-800 space-y-4">
                <div className="flex items-center justify-between"> <Label htmlFor="show-grid" className="text-sm font-medium cursor-pointer">Show Grid</Label> <Switch id="show-grid" checked={isGridVisible} onCheckedChange={setIsGridVisible} /> </div>
                <div className="flex items-center justify-between"> <Label htmlFor="snap-grid" className="text-sm font-medium cursor-pointer">Snap to Grid</Label> <Switch id="snap-grid" checked={snapToGrid} onCheckedChange={setSnapToGrid} /> </div>
                <div>
                  <Label htmlFor="grid-size" className="text-sm font-medium">Grid Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider id="grid-size" min={10} max={100} step={5} value={[gridSize]} onValueChange={(value) => setGridSize(value[0])} disabled={!isGridVisible && !snapToGrid} className="flex-1" />
                    <span className="text-sm w-10 text-right">{gridSize}px</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <h4 className="text-sm font-medium mb-2">Table Display</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"> <Label htmlFor="show-labels" className="text-sm cursor-pointer">Show Labels</Label> <Switch id="show-labels" checked={showTableLabels} onCheckedChange={setShowTableLabels} /> </div>
                    <div className="flex items-center justify-between"> <Label htmlFor="show-seats" className="text-sm cursor-pointer">Show Seats</Label> <Switch id="show-seats" checked={showTableSeats} onCheckedChange={setShowTableSeats} /> </div>
                    <div className="flex items-center justify-between"> <Label htmlFor="show-dimensions" className="text-sm cursor-pointer">Show Dimensions</Label> <Switch id="show-dimensions" checked={showTableDimensions} onCheckedChange={setShowTableDimensions} /> </div>
                    <div className="flex items-center justify-between"> <Label htmlFor="show-tooltips" className="text-sm cursor-pointer">Show Tooltips</Label> <Switch id="show-tooltips" checked={showTooltips} onCheckedChange={setShowTooltips} /> </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Table list panel */}
          <Card className="bg-gray-900/50 border-gray-800 shadow-lg">
            <div className="p-4 border-b border-gray-800"> <h3 className="text-lg font-medium">Tables</h3> </div>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {tables.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {tables.map((table) => (
                    <div key={table.id} className={cn("p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/50", selectedTable?.id === table.id && "bg-blue-900/20")} onClick={() => setSelectedTable(table)}>
                      <div className="flex items-center gap-3">
                        {table.type === "circle" ? <CircleIcon className="h-4 w-4 text-gray-400" /> : table.type === "square" ? <Square className="h-4 w-4 text-gray-400" /> : <RectangleHorizontal className="h-4 w-4 text-gray-400" />}
                        <span>{table.label}</span>
                      </div>
                      {getStatusBadge(table.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <p>No tables added yet</p>
                  <p className="text-sm mt-1">Add tables using the toolbar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
