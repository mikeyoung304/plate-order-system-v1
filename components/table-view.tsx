"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

type TableViewProps = {
  table: {
    id: string
    type: "circle" | "rectangle" | "square"
    x: number
    y: number
    width: number
    height: number
    seats: number
    label: string
  }
  onSelectSeat: (seatNumber: number) => void
}

export function TableView({ table, onSelectSeat }: TableViewProps) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null)

  // Generate seats based on table type and size
  const generateSeats = () => {
    const seats = []
    const { type, width, height, seats: seatCount } = table

    // Calculate seat size based on table dimensions
    const seatSize = Math.min(width, height) * 0.2

    if (type === "circle") {
      // For circular tables, arrange seats in a circle
      const radius = (Math.min(width, height) / 2) * 0.8 // 80% of radius for better spacing
      const centerX = width / 2
      const centerY = height / 2

      for (let i = 0; i < seatCount; i++) {
        // Calculate position on the circle
        const angle = (i / seatCount) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle) - seatSize / 2
        const y = centerY + radius * Math.sin(angle) - seatSize / 2

        seats.push({
          number: i + 1,
          x,
          y,
          size: seatSize,
        })
      }
    } else if (type === "rectangle" || type === "square") {
      // For rectangular tables, distribute seats around the perimeter
      const tableRatio = width / height

      // Calculate how many seats to place on each side based on the table's aspect ratio
      let seatsPerLongSide, seatsPerShortSide

      if (tableRatio >= 1) {
        // Wider than tall
        seatsPerLongSide = Math.ceil(seatCount * (tableRatio / (2 * tableRatio + 2)))
        seatsPerShortSide = Math.ceil((seatCount - 2 * seatsPerLongSide) / 2)
        if (seatsPerShortSide < 0) seatsPerShortSide = 0
      } else {
        // Taller than wide
        seatsPerShortSide = Math.ceil(seatCount * (1 / tableRatio / (2 * (1 / tableRatio) + 2)))
        seatsPerLongSide = Math.ceil((seatCount - 2 * seatsPerShortSide) / 2)
        if (seatsPerLongSide < 0) seatsPerLongSide = 0
      }

      // Ensure we don't exceed the total seat count
      const totalSeats = 2 * seatsPerLongSide + 2 * seatsPerShortSide
      let adjustedSeatsPerLongSide = seatsPerLongSide
      let adjustedSeatsPerShortSide = seatsPerShortSide

      if (totalSeats > seatCount) {
        const excess = totalSeats - seatCount
        if (seatsPerLongSide >= excess) {
          adjustedSeatsPerLongSide = seatsPerLongSide - Math.ceil(excess / 2)
        } else {
          adjustedSeatsPerShortSide = Math.max(0, seatsPerShortSide - Math.ceil((excess - seatsPerLongSide) / 2))
        }
      }

      let seatNumber = 1

      // Top side (short)
      for (let i = 0; i < adjustedSeatsPerShortSide && seatNumber <= seatCount; i++) {
        const spacing = width / (adjustedSeatsPerShortSide + 1)
        seats.push({
          number: seatNumber++,
          x: spacing * (i + 1) - seatSize / 2,
          y: -seatSize * 1.2,
          size: seatSize,
        })
      }

      // Right side (long)
      for (let i = 0; i < adjustedSeatsPerLongSide && seatNumber <= seatCount; i++) {
        const spacing = height / (adjustedSeatsPerLongSide + 1)
        seats.push({
          number: seatNumber++,
          x: width - seatSize / 2,
          y: spacing * (i + 1) - seatSize / 2,
          size: seatSize,
        })
      }

      // Bottom side (short)
      for (let i = 0; i < adjustedSeatsPerShortSide && seatNumber <= seatCount; i++) {
        const spacing = width / (adjustedSeatsPerShortSide + 1)
        seats.push({
          number: seatNumber++,
          x: width - spacing * (i + 1) - seatSize / 2,
          y: height - seatSize / 2,
          size: seatSize,
        })
      }

      // Left side (long)
      for (let i = 0; i < adjustedSeatsPerLongSide && seatNumber <= seatCount; i++) {
        const spacing = height / (adjustedSeatsPerLongSide + 1)
        seats.push({
          number: seatNumber++,
          x: -seatSize * 1.2,
          y: height - spacing * (i + 1) - seatSize / 2,
          size: seatSize,
        })
      }
    }

    return seats
  }

  const seats = generateSeats()

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-8" style={{ width: `${table.width}px`, height: `${table.height}px` }}>
        {/* Table */}
        <div
          className={`absolute inset-0 bg-gray-800 border-2 border-gray-700 ${
            table.type === "circle" ? "rounded-full" : "rounded-lg"
          }`}
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400 font-medium">{table.label}</span>
          </div>
        </div>

        {/* Seats */}
        {seats.map((seat) => (
          <motion.div
            key={seat.number}
            className="absolute"
            style={{
              left: `${seat.x}px`,
              top: `${seat.y}px`,
              width: `${seat.size}px`,
              height: `${seat.size}px`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className={`w-full h-full rounded-full ${
                hoveredSeat === seat.number ? "bg-primary hover:bg-primary/90" : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => onSelectSeat(seat.number)}
              onMouseEnter={() => setHoveredSeat(seat.number)}
              onMouseLeave={() => setHoveredSeat(null)}
            >
              {seat.number}
            </Button>
          </motion.div>
        ))}
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <p className="text-center text-sm text-muted-foreground">Select a seat to place an order for {table.label}</p>
        </CardContent>
      </Card>
    </div>
  )
}
