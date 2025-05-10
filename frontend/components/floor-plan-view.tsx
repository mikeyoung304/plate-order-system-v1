// File: frontend/components/floor-plan-view.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  BackendTable,
  mapBackendTableToFrontend,
} from "@/lib/floor-plan-utils"
import { Button } from "@/components/ui/button"

type FloorPlanViewProps = {
  floorPlanId: string
  onSelectTable: (table: Table) => void
}

export function FloorPlanView({ floorPlanId, onSelectTable }: FloorPlanViewProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spotlights, setSpotlights] = useState<{ x: number; y: number; color: string }[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast()

  // Create random spotlight positions
  useEffect(() => {
    const spots = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * canvasSize.width,
      y: Math.random() * canvasSize.height,
      color: i % 2 === 0 ? "teal" : "amber",
    }));
    setSpotlights(spots);
  }, [canvasSize]);

  // Adjust canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(800, containerRef.current.clientWidth - 20);
        setCanvasSize({ width, height: width * 0.75 });
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // --- Data Fetching (non-realtime) ---
  const fetchTables = useCallback(async () => {
    if (!floorPlanId) {
      console.warn("[FloorPlanView] floorPlanId missing.");
      setTables([]); setIsLoading(false); setError(null); return;
    }
    console.log(`[FloorPlanView] Fetching tables for: ${floorPlanId}`);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/floor-plans/${floorPlanId}/tables`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const backendTables: BackendTable[] = await response.json();
      const frontendTables = backendTables.map(mapBackendTableToFrontend);
      console.log(`[FloorPlanView] Loaded ${frontendTables.length} tables.`);
      setTables(frontendTables);
    } catch (err: any) {
      console.error("[FloorPlanView] Error loading tables:", err);
      setError("Failed to load floor plan. Please try refreshing.");
      setTables([]);
      toast({ title: "Error Loading Floor Plan", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [floorPlanId, toast]);

  // Effect for initial load only
  useEffect(() => {
    fetchTables();
    // No real-time subscription anymore - only fetch on mount or when refresh is clicked
  }, [floorPlanId, fetchTables]);

  // Calculate seat positions
  const calculateSeatPositions = useCallback((type: string, x: number, y: number, width: number, height: number, seats: number) => {
    const positions: { x: number; y: number }[] = [];
    const seatOffset = 15; // Fixed offset for simplicity now
    if (type === "circle") {
      const radius = width / 2 + seatOffset;
      const centerX = x + width / 2, centerY = y + height / 2;
      for (let i = 0; i < seats; i++) { const angle = (i / seats) * 2 * Math.PI - Math.PI / 2; positions.push({ x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) }); }
    } else {
      const perimeter = 2 * (width + height); if (seats <= 0) return []; const spacing = perimeter / seats; let currentDistance = spacing / 2;
      for (let i = 0; i < seats; i++) { let posX = 0, posY = 0; if (currentDistance <= width) { posX = x + currentDistance; posY = y - seatOffset; } else if (currentDistance <= width + height) { posX = x + width + seatOffset; posY = y + (currentDistance - width); } else if (currentDistance <= 2 * width + height) { posX = x + width - (currentDistance - width - height); posY = y + height + seatOffset; } else { posX = x - seatOffset; posY = y + height - (currentDistance - 2 * width - height); } positions.push({ x: posX, y: posY }); currentDistance += spacing; }
    } return positions;
  }, []); // Removed zoomLevel dependency

  // Draw the floor plan
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    if (isLoading || error) { if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; } return; }

    const drawFrame = (time: number) => {
      if (!canvasRef.current) return;
      canvas.width = canvasSize.width; canvas.height = canvasSize.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); gradient.addColorStop(0, "rgba(17, 24, 39, 0.95)"); gradient.addColorStop(1, "rgba(10, 15, 25, 0.95)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw tables
      tables.forEach((table) => {
        const isHovered = hoveredTable === table.id;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        const centerX = table.x + table.width / 2, centerY = table.y + table.height / 2;
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(rotationRad); ctx.translate(-centerX, -centerY);

        // Styling
        const baseColor = "rgba(13, 148, 136, 1)"; const hoverColor = "rgba(56, 189, 174, 1)"; const strokeColor = isHovered ? hoverColor : baseColor;
        const gradientStart = isHovered ? "rgba(56, 189, 174, 0.4)" : "rgba(13, 148, 136, 0.25)"; const gradientEnd = isHovered ? "rgba(56, 189, 174, 0.2)" : "rgba(13, 148, 136, 0.15)";
        const tableGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, table.width / 2); tableGradient.addColorStop(0, gradientStart); tableGradient.addColorStop(1, gradientEnd);
        ctx.fillStyle = tableGradient; ctx.strokeStyle = strokeColor; ctx.lineWidth = isHovered ? 2.5 : 1.5;

        // Shadow
        ctx.shadowColor = isHovered ? "rgba(56, 189, 174, 0.5)" : "rgba(0, 0, 0, 0.4)"; ctx.shadowBlur = isHovered ? 20 : 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = isHovered ? 6 : 4;

        // Draw Shape
        const cornerRadius = 8; ctx.beginPath();
        if (table.type === "circle") { ctx.arc(centerX, centerY, table.width / 2, 0, Math.PI * 2); }
        else { ctx.moveTo(table.x + cornerRadius, table.y); ctx.lineTo(table.x + table.width - cornerRadius, table.y); ctx.quadraticCurveTo(table.x + table.width, table.y, table.x + table.width, table.y + cornerRadius); ctx.lineTo(table.x + table.width, table.y + table.height - cornerRadius); ctx.quadraticCurveTo(table.x + table.width, table.y + table.height, table.x + table.width - cornerRadius, table.y + table.height); ctx.lineTo(table.x + cornerRadius, table.y + table.height); ctx.quadraticCurveTo(table.x, table.y + table.height, table.x, table.y + table.height - cornerRadius); ctx.lineTo(table.x, table.y + cornerRadius); ctx.quadraticCurveTo(table.x, table.y, table.x + cornerRadius, table.y); ctx.closePath(); }
        ctx.fill(); ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

        // Draw Label
        ctx.fillStyle = "#ffffff"; ctx.font = isHovered ? "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" : "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.translate(centerX, centerY); ctx.rotate(-rotationRad); ctx.fillText(table.label, 0, 0); ctx.rotate(rotationRad); ctx.translate(-centerX, -centerY);

        // Draw Seats
        const seatRadius = 5; const seatPositions = calculateSeatPositions(table.type, table.x, table.y, table.width, table.height, table.seats);
        seatPositions.forEach((position) => { const seatGradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, seatRadius); const seatStroke = isHovered ? "rgba(56, 189, 174, 0.8)" : "rgba(255, 255, 255, 0.6)"; seatGradient.addColorStop(0, isHovered ? "rgba(56, 189, 174, 0.7)" : "rgba(255, 255, 255, 0.5)"); seatGradient.addColorStop(1, isHovered ? "rgba(56, 189, 174, 0.4)" : "rgba(200, 200, 200, 0.3)"); ctx.fillStyle = seatGradient; ctx.strokeStyle = seatStroke; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(position.x, position.y, seatRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });

        // Hover Pulse Animation
        if (isHovered) { const pulseFrequency = 0.005; const pulseMagnitude = 3; const pulseSize = pulseMagnitude + Math.sin(time * pulseFrequency) * pulseMagnitude; ctx.strokeStyle = "rgba(56, 189, 174, 0.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); if (table.type === "circle") { ctx.arc(centerX, centerY, table.width / 2 + pulseSize, 0, Math.PI * 2); } else { const pulseX = table.x - pulseSize / 2, pulseY = table.y - pulseSize / 2, pulseW = table.width + pulseSize, pulseH = table.height + pulseSize; const pulseRadius = cornerRadius + pulseSize / 2; ctx.moveTo(pulseX + pulseRadius, pulseY); ctx.lineTo(pulseX + pulseW - pulseRadius, pulseY); ctx.quadraticCurveTo(pulseX + pulseW, pulseY, pulseX + pulseW, pulseY + pulseRadius); ctx.lineTo(pulseX + pulseW, pulseY + pulseH - pulseRadius); ctx.quadraticCurveTo(pulseX + pulseW, pulseY + pulseH, pulseX + pulseW - pulseRadius, pulseY + pulseH); ctx.lineTo(pulseX + pulseRadius, pulseY + pulseH); ctx.quadraticCurveTo(pulseX, pulseY + pulseH, pulseX, pulseY + pulseH - pulseRadius); ctx.lineTo(pulseX, pulseY + pulseRadius); ctx.quadraticCurveTo(pulseX, pulseY, pulseX + pulseRadius, pulseY); ctx.closePath(); } ctx.stroke(); }
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };
    animationFrameRef.current = requestAnimationFrame(drawFrame);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; };
  }, [tables, hoveredTable, canvasSize, isLoading, error, spotlights, calculateSeatPositions]);

  // Handle canvas click - Enhanced Hit Detection with rotation support
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("[FloorPlanView] Canvas clicked");
    const canvas = canvasRef.current; if (!canvas || isLoading || error) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY;

    let clickedTable: Table | null = null;
    // Iterate reverse for Z-index
    for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i];
        
        // Enhanced hit detection that better handles rotation
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        
        // Translate point relative to table center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Rotate point in opposite direction of table rotation
        const rotatedX = relX * Math.cos(-rotationRad) - relY * Math.sin(-rotationRad);
        const rotatedY = relX * Math.sin(-rotationRad) + relY * Math.cos(-rotationRad);
        
        // Add buffer for easier clicking
        const buffer = 15; // Increased buffer for better usability
        
        if (table.type === "circle") {
            // For circle, check if point is within radius
            const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
            if (distance <= (table.width / 2) + buffer) {
                clickedTable = table;
                break;
            }
        } else {
            // For rectangles and squares, check if rotated point is within bounds
            if (
                rotatedX >= -table.width / 2 - buffer &&
                rotatedX <= table.width / 2 + buffer &&
                rotatedY >= -table.height / 2 - buffer &&
                rotatedY <= table.height / 2 + buffer
            ) {
                clickedTable = table;
                break;
            }
        }
    }

    if (clickedTable) {
      console.log("[FloorPlanView] Click detected on table:", clickedTable.label);
      onSelectTable(clickedTable);
    } else {
      console.log("[FloorPlanView] Click detected on empty space.");
    }
  };

  // Handle touch - Enhanced Hit Detection matching click detection
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    console.log("[FloorPlanView] Canvas touched");
    const canvas = canvasRef.current; if (!canvas || isLoading || error) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX, y = (touch.clientY - rect.top) * scaleY;

    let touchedTable: Table | null = null;
    // Iterate reverse for Z-index
    for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i];
        
        // Enhanced hit detection that better handles rotation
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        
        // Translate point relative to table center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Rotate point in opposite direction of table rotation
        const rotatedX = relX * Math.cos(-rotationRad) - relY * Math.sin(-rotationRad);
        const rotatedY = relX * Math.sin(-rotationRad) + relY * Math.cos(-rotationRad);
        
        // Larger buffer for touch
        const buffer = 25;
        
        if (table.type === "circle") {
            // For circle, check if point is within radius
            const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
            if (distance <= (table.width / 2) + buffer) {
                touchedTable = table;
                break;
            }
        } else {
            // For rectangles and squares, check if rotated point is within bounds
            if (
                rotatedX >= -table.width / 2 - buffer &&
                rotatedX <= table.width / 2 + buffer &&
                rotatedY >= -table.height / 2 - buffer &&
                rotatedY <= table.height / 2 + buffer
            ) {
                touchedTable = table;
                break;
            }
        }
    }

    if (touchedTable) {
      console.log("[FloorPlanView] Touch detected on table:", touchedTable.label);
      setHoveredTable(touchedTable.id); // Show hover effect
      onSelectTable(touchedTable);
    } else {
      console.log("[FloorPlanView] Touch detected on empty space.");
      setHoveredTable(null);
    }
  };

  // Handle mouse move for hover effects with improved detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas || isLoading || error) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY;

    let hoveredTableId: string | null = null;
    // Find hovered table (iterate reverse for Z-index) - Using enhanced detection
    for (let i = tables.length - 1; i >= 0; i--) {
        const table = tables[i];
        
        // Enhanced hit detection that handles rotation
        const centerX = table.x + table.width / 2;
        const centerY = table.y + table.height / 2;
        const rotationRad = (table.rotation || 0) * (Math.PI / 180);
        
        // Translate point relative to table center
        const relX = x - centerX;
        const relY = y - centerY;
        
        // Rotate point in opposite direction of table rotation
        const rotatedX = relX * Math.cos(-rotationRad) - relY * Math.sin(-rotationRad);
        const rotatedY = relX * Math.sin(-rotationRad) + relY * Math.cos(-rotationRad);
        
        // Small buffer for hover
        const buffer = 5;
        
        if (table.type === "circle") {
            // For circle, check if point is within radius
            const distance = Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY);
            if (distance <= (table.width / 2) + buffer) {
                hoveredTableId = table.id;
                break;
            }
        } else {
            // For rectangles and squares, check if rotated point is within bounds
            if (
                rotatedX >= -table.width / 2 - buffer &&
                rotatedX <= table.width / 2 + buffer &&
                rotatedY >= -table.height / 2 - buffer &&
                rotatedY <= table.height / 2 + buffer
            ) {
                hoveredTableId = table.id;
                break;
            }
        }
    }
    // Only update state if hover actually changes to prevent unnecessary re-renders
    if (hoveredTableId !== hoveredTable) {
        setHoveredTable(hoveredTableId);
    }
  };

  // --- JSX Rendering ---
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div
        ref={containerRef}
        className="relative w-full bg-gray-900/70 border border-gray-700/50 rounded-xl shadow-lg overflow-hidden aspect-[4/3]"
        style={{ height: canvasSize.height }}
      >
        {/* Header with refresh button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50 bg-gray-900/80">
          <h3 className="text-gray-200 text-sm font-medium">Floor Plan</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-gray-200"
            onClick={fetchTables}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Loading State Skeleton */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20 p-4"
            >
              <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-4 p-4">
                <Skeleton className="w-full h-full rounded-lg bg-gray-700/50 animate-pulse" />
                <Skeleton className="w-full h-full rounded-full bg-gray-700/50 col-start-3 animate-pulse" />
                <Skeleton className="w-full h-full rounded-lg bg-gray-700/50 row-start-2 col-span-2 animate-pulse" />
                <Skeleton className="w-full h-full rounded-full bg-gray-700/50 row-start-2 col-start-3 animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {!isLoading && error && (
            <motion.div
              key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 backdrop-blur-sm z-20 p-4 text-center"
            >
              <Info className="h-10 w-10 text-red-300 mb-3" />
              <p className="text-lg font-medium text-red-200 mb-1">Error Loading Floor Plan</p>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <Button onClick={() => { setIsLoading(true); fetchTables(); }} variant="destructive" size="sm">Retry</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table count */}
        {!isLoading && !error && tables.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700">
              {tables.length} {tables.length === 1 ? 'table' : 'tables'}
            </Badge>
          </div>
        )}

        {/* Canvas for drawing */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTable(null)}
          onTouchStart={handleTouchStart}
          className={`absolute inset-0 transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
          aria-label="Floor plan"
        />

        {/* Instructions Overlay */}
        {!isLoading && !error && tables.length > 0 && (
           <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-gray-900/60 px-2 py-1 rounded pointer-events-none">
               Click on a table to select it
           </div>
        )}
      </div>
    </motion.div>
  )
}
