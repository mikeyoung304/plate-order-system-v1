"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react" // Added useCallback
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Trash2, Save, Move, CircleIcon, Square, RectangleHorizontal, Grid,
  Undo2, Redo2, Copy, Layers, ChevronRight, Settings, Info, Loader2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Table, BackendTable, TableCreatePayload, TableUpdatePayload,
  mapBackendTableToFrontend, mapFrontendTableToCreatePayload, mapFrontendTableToUpdatePayload,
  mapFrontendStatusToBackend
} from "@/lib/floor-plan-utils"
import { mockAPI } from "@/mocks/mockData"

// Helper constant for minimum size
const MIN_SIZE = 20;

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;
  return function(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = func.apply(this, args);
    }
    return lastResult;
  } as T;
}

type FloorPlanEditorProps = {
  floorPlanId: string
}

export function FloorPlanEditor({ floorPlanId }: FloorPlanEditorProps) {
  // State
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [newTableType, setNewTableType] = useState<Table['type']>("circle")
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
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })
  const [isRotating, setIsRotating] = useState(false)
  const [rotateStart, setRotateStart] = useState(0)
  const [initialRotation, setInitialRotation] = useState(0);
  const [undoStack, setUndoStack] = useState<Table[][]>([[]]);
  const [redoStack, setRedoStack] = useState<Table[][]>([]);
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showTooltips, setShowTooltips] = useState(true)
  const [showTableLabels, setShowTableLabels] = useState(true)
  const [showTableSeats, setShowTableSeats] = useState(true)
  const [showTableDimensions, setShowTableDimensions] = useState(false)
  const [showTableStatus, setShowTableStatus] = useState(true)
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalTables, setOriginalTables] = useState<Table[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [undoPosition, setUndoPosition] = useState<number>(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null); // Ref for animation frame
  const { toast } = useToast()

  // Logger
  const logger = useMemo(() => ({
      info: (message: string, ...args: any[]) => console.log(`[FloorPlanEditor] ${message}`, ...args),
      error: (message: string, ...args: any[]) => console.error(`[FloorPlanEditor] ${message}`, ...args),
      warning: (message: string, ...args: any[]) => console.warn(`[FloorPlanEditor] ${message}`, ...args),
  }), []);

  // Create a toast wrapper function that matches our expected call signature
  const showInternalToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'default' = 'default') => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : type === 'warning' ? 'warning' as any : 'default',
    });
  }, [toast]);

  // Default table creator
  const createDefaultTable = (): Table => ({
    id: `table-${Date.now()}`, type: "circle", x: 200, y: 200, width: 100, height: 100,
    seats: 4, label: "Table 1", rotation: 0, status: "available", zIndex: 1,
  });

  // Load initial tables
  const loadTables = useCallback(async () => {
    logger.info(`Loading tables for floor plan: ${floorPlanId}`);
    setIsLoading(true);
    setLoadError(null);

    try {
      // Use mock API instead of fetch
      const mockTables = await mockAPI.getTables(floorPlanId);
      
      // Convert mock tables to the format expected by mapBackendTableToFrontend
      const backendTables: BackendTable[] = mockTables.map(table => ({
        id: parseInt(table.id.replace('table-', ''), 10),
        floor_plan_id: table.floor_plan_id,
        position_x: table.x,
        position_y: table.y,
        width: table.width,
        height: table.height,
        shape: table.type as "circle" | "rectangle" | "square",
        name: table.label,
        seat_count: table.seats,
        rotation: table.rotation || 0,
        status: table.status as "available" | "reserved" | "out_of_service"
      }));
      
      logger.info(`Retrieved ${backendTables.length} tables for floor plan`);
      
      const frontendTables = backendTables.map(mapBackendTableToFrontend);
      setTables(frontendTables);
      setOriginalTables(JSON.parse(JSON.stringify(frontendTables)));
      
      return frontendTables;
    } catch (error: any) {
      const errorMsg = `Error loading tables: ${error.message}`;
      logger.error(errorMsg);
      setLoadError(errorMsg);
      showInternalToast("Failed to load floor plan tables", "error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [floorPlanId, logger, showInternalToast]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Adjust canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(1200, containerRef.current.clientWidth - 20);
        setCanvasSize({ width, height: width * 0.75 });
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Calculate seat positions
  const calculateSeatPositions = useCallback((type: string, x: number, y: number, width: number, height: number, seats: number): { x: number; y: number }[] => {
    const positions: { x: number; y: number }[] = [];
    const seatOffset = 15 / zoomLevel; // Adjust offset based on zoom
    if (type === "circle") {
      const radius = width / 2 + seatOffset;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      for (let i = 0; i < seats; i++) {
        const angle = (i / seats) * 2 * Math.PI;
        positions.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) });
      }
    } else {
      const perimeter = 2 * (width + height);
      if (seats <= 0) return [];
      const spacing = perimeter / seats;
      let currentDistance = spacing / 2;
      for (let i = 0; i < seats; i++) {
        let posX = 0, posY = 0;
        if (currentDistance <= width) { posX = x + currentDistance; posY = y - seatOffset; }
        else if (currentDistance <= width + height) { posX = x + width + seatOffset; posY = y + (currentDistance - width); }
        else if (currentDistance <= 2 * width + height) { posX = x + width - (currentDistance - width - height); posY = y + height + seatOffset; }
        else { posX = x - seatOffset; posY = y + height - (currentDistance - 2 * width - height); }
        positions.push({ x: posX, y: posY });
        currentDistance += spacing;
      }
    }
    return positions;
  }, [zoomLevel]); // Recalculate only when zoom changes

  // Draw the floor plan using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFrame = () => {
      if (!canvasRef.current) return; // Check if canvas still exists
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      // Draw grid
      if (isGridVisible) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1 / zoomLevel;
        const viewLeft = -panOffset.x / zoomLevel, viewTop = -panOffset.y / zoomLevel;
        const viewRight = (canvasSize.width - panOffset.x) / zoomLevel, viewBottom = (canvasSize.height - panOffset.y) / zoomLevel;
        const startX = Math.floor(viewLeft / gridSize) * gridSize, startY = Math.floor(viewTop / gridSize) * gridSize;
        const endX = Math.ceil(viewRight / gridSize) * gridSize, endY = Math.ceil(viewBottom / gridSize) * gridSize;
        for (let gx = startX; gx <= endX; gx += gridSize) { ctx.moveTo(gx, viewTop); ctx.lineTo(gx, viewBottom); }
        for (let gy = startY; gy <= endY; gy += gridSize) { ctx.moveTo(viewLeft, gy); ctx.lineTo(viewRight, gy); }
        ctx.stroke();
      }

      // Draw tables
      const sortedTables = [...tables].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      sortedTables.forEach((table) => {
        ctx.save();
        const rotation = (table.rotation || 0) * (Math.PI / 180);
        const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
        ctx.translate(centerX, centerY); ctx.rotate(rotation); ctx.translate(-centerX, -centerY);
        const isSelected = selectedTable?.id === table.id, isHovered = hoveredTable === table.id;
        ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.5)" : isHovered ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)";
        ctx.strokeStyle = isSelected ? "#3B82F6" : isHovered ? "#ffffff" : "#6b7280";
        ctx.lineWidth = isSelected ? 3 / zoomLevel : 1.5 / zoomLevel;
        ctx.beginPath();
        if (table.type === "circle") { ctx.arc(centerX, centerY, table.width / 2, 0, 2 * Math.PI); }
        else { ctx.rect(table.x, table.y, table.width, table.height); }
        ctx.fill(); ctx.stroke();
        if (showTableSeats) {
            const seatPositions = calculateSeatPositions(table.type, table.x, table.y, table.width, table.height, table.seats);
            ctx.fillStyle = "#cbd5e1"; const seatRadius = 5 / zoomLevel;
            seatPositions.forEach(pos => { ctx.beginPath(); ctx.arc(pos.x, pos.y, seatRadius, 0, 2 * Math.PI); ctx.fill(); });
        }
        if (showTableLabels) {
            ctx.fillStyle = "#e5e7eb"; ctx.font = `${14 / zoomLevel}px sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(table.label, centerX, centerY);
        }
        if (showTableDimensions) {
             ctx.fillStyle = "#9ca3af"; ctx.font = `${10 / zoomLevel}px sans-serif`;
             ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(`${Math.round(table.width)}x${Math.round(table.height)}`, centerX, table.y - 5 / zoomLevel);
        }
        if (showTableStatus && table.status) {
            let statusColor = "#6b7280";
            if (table.status === "available") statusColor = "#10B981"; else if (table.status === "occupied") statusColor = "#EF4444"; else if (table.status === "reserved") statusColor = "#F59E0B";
            ctx.fillStyle = statusColor; ctx.beginPath();
            ctx.arc(table.x + table.width - 8 / zoomLevel, table.y + 8 / zoomLevel, 5 / zoomLevel, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.restore();
      });

      // Draw selection handles
      if (selectedTable) {
        const table = tables.find(t => t.id === selectedTable.id);
        if (table) {
          ctx.save();
          const rotation = (table.rotation || 0) * (Math.PI / 180);
          const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
          ctx.translate(centerX, centerY); ctx.rotate(rotation); ctx.translate(-centerX, -centerY);
          const handleDrawSize = 8 / zoomLevel, handleOffset = handleDrawSize / 2; ctx.fillStyle = "#3B82F6";
          let handles: { x: number; y: number }[] = [];
          if (table.type === "circle") { const radius = table.width / 2; handles = [{ x: centerX, y: table.y }, { x: table.x + table.width, y: centerY }, { x: centerX, y: table.y + table.height }, { x: table.x, y: centerY }]; }
          else { handles = [{ x: table.x, y: table.y }, { x: centerX, y: table.y }, { x: table.x + table.width, y: table.y }, { x: table.x + table.width, y: centerY }, { x: table.x + table.width, y: table.y + table.height }, { x: centerX, y: table.y + table.height }, { x: table.x, y: table.y + table.height }, { x: table.x, y: centerY }]; }
          handles.forEach(handle => { ctx.fillRect(handle.x - handleOffset, handle.y - handleOffset, handleDrawSize, handleDrawSize); });
          const rotationHandleRadius = 6 / zoomLevel, rotationHandleLineOffset = 25 / zoomLevel;
          const rotationHandleX = centerX, rotationHandleY = table.y - rotationHandleLineOffset - rotationHandleRadius;
          ctx.beginPath(); ctx.arc(rotationHandleX, rotationHandleY, rotationHandleRadius, 0, 2 * Math.PI); ctx.fill();
          ctx.beginPath(); ctx.moveTo(centerX, table.y); ctx.lineTo(rotationHandleX, rotationHandleY);
          ctx.strokeStyle = "#3B82F6"; ctx.lineWidth = 1 / zoomLevel; ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore(); // Restore main context

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(drawFrame);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [ // Dependencies for drawing logic
    tables, selectedTable, hoveredTable, canvasSize, isGridVisible, gridSize, zoomLevel, panOffset,
    showTableLabels, showTableSeats, showTableDimensions, showTableStatus, calculateSeatPositions
  ]);

  // --- Interaction Logic ---

  const screenToCanvas = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (screenX - rect.left - panOffset.x) / zoomLevel, y: (screenY - rect.top - panOffset.y) / zoomLevel };
  }, [panOffset, zoomLevel]);

  const snapToGridValue = useCallback((value: number): number => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  }, [snapToGrid, gridSize]);

  const findTableAtPosition = useCallback((x: number, y: number): Table | null => {
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i]; const rotation = (table.rotation || 0) * (Math.PI / 180);
      const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
      const translatedX = x - centerX, translatedY = y - centerY;
      const rotatedX = translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation);
      const rotatedY = translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation);
      const localX = rotatedX + centerX, localY = rotatedY + centerY;
      if (table.type === "circle") { const radius = table.width / 2; if ((localX - centerX) ** 2 + (localY - centerY) ** 2 <= radius ** 2) return table; }
      else { if (localX >= table.x && localX <= table.x + table.width && localY >= table.y && localY <= table.y + table.height) return table; }
    } return null;
  }, [tables]);

  const findResizeHandleAtPosition = useCallback((x: number, y: number): string | null => {
    if (!selectedTable) return null;
    const handleHitboxSize = 20 / zoomLevel; const table = selectedTable;
    const rotation = (table.rotation || 0) * (Math.PI / 180);
    const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
    const translatedX = x - centerX, translatedY = y - centerY;
    const rotatedX = translatedX * Math.cos(-rotation) - translatedY * Math.sin(-rotation);
    const rotatedY = translatedX * Math.sin(-rotation) + translatedY * Math.cos(-rotation);
    const localX = rotatedX + centerX, localY = rotatedY + centerY;
    let handles: { x: number; y: number; dir: string }[] = [];
    if (table.type === "circle") { const radius = table.width / 2; handles = [{ x: centerX, y: table.y, dir: "tc" }, { x: table.x + table.width, y: centerY, dir: "rc" }, { x: centerX, y: table.y + table.height, dir: "bc" }, { x: table.x, y: centerY, dir: "lc" }]; }
    else { handles = [{ x: table.x, y: table.y, dir: "tl" }, { x: centerX, y: table.y, dir: "tc" }, { x: table.x + table.width, y: table.y, dir: "tr" }, { x: table.x + table.width, y: centerY, dir: "rc" }, { x: table.x + table.width, y: table.y + table.height, dir: "br" }, { x: centerX, y: table.y + table.height, dir: "bc" }, { x: table.x, y: table.y + table.height, dir: "bl" }, { x: table.x, y: centerY, dir: "lc" }]; }
    for (const handle of handles) { if (localX >= handle.x - handleHitboxSize / 2 && localX <= handle.x + handleHitboxSize / 2 && localY >= handle.y - handleHitboxSize / 2 && localY <= handle.y + handleHitboxSize / 2) return handle.dir; }
    return null;
  }, [selectedTable, zoomLevel]);

  const findRotationHandleAtPosition = useCallback((x: number, y: number): boolean => {
    if (!selectedTable) return false;
    const handleHitboxRadius = 15 / zoomLevel; const table = selectedTable;
    const rotation = (table.rotation || 0) * (Math.PI / 180);
    const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
    const rotationHandleDrawRadius = 6 / zoomLevel, rotationHandleLineOffset = 25 / zoomLevel;
    const handleOffsetX_unrotated = 0, handleOffsetY_unrotated = - (table.height / 2) - rotationHandleLineOffset - rotationHandleDrawRadius;
    const cosR = Math.cos(rotation), sinR = Math.sin(rotation);
    const handleCenterX = centerX + (handleOffsetX_unrotated * cosR - handleOffsetY_unrotated * sinR);
    const handleCenterY = centerY + (handleOffsetX_unrotated * sinR + handleOffsetY_unrotated * cosR);
    return (x - handleCenterX) ** 2 + (y - handleCenterY) ** 2 <= handleHitboxRadius ** 2;
  }, [selectedTable, zoomLevel]);

  // Cursor style helpers
  const getDiagonalResizeCursor = useCallback((angle: number, baseCursor: 'nwse' | 'nesw'): string => {
      const normalizedAngle = ((angle % 180) + 180) % 180;
      if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) return baseCursor === 'nwse' ? 'ns-resize' : 'ew-resize';
      if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) return baseCursor === 'nwse' ? 'nesw-resize' : 'nwse-resize';
      if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) return baseCursor === 'nwse' ? 'ew-resize' : 'ns-resize';
      return `${baseCursor}-resize`;
  }, []);
  const getStraightResizeCursor = useCallback((angle: number, baseCursor: 'ns' | 'ew'): string => {
      const normalizedAngle = ((angle % 180) + 180) % 180;
      if (normalizedAngle > 22.5 && normalizedAngle <= 67.5) return baseCursor === 'ns' ? 'nesw-resize' : 'nwse-resize';
      if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) return baseCursor === 'ns' ? 'ew-resize' : 'ns-resize';
      if (normalizedAngle > 112.5 && normalizedAngle <= 157.5) return baseCursor === 'ns' ? 'nwse-resize' : 'nesw-resize';
      return `${baseCursor}-resize`;
  }, []);

  // Throttled mouse move handler
  const handleMouseMoveThrottled = useMemo(
      () => throttle((e: React.MouseEvent<HTMLCanvasElement>) => {
          const { x, y } = screenToCanvas(e.clientX, e.clientY);
          const canvas = canvasRef.current; if (!canvas) return;

          if (isPanning) { /* ... panning logic ... */ return; }
          if (isRotating && selectedTable) { /* ... rotation logic ... */ return; }
          if (isResizing && selectedTable && resizeDirection) { /* ... resizing logic ... */ return; }
          if (isDragging && selectedTable) { /* ... dragging logic ... */ return; }

          // --- Throttled updates for hover state and cursor ---
          const hoveredTableFound = findTableAtPosition(x, y);
          setHoveredTable(hoveredTableFound?.id || null); // Update hover state

          let cursorStyle = "default";
          if (selectedTable) {
              const resizeDir = findResizeHandleAtPosition(x, y);
              if (resizeDir) { /* ... set resize cursor ... */ }
              else if (findRotationHandleAtPosition(x, y)) { cursorStyle = "grab"; }
              else if (hoveredTableFound?.id === selectedTable.id) { cursorStyle = "move"; }
          } else if (hoveredTableFound) { cursorStyle = "move"; }
          else if (e.ctrlKey || e.metaKey) { cursorStyle = "grab"; }
          canvas.style.cursor = cursorStyle;

      }, 16), // Throttle ~60fps
      [ // Dependencies for throttled logic
          isPanning, panStart, isRotating, selectedTable, rotateStart, initialRotation,
          isResizing, resizeDirection, resizeStart, snapToGrid, gridSize,
          isDragging, dragOffset, screenToCanvas, findTableAtPosition,
          findResizeHandleAtPosition, findRotationHandleAtPosition,
          getDiagonalResizeCursor, getStraightResizeCursor
      ]
  );

  // --- Action Handlers (Add, Delete, Update, Undo/Redo, etc.) ---
  // These remain largely the same, using useCallback where appropriate

  const handleAddTable = useCallback(() => {
    try {
      const tableCount = tables.length + 1;
      const gridOffset = snapToGrid ? gridSize : 20;
      const defaultTable: Table = {
        id: `table-${Date.now()}`,
        type: newTableType,
        // Position new tables in a cascading pattern to avoid overlaps
        x: snapToGridValue(100 + (tableCount % 5) * gridOffset),
        y: snapToGridValue(100 + Math.floor(tableCount / 5) * gridOffset),
        width: newTableType === 'circle' ? 80 : 100,
        height: newTableType === 'circle' ? 80 : (newTableType === 'square' ? 100 : 60),
        seats: 4,
        label: `Table ${tableCount}`,
        rotation: 0,
        status: "available",
        zIndex: 1
      };
      
      // Add to tables array
      setTables(prev => [...prev, defaultTable]);
      
      // Select the new table
      setSelectedTable(defaultTable);
      
      // Add to undo stack
      setUndoStack(prev => [...prev, [...tables]]);
      
      // Clear redo stack
      setRedoStack([]);
      
      toast({
        title: "Table Added",
        description: `${newTableType.charAt(0).toUpperCase() + newTableType.slice(1)} table added to layout.`,
        duration: 2000
      });
      
      logger.info(`Added new ${newTableType} table: ${defaultTable.label}`);
    } catch (error) {
      logger.error("Error adding table:", error);
      toast({
        title: "Error",
        description: "Failed to add table. Please try again.",
        variant: "destructive"
      });
    }
  }, [tables, undoStack, newTableType, snapToGridValue, gridSize, toast, logger]);
  const handleDeleteTable = useCallback(() => {
    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table to delete.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Add current state to undo stack
      setUndoStack(prev => [...prev, [...tables]]);
      
      // Clear redo stack
      setRedoStack([]);
      
      // Remove the table from the tables array
      setTables(prev => prev.filter(t => t.id !== selectedTable.id));
      
      // Clear selection
      setSelectedTable(null);
      
      toast({
        title: "Table Deleted",
        description: `${selectedTable.label} has been removed.`,
        duration: 2000
      });
      
      logger.info(`Deleted table: ${selectedTable.label}`);
    } catch (error) {
      logger.error("Error deleting table:", error);
      toast({
        title: "Error",
        description: "Failed to delete table. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedTable, tables, undoStack, toast, logger]);
  const handleDuplicateTable = useCallback(() => {
    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table to duplicate.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a new table based on the selected one
      const newTable: Table = {
        ...selectedTable,
        id: `table-${Date.now()}`,
        x: selectedTable.x + 20,
        y: selectedTable.y + 20,
        label: `${selectedTable.label} (Copy)`
      };
      
      // Add to undo stack
      setUndoStack(prev => [...prev, [...tables]]);
      
      // Clear redo stack
      setRedoStack([]);
      
      // Add to tables array
      setTables(prev => [...prev, newTable]);
      
      // Select the new table
      setSelectedTable(newTable);
      
      toast({
        title: "Table Duplicated",
        description: `${selectedTable.label} has been duplicated.`,
        duration: 2000
      });
      
      logger.info(`Duplicated table: ${selectedTable.label}`);
    } catch (error) {
      logger.error("Error duplicating table:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate table. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedTable, tables, undoStack, toast, logger]);
  const handleUpdateTable = useCallback((property: keyof Table, value: any) => {
    if (!selectedTable) return;
    
    // Update tables array
    const updatedTables = tables.map(t => {
      if (t.id === selectedTable.id) {
        return { ...t, [property]: value };
      }
      return t;
    });
    
    // Update selected table
    const updatedSelectedTable = { ...selectedTable, [property]: value };
    
    // Update state
    setTables(updatedTables);
    setSelectedTable(updatedSelectedTable);
    
    // We don't add to undo stack on every property change to avoid cluttering
    // Undo stack will be updated on mouse up or property change completion
  }, [selectedTable, tables]);
  const handleUndo = useCallback(() => {
    // Check if we have any actions to undo
    if (undoStack.length <= 1) {
      toast({
        title: "Nothing to Undo",
        description: "No more actions to undo.",
        duration: 1500
      });
      return;
    }
    
    try {
      // Get current state and previous state
      const currentState = [...tables];
      const newStack = [...undoStack];
      newStack.pop(); // Remove current state
      const previousState = newStack[newStack.length - 1];
      
      // Add current state to redo stack
      setRedoStack(prev => [...prev, currentState]);
      
      // Update undo stack
      setUndoStack(newStack);
      
      // Update tables
      setTables(previousState);
      
      // Update selected table or clear selection
      if (selectedTable) {
        const selectedId = selectedTable.id;
        const newSelectedTable = previousState.find(t => t.id === selectedId);
        setSelectedTable(newSelectedTable || null);
      }
      
      toast({
        title: "Undo",
        description: "Last action undone.",
        duration: 1500
      });
      
      logger.info("Undo action performed");
    } catch (error) {
      logger.error("Error performing undo:", error);
      toast({
        title: "Error",
        description: "Failed to undo. Please try again.",
        variant: "destructive"
      });
    }
  }, [undoStack, redoStack, tables, selectedTable, toast, logger]);
  const handleRedo = useCallback(() => {
    // Check if we have any actions to redo
    if (redoStack.length === 0) {
      toast({
        title: "Nothing to Redo",
        description: "No more actions to redo.",
        duration: 1500
      });
      return;
    }
    
    try {
      // Get current state and next state
      const currentState = [...tables];
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.pop();
      
      // Add current state to undo stack
      setUndoStack(prev => [...prev, currentState]);
      
      // Update redo stack
      setRedoStack(newRedoStack);
      
      // Update tables
      setTables(nextState);
      
      // Update selected table or clear selection
      if (selectedTable) {
        const selectedId = selectedTable.id;
        const newSelectedTable = nextState.find(t => t.id === selectedId);
        setSelectedTable(newSelectedTable || null);
      }
      
      toast({
        title: "Redo",
        description: "Action redone.",
        duration: 1500
      });
      
      logger.info("Redo action performed");
    } catch (error) {
      logger.error("Error performing redo:", error);
      toast({
        title: "Error",
        description: "Failed to redo. Please try again.",
        variant: "destructive"
      });
    }
  }, [undoStack, redoStack, tables, selectedTable, toast, logger]);
  const handleBringToFront = useCallback(() => {
    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table to bring to front.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Find highest z-index
      const highestZIndex = Math.max(...tables.map(t => t.zIndex || 0)) + 1;
      
      // Add to undo stack
      setUndoStack(prev => [...prev, [...tables]]);
      
      // Clear redo stack
      setRedoStack([]);
      
      // Update tables
      const updatedTables = tables.map(t => {
        if (t.id === selectedTable.id) {
          return { ...t, zIndex: highestZIndex };
        }
        return t;
      });
      
      // Update state
      setTables(updatedTables);
      setSelectedTable({ ...selectedTable, zIndex: highestZIndex });
      
      toast({
        title: "Bring to Front",
        description: `${selectedTable.label} brought to front.`,
        duration: 1500
      });
      
      logger.info(`Brought table to front: ${selectedTable.label}`);
    } catch (error) {
      logger.error("Error bringing table to front:", error);
      toast({
        title: "Error",
        description: "Failed to bring table to front. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedTable, tables, undoStack, toast, logger]);
  const handleSendToBack = useCallback(() => {
    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table to send to back.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Find lowest z-index
      const lowestZIndex = Math.min(...tables.map(t => t.zIndex || 0)) - 1;
      
      // Add to undo stack
      setUndoStack(prev => [...prev, [...tables]]);
      
      // Clear redo stack
      setRedoStack([]);
      
      // Update tables
      const updatedTables = tables.map(t => {
        if (t.id === selectedTable.id) {
          return { ...t, zIndex: lowestZIndex };
        }
        return t;
      });
      
      // Update state
      setTables(updatedTables);
      setSelectedTable({ ...selectedTable, zIndex: lowestZIndex });
      
      toast({
        title: "Send to Back",
        description: `${selectedTable.label} sent to back.`,
        duration: 1500
      });
      
      logger.info(`Sent table to back: ${selectedTable.label}`);
    } catch (error) {
      logger.error("Error sending table to back:", error);
      toast({
        title: "Error",
        description: "Failed to send table to back. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedTable, tables, undoStack, toast, logger]);
  const handleResetView = useCallback(() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); toast({ title: "View reset", duration: 1500 }); }, [toast]);
  const handleSaveFloorPlan = useCallback(async () => {
    if (!floorPlanId) {
      toast({
        title: "Error",
        description: "No floor plan ID specified. Cannot save tables.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      logger.info(`Saving floor plan ${floorPlanId} with ${tables.length} tables`);
      
      // Convert frontend tables to backend format
      const tablesToSave = tables.map(table => {
        // For tables from backend, use their original IDs
        const isBackendTable = table.id.startsWith('backend-');
        return {
          ...(isBackendTable ? { id: parseInt(table.id.replace('backend-', ''), 10) } : {}),
          name: table.label,
          shape: table.type,
          width: table.width,
          height: table.height,
          position_x: table.x,
          position_y: table.y,
          rotation: table.rotation || 0,
          seat_count: table.seats,
          status: mapFrontendStatusToBackend(table.status || "available"),
          floor_plan_id: floorPlanId,
        };
      });
      
      // Send to API
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tablesToSave),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Reload tables from API to ensure we have latest data
      await loadTables();
      
      toast({
        title: "Success",
        description: `Floor plan saved with ${tables.length} tables.`,
        duration: 3000,
      });
      
      logger.info(`Successfully saved floor plan ${floorPlanId}`);
    } catch (error) {
      logger.error("Error saving floor plan:", error);
      toast({
        title: "Error",
        description: "Failed to save floor plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [tables, floorPlanId, loadTables, toast, logger, mapFrontendStatusToBackend]);

  // --- Mouse/Keyboard Event Handlers ---

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || isResizing || isRotating || isPanning) return; // Prevent click during other interactions
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    if (selectedTable) {
      if (findResizeHandleAtPosition(x, y)) return;
      if (findRotationHandleAtPosition(x, y)) return;
    }
    const clickedTable = findTableAtPosition(x, y);
    setSelectedTable(clickedTable);
  }, [isDragging, isResizing, isRotating, isPanning, selectedTable, screenToCanvas, findResizeHandleAtPosition, findRotationHandleAtPosition, findTableAtPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    if (selectedTable) {
      const resizeDir = findResizeHandleAtPosition(x, y);
      if (resizeDir) {
        setIsResizing(true); setResizeDirection(resizeDir); setResizeStart({ x, y });
        setUndoStack(prev => [...prev, [...tables]]); setRedoStack([]); return;
      }
      if (findRotationHandleAtPosition(x, y)) {
        setIsRotating(true); const centerX = selectedTable.x + selectedTable.width / 2, centerY = selectedTable.y + selectedTable.height / 2;
        setRotateStart(Math.atan2(y - centerY, x - centerX)); setInitialRotation(selectedTable.rotation || 0);
        setUndoStack(prev => [...prev, [...tables]]); setRedoStack([]); return;
      }
    }
    const clickedTable = findTableAtPosition(x, y);
    if (clickedTable) {
      if (!selectedTable || selectedTable.id !== clickedTable.id) { setSelectedTable(clickedTable); }
      setIsDragging(true); setDragOffset({ x: x - clickedTable.x, y: y - clickedTable.y });
      setUndoStack(prev => [...prev, [...tables]]); setRedoStack([]);
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (e.ctrlKey || e.metaKey) {
      setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      setSelectedTable(null);
    }
  }, [screenToCanvas, selectedTable, findResizeHandleAtPosition, findRotationHandleAtPosition, findTableAtPosition, tables]); // Removed state setters from deps

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false); setIsResizing(false); setIsRotating(false); setIsPanning(false);
    if (canvasRef.current) { canvasRef.current.style.cursor = "default"; }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault(); const delta = -e.deltaY; const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor));
    const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
    const pointXBeforeZoom = (mouseX - panOffset.x) / zoomLevel, pointYBeforeZoom = (mouseY - panOffset.y) / zoomLevel;
    const newPanOffsetX = mouseX - pointXBeforeZoom * newZoomLevel, newPanOffsetY = mouseY - pointYBeforeZoom * newZoomLevel;
    setZoomLevel(newZoomLevel); setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
  }, [zoomLevel, panOffset]);

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedTable) handleDeleteTable(); }
      else if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleUndo(); }
      else if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); handleRedo(); }
      else if (e.key === "d" && (e.ctrlKey || e.metaKey) && selectedTable) { e.preventDefault(); handleDuplicateTable(); }
      else if (e.key === "g") setIsGridVisible(prev => !prev);
      else if (e.key === "s") setSnapToGrid(prev => !prev);
      else if (e.key === "r") handleResetView();
      else if (selectedTable && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); const moveDistance = e.shiftKey ? (snapToGrid ? gridSize : 10) : 1;
        let newX = selectedTable.x, newY = selectedTable.y;
        if (e.key === "ArrowLeft") newX -= moveDistance; if (e.key === "ArrowRight") newX += moveDistance;
        if (e.key === "ArrowUp") newY -= moveDistance; if (e.key === "ArrowDown") newY += moveDistance;
        if (snapToGrid && !e.shiftKey) { newX = snapToGridValue(newX); newY = snapToGridValue(newY); }
        setUndoStack(prev => [...prev, [...tables]]); setRedoStack([]);
        setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, x: newX, y: newY } : t));
        setSelectedTable(prev => prev ? { ...prev, x: newX, y: newY } : null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTable, handleDeleteTable, handleUndo, handleRedo, handleDuplicateTable, handleResetView, snapToGrid, gridSize, snapToGridValue, tables]); // Added missing deps

  // --- Render ---

  // Toolbar button component
  const ToolbarButton = ({ icon, label, onClick, disabled = false, active = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; active?: boolean }) => (
    <TooltipProvider delayDuration={300}> <Tooltip> <TooltipTrigger asChild>
      <Button variant={active ? "default" : "outline"} size="icon" onClick={onClick} disabled={disabled || isSaving} className={cn("h-9 w-9", active && "bg-blue-600 text-white hover:bg-blue-700")}>
        {icon} <span className="sr-only">{label}</span>
      </Button>
    </TooltipTrigger> {showTooltips && <TooltipContent>{label}</TooltipContent>} </Tooltip> </TooltipProvider>
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

  // --- Table Saving ---
  const saveTables = useCallback(async (tablesToSave: Table[] = tables) => {
    if (!floorPlanId) {
      logger.error("Cannot save tables: No floor plan ID provided");
      return false;
    }

    setIsSaving(true);
    logger.info(`Saving ${tablesToSave.length} tables to floor plan ${floorPlanId}`);

    try {
      // Convert the frontend tables to mock format before saving
      const mockFormatTables = tablesToSave.map(table => ({
        id: table.id,
        floor_plan_id: floorPlanId,
        label: table.label,
        x: table.x,
        y: table.y,
        width: table.width,
        height: table.height,
        type: table.type,
        seats: table.seats,
        rotation: table.rotation || 0,
        status: table.status || "available"
      }));
      
      // Use mock API to update tables
      await mockAPI.updateTables(floorPlanId, mockFormatTables);
      
      logger.info("Tables saved successfully");
      setUnsavedChanges(false);
      setOriginalTables(JSON.parse(JSON.stringify(tablesToSave)));
      showInternalToast("Floor plan saved successfully", "success");
      return true;
    } catch (error: any) {
      const errorMsg = `Error saving tables: ${error.message}`;
      logger.error(errorMsg);
      showInternalToast("Failed to save floor plan changes", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [floorPlanId, tables, logger, showInternalToast]);

  // Add MAX_UNDO_STATES constant and undoStack state if they don't exist
  const MAX_UNDO_STATES = 20; // Maximum number of undo states to store

  // Add the handleAddTableToUndoStack function to fix linter errors
  const handleAddTableToUndoStack = useCallback((nextState: Table[]) => {
    if (!nextState) return;
    
    setUndoStack(stack => {
      const newStack = [...stack.slice(0, undoPosition + 1), [...nextState]];
      if (newStack.length > MAX_UNDO_STATES) {
        return newStack.slice(newStack.length - MAX_UNDO_STATES);
      }
      return newStack;
    });
    
    setUndoPosition(prev => {
      const newPos = Math.min(prev + 1, MAX_UNDO_STATES - 1);
      return newPos;
    });
  }, [undoPosition]);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800/50 shadow-lg">
         {/* ... Toolbar buttons ... */}
         <div className="flex items-center gap-2">
           <ToolbarButton icon={<Undo2 className="h-4 w-4" />} label="Undo (Ctrl+Z)" onClick={handleUndo} disabled={undoStack.length <= 1 || isSaving} />
           <ToolbarButton icon={<Redo2 className="h-4 w-4" />} label="Redo (Ctrl+Y)" onClick={handleRedo} disabled={redoStack.length === 0 || isSaving} />
           <div className="h-6 border-l border-gray-700 mx-1" />
           <ToolbarButton icon={<Grid className="h-4 w-4" />} label={isGridVisible ? "Hide Grid (G)" : "Show Grid (G)"} onClick={() => setIsGridVisible(prev => !prev)} active={isGridVisible} disabled={isSaving}/>
           <ToolbarButton icon={<Move className="h-4 w-4" />} label={snapToGrid ? "Snap to Grid (S)" : "Free Movement (S)"} onClick={() => setSnapToGrid(prev => !prev)} active={snapToGrid} disabled={isSaving}/>
           <div className="h-6 border-l border-gray-700 mx-1" />
           <ToolbarButton icon={<CircleIcon className="h-4 w-4" />} label="Add Circle Table" onClick={() => { setNewTableType("circle"); handleAddTable(); }} disabled={isSaving}/>
           <ToolbarButton icon={<Square className="h-4 w-4" />} label="Add Square Table" onClick={() => { setNewTableType("square"); handleAddTable(); }} disabled={isSaving}/>
           <ToolbarButton icon={<RectangleHorizontal className="h-4 w-4" />} label="Add Rectangle Table" onClick={() => { setNewTableType("rectangle"); handleAddTable(); }} disabled={isSaving}/>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleResetView} className="text-sm gap-1" disabled={isSaving}>Reset View</Button>
           <Button variant="default" size="sm" onClick={() => saveTables()} className="text-sm gap-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving || isLoading}>
             {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
             {isSaving ? "Saving..." : "Save"}
           </Button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 shadow-lg">
          {isLoading && ( <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-50"> <Loader2 className="h-8 w-8 text-blue-500 animate-spin" /> </div> )}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveThrottled} // Use throttled handler
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
            className={cn("w-full h-auto", (isDragging || isResizing || isRotating || isPanning) ? "" : "cursor-default", isLoading && "opacity-50")}
          />
          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm p-2 rounded-lg border border-gray-800">
             <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.max(0.1, zoomLevel / 1.2))} className="h-8 w-8 text-gray-400"> <span className="text-lg">−</span> </Button>
             <span className="text-sm text-gray-300 min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
             <Button variant="ghost" size="icon" onClick={() => setZoomLevel(Math.min(5, zoomLevel * 1.2))} className="h-8 w-8 text-gray-400"> <span className="text-lg">+</span> </Button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Table Properties */}
          <Collapsible open={isTablesPanelOpen} onOpenChange={setIsTablesPanelOpen} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg">
             {/* ... Collapsible Trigger ... */}
             <CollapsibleTrigger asChild>
               <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50">
                 <div className="flex items-center gap-2"> <Settings className="h-5 w-5 text-gray-400" /> <h3 className="text-lg font-medium">Table Properties</h3> </div>
                 <ChevronRight className={`h-5 w-5 transition-transform ${isTablesPanelOpen ? 'rotate-90' : ''}`} />
               </div>
             </CollapsibleTrigger>
             <CollapsibleContent>
               <div className="p-4 border-t border-gray-800">
                 {selectedTable ? ( <div className="space-y-4"> {/* ... Inputs for label, seats, status, width, height, rotation ... */} </div> )
                 : ( <div className="text-center py-6 text-gray-400"> {/* ... Placeholder text ... */} </div> )}
               </div>
             </CollapsibleContent>
          </Collapsible>
          {/* Display Options */}
          <Collapsible open={isControlsPanelOpen} onOpenChange={setIsControlsPanelOpen} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden shadow-lg">
             {/* ... Collapsible Trigger ... */}
             <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50">
                  <div className="flex items-center gap-2"> <Settings className="h-5 w-5 text-gray-400" /> <h3 className="text-lg font-medium">Display Options</h3> </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${isControlsPanelOpen ? 'rotate-90' : ''}`} />
                </div>
              </CollapsibleTrigger>
             <CollapsibleContent>
               <div className="p-4 border-t border-gray-800 space-y-4"> {/* ... Switches and Slider for grid, snap, labels, etc. ... */} </div>
             </CollapsibleContent>
          </Collapsible>
          {/* Table List */}
          <Card className="bg-gray-900/50 border-gray-800 shadow-lg">
             {/* ... Card Header ... */}
             <div className="p-4 border-b border-gray-800"> <h3 className="text-lg font-medium">Tables</h3> </div>
             <CardContent className="p-0 max-h-[300px] overflow-y-auto">
               {tables.length > 0 ? ( <div className="divide-y divide-gray-800"> {tables.map((table) => ( <div key={table.id} className={cn("p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/50", selectedTable?.id === table.id && "bg-blue-900/20")} onClick={() => setSelectedTable(table)}> {/* ... Table info and status badge ... */} </div> ))} </div> )
               : ( <div className="p-6 text-center text-gray-400"> {/* ... No tables text ... */} </div> )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
