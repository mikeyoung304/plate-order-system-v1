"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TableType = {
  id: string
  type: "circle" | "rectangle" | "square"
  x: number
  y: number
  width: number
  height: number
  seats: number
  label: string
}

type TableListProps = {
  floorPlanId: string
}

export function TableList({ floorPlanId }: TableListProps) {
  const [tables, setTables] = useState<TableType[]>([])

  // Load tables from localStorage
  useEffect(() => {
    try {
      const savedTables = localStorage.getItem("tables")
      if (savedTables) {
        const allTables = JSON.parse(savedTables)
        if (allTables[floorPlanId]) {
          setTables(allTables[floorPlanId])
        }
      }
    } catch (error) {
      console.error("Error loading tables:", error)
    }
  }, [floorPlanId])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tables</h2>

      {tables.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No tables added yet.</p>
          <p className="text-sm text-muted-foreground">Go to the Floor Plan Editor tab to add tables.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.label}</TableCell>
                  <TableCell className="capitalize">{table.type}</TableCell>
                  <TableCell>{table.seats}</TableCell>
                  <TableCell>
                    {table.width} x {table.height}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
