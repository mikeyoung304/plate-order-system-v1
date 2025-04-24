"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Table = {
  id: string
  type: "circle" | "rectangle" | "square"
  x: number
  y: number
  width: number
  height: number
  seats: number
  label: string
}

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
  const { toast } = useToast()

  // Create random spotlight positions with colors
  useEffect(() => {
    const spots = []
    for (let i = 0; i < 5; i++) {
      spots.push({
        x: Math.random() * canvasSize.width,
        y: Math.random() * canvasSize.height,
        color: i % 2 === 0 ? "teal" : "amber", // Alternate between teal and amber
      })
    }
    setSpotlights(spots)
  }, [canvasSize])

  // Adjust canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = Math.min(800, containerRef.current.clientWidth - 20)
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
  }, [floorPlanId])

  // Load tables from localStorage
  useEffect(() => {
    setIsLoading(true)
    setError(null)

    try {
      const savedTables = localStorage.getItem("tables")
      if (savedTables) {
        const allTables = JSON.parse(savedTables)
        if (allTables[floorPlanId]) {
          setTables(allTables[floorPlanId])
        } else {
          // Create a default table if none exists
          const defaultTable: Table = {
            id: `table-${Date.now()}`,
            type: "circle",
            x: 200,
            y: 200,
            width: 100,
            height: 100,
            seats: 4,
            label: "Table 1",
          }

          const updatedTables = {
            ...allTables,
            [floorPlanId]: [defaultTable],
          }

          localStorage.setItem("tables", JSON.stringify(updatedTables))
          setTables([defaultTable])
        }
      } else {
        // Initialize with a default table
        const defaultTable: Table = {
          id: `table-${Date.now()}`,
          type: "circle",
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          seats: 4,
          label: "Table 1",
        }

        const initialTables = {
          [floorPlanId]: [defaultTable],
        }

        localStorage.setItem("tables", JSON.stringify(initialTables))
        setTables([defaultTable])
      }
    } catch (error) {
      console.error("Error loading tables:", error)
      setError("Failed to load floor plan data. Please try again.")

      // Create a default table if there's an error
      const defaultTable: Table = {
        id: `table-${Date.now()}`,
        type: "circle",
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        seats: 4,
        label: "Table 1",
      }
      setTables([defaultTable])
    } finally {
      setIsLoading(false)
    }
  }, [floorPlanId])

  // Draw the floor plan
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isLoading) return

    // Set canvas dimensions
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw sophisticated lounge background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "rgba(17, 24, 39, 0.95)")
    gradient.addColorStop(1, "rgba(10, 15, 25, 0.95)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw subtle pattern
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)"
    const patternSize = 20
    for (let x = 0; x < canvas.width; x += patternSize) {
      for (let y = 0; y < canvas.height; y += patternSize) {
        if ((x + y) % (patternSize * 2) === 0) {
          ctx.fillRect(x, y, patternSize / 2, patternSize / 2)
        }
      }
    }

    // Draw subtle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"
    ctx.lineWidth = 1

    // Draw vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw spotlights
    spotlights.forEach((spot) => {
      const spotGradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 150)

      if (spot.color === "teal") {
        spotGradient.addColorStop(0, "rgba(13, 148, 136, 0.1)")
        spotGradient.addColorStop(1, "rgba(13, 148, 136, 0)")
      } else {
        spotGradient.addColorStop(0, "rgba(245, 158, 11, 0.1)")
        spotGradient.addColorStop(1, "rgba(245, 158, 11, 0)")
      }

      ctx.fillStyle = spotGradient
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, 150, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw tables
    tables.forEach((table) => {
      const isHovered = hoveredTable === table.id

      // Create gradient for tables
      const tableGradient = ctx.createRadialGradient(
        table.x + table.width / 2,
        table.y + table.height / 2,
        0,
        table.x + table.width / 2,
        table.y + table.height / 2,
        table.width / 2,
      )

      if (isHovered) {
        tableGradient.addColorStop(0, "rgba(13, 148, 136, 0.4)")
        tableGradient.addColorStop(1, "rgba(13, 148, 136, 0.2)")
        ctx.strokeStyle = "rgba(13, 148, 136, 0.8)"
      } else {
        tableGradient.addColorStop(0, "rgba(13, 148, 136, 0.25)")
        tableGradient.addColorStop(1, "rgba(13, 148, 136, 0.15)")
        ctx.strokeStyle = "rgba(13, 148, 136, 0.4)"
      }

      ctx.fillStyle = tableGradient
      ctx.lineWidth = isHovered ? 2 : 1.5

      // Draw table with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 5

      if (table.type === "circle") {
        const radius = table.width / 2
        ctx.beginPath()
        ctx.arc(table.x + radius, table.y + radius, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      } else {
        // Add rounded corners for rectangles and squares
        const radius = 8
        ctx.beginPath()
        ctx.moveTo(table.x + radius, table.y)
        ctx.lineTo(table.x + table.width - radius, table.y)
        ctx.quadraticCurveTo(table.x + table.width, table.y, table.x + table.width, table.y + radius)
        ctx.lineTo(table.x + table.width, table.y + table.height - radius)
        ctx.quadraticCurveTo(
          table.x + table.width,
          table.y + table.height,
          table.x + table.width - radius,
          table.y + table.height,
        )
        ctx.lineTo(table.x + radius, table.y + table.height)
        ctx.quadraticCurveTo(table.x, table.y + table.height, table.x, table.y + table.height - radius)
        ctx.lineTo(table.x, table.y + radius)
        ctx.quadraticCurveTo(table.x, table.y, table.x + radius, table.y)
        ctx.fill()
        ctx.stroke()
      }

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw table label with glow effect
      if (isHovered) {
        ctx.shadowColor = "rgba(13, 148, 136, 0.7)"
        ctx.shadowBlur = 10
      } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
        ctx.shadowBlur = 3
      }

      ctx.fillStyle = "#ffffff"
      ctx.font = isHovered ? "bold 15px var(--font-sans)" : "14px var(--font-sans)"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(table.label, table.x + table.width / 2, table.y + table.height / 2)

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0

      // Draw seat indicators
      const seatRadius = 4
      const seatPositions = calculateSeatPositions(table.type, table.x, table.y, table.width, table.height, table.seats)

      // Draw seats
      seatPositions.forEach((position) => {
        // Create seat gradient
        const seatGradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, seatRadius)

        if (isHovered) {
          seatGradient.addColorStop(0, "rgba(13, 148, 136, 0.7)")
          seatGradient.addColorStop(1, "rgba(13, 148, 136, 0.4)")
          ctx.strokeStyle = "rgba(13, 148, 136, 0.8)"
        } else {
          seatGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)")
          seatGradient.addColorStop(1, "rgba(200, 200, 200, 0.3)")
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
        }

        ctx.fillStyle = seatGradient
        ctx.lineWidth = 1

        // Add subtle shadow to seats
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
        ctx.shadowBlur = 3
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1

        ctx.beginPath()
        ctx.arc(position.x, position.y, seatRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Reset shadow
        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      })

      // Add a subtle pulsing effect to hovered tables
      if (isHovered) {
        const pulseSize = 4 + Math.sin(Date.now() / 300) * 2 // Pulsing effect
        ctx.strokeStyle = "rgba(13, 148, 136, 0.4)"
        ctx.lineWidth = 1

        if (table.type === "circle") {
          const radius = table.width / 2
          ctx.beginPath()
          ctx.arc(table.x + radius, table.y + radius, radius + pulseSize, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.rect(table.x - pulseSize / 2, table.y - pulseSize / 2, table.width + pulseSize, table.height + pulseSize)
          ctx.stroke()
        }
      }
    })

    // Add instructions
    if (tables.length > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.font = "12px var(--font-sans)"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText("Click on a table to select it", canvas.width / 2, canvas.height - 10)
    }
  }, [tables, hoveredTable, canvasSize, isLoading, spotlights])

  // Calculate seat positions for visual indicators
  const calculateSeatPositions = (
    tableType: string,
    tableX: number,
    tableY: number,
    tableWidth: number,
    tableHeight: number,
    numSeats: number,
  ) => {
    const positions = []

    if (tableType === "circle") {
      const centerX = tableX + tableWidth / 2
      const centerY = tableY + tableHeight / 2
      const radius = tableWidth / 2

      for (let i = 0; i < numSeats; i++) {
        const angle = (i * 2 * Math.PI) / numSeats - Math.PI / 2 // Start from top
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        positions.push({ x, y })
      }
    } else if (tableType === "square" || tableType === "rectangle") {
      // Distribute seats around the rectangle
      const seatsPerSide = Math.ceil(numSeats / 4)
      let seatCount = 0

      // Top side
      const topSeats = Math.min(seatsPerSide, numSeats - seatCount)
      for (let i = 0; i < topSeats; i++) {
        const x = tableX + ((i + 1) * tableWidth) / (topSeats + 1)
        const y = tableY
        positions.push({ x, y })
        seatCount++
      }

      // Right side
      const rightSeats = Math.min(seatsPerSide, numSeats - seatCount)
      for (let i = 0; i < rightSeats; i++) {
        const x = tableX + tableWidth
        const y = tableY + ((i + 1) * tableHeight) / (rightSeats + 1)
        positions.push({ x, y })
        seatCount++
      }

      // Bottom side
      const bottomSeats = Math.min(seatsPerSide, numSeats - seatCount)
      for (let i = 0; i < bottomSeats; i++) {
        const x = tableX + tableWidth - ((i + 1) * tableWidth) / (bottomSeats + 1)
        const y = tableY + tableHeight
        positions.push({ x, y })
        seatCount++
      }

      // Left side
      const leftSeats = Math.min(seatsPerSide, numSeats - seatCount)
      for (let i = 0; i < leftSeats; i++) {
        const x = tableX
        const y = tableY + tableHeight - ((i + 1) * tableHeight) / (leftSeats + 1)
        positions.push({ x, y })
        seatCount++
      }
    }

    return positions
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // Calculate the scale factor for responsive canvas
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Get the actual position on the canvas
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Check if clicked on a table with improved hit detection
    for (const table of tables) {
      if (table.type === "circle") {
        const radius = table.width / 2
        const centerX = table.x + radius
        const centerY = table.y + radius
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        // Increase the hit area significantly (50% larger than radius)
        if (distance <= radius * 1.5) {
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }

          toast({
            title: `Table ${table.label} selected`,
            description: "Loading table view...",
            duration: 2000,
          })

          onSelectTable(table)
          return
        }
      } else {
        // Add a much larger buffer around rectangle/square tables (30px)
        const buffer = 30
        if (
          x >= table.x - buffer &&
          x <= table.x + table.width + buffer &&
          y >= table.y - buffer &&
          y <= table.y + table.height + buffer
        ) {
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }

          toast({
            title: `Table ${table.label} selected`,
            description: "Loading table view...",
            duration: 2000,
          })

          onSelectTable(table)
          return
        }
      }
    }
  }

  // Handle touch for mobile/tablet with improved accuracy
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent default behavior

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]

    // Calculate the scale factor for responsive canvas
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Get the actual position on the canvas
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY

    // Check if touched on a table with improved hit detection
    for (const table of tables) {
      if (table.type === "circle") {
        const radius = table.width / 2
        const centerX = table.x + radius
        const centerY = table.y + radius
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        // Increase the hit area significantly for touch (60% larger than radius)
        if (distance <= radius * 1.6) {
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }

          toast({
            title: `Table ${table.label} selected`,
            description: "Loading table view...",
            duration: 2000,
          })

          onSelectTable(table)
          return
        }
      } else {
        // Add a much larger buffer around rectangle/square tables for touch (40px)
        const buffer = 40
        if (
          x >= table.x - buffer &&
          x <= table.x + table.width + buffer &&
          y >= table.y - buffer &&
          y <= table.y + table.height + buffer
        ) {
          // Add haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }

          toast({
            title: `Table ${table.label} selected`,
            description: "Loading table view...",
            duration: 2000,
          })

          onSelectTable(table)
          return
        }
      }
    }
  }

  // Handle mouse move for hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Check if mouse is over a table
    let hoveredTableId = null

    for (const table of tables) {
      if (table.type === "circle") {
        const radius = table.width / 2
        const centerX = table.x + radius
        const centerY = table.y + radius
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

        if (distance <= radius * 1.2) {
          hoveredTableId = table.id
          break
        }
      } else {
        const buffer = 15
        if (
          x >= table.x - buffer &&
          x <= table.x + table.width + buffer &&
          y >= table.y - buffer &&
          y <= table.y + table.height + buffer
        ) {
          hoveredTableId = table.id
          break
        }
      }
    }

    setHoveredTable(hoveredTableId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[450px] w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-gray-700/30 rounded-lg bg-gray-800/40">
        <Info className="h-10 w-10 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2 text-white">Error Loading Floor Plan</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-teal-400 hover:underline">
          Refresh Page
        </button>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-gray-700/30 rounded-lg bg-gray-800/40">
        <Info className="h-10 w-10 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2 text-white">No Tables Found</h3>
        <p className="text-gray-400 mb-4">Please go to the Admin view to create tables first.</p>
        <a href="/admin" className="text-teal-400 hover:underline">
          Go to Admin
        </a>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div
        ref={containerRef}
        className="relative border border-gray-700/30 rounded-lg overflow-hidden transition-all duration-200"
      >
        {/* Ambient lighting effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-950/50 pointer-events-none"></div>

        {/* Spotlights */}
        {spotlights.map((spot, i) => (
          <div
            key={i}
            className={`absolute w-[300px] h-[300px] rounded-full pointer-events-none opacity-20 ${
              spot.color === "teal"
                ? "bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.3),transparent_70%)]"
                : "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.3),transparent_70%)]"
            }`}
            style={{
              left: `${(spot.x / canvasSize.width) * 100}%`,
              top: `${(spot.y / canvasSize.height) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>
        ))}

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onMouseMove={handleMouseMove}
          className="w-full h-auto cursor-pointer"
        />

        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-center gap-2 flex-wrap">
            <AnimatePresence>
              {tables.map((table, index) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Badge
                    variant={hoveredTable === table.id ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      hoveredTable === table.id
                        ? "bg-teal-600 hover:bg-teal-700 border-teal-500"
                        : "hover:bg-teal-900/30 border-teal-700/50"
                    }`}
                    onClick={() => {
                      onSelectTable(table)
                      toast({
                        title: `Table ${table.label} selected`,
                        description: "Loading table view...",
                        duration: 2000,
                      })
                    }}
                  >
                    {table.label}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
