"use client"

import { useState, useEffect, useRef } from "react"
import { Shell } from "@/components/shell"
import { PageHeaderWithTime } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Clock,
  CheckCircle,
  Timer,
  AlertCircle,
  Coffee,
  Utensils,
  Cake,
  Volume2,
  VolumeX,
  Layers,
  Filter,
  RefreshCw,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"

// Define types for our data structures
type OrderItem = {
  id: string
  name: string
  modifiers: string[]
  status: "new" | "cooking" | "ready" | "delayed"
  timeElapsed?: string
  startTime: number
  estimatedTime: number
  station: "grill" | "fry" | "salad" | "dessert" | "bar" | "appetizer" | "main"
  course: "appetizer" | "main" | "dessert" | "drink"
  priority: "normal" | "high" | "rush"
}

type Order = {
  id: string
  table: string
  seat: number
  items: OrderItem[]
  status: "new" | "cooking" | "ready" | "delayed"
  timeReceived: string
  timeElapsed: string
  timeReady?: string
  startTime: number
  priority: "normal" | "high" | "rush"
  server: string
  notes?: string
  type: "dine-in" | "takeout" | "room-service" | "memory-care"
  course: "appetizer" | "main" | "dessert" | "drink"
  fired: boolean
}

export default function KitchenPage() {
  // State management
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [activeRole, setActiveRole] = useState("all")
  const [activeStation, setActiveStation] = useState("all")
  const [activeCourse, setActiveCourse] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [syncMode, setSyncMode] = useState<"individual" | "all">("all")
  const [showDelayed, setShowDelayed] = useState(true)

  // Refs
  const alertSoundRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Initialize audio for notifications
  useEffect(() => {
    alertSoundRef.current = new Audio("/alert.mp3")
    return () => {
      if (alertSoundRef.current) {
        alertSoundRef.current.pause()
        alertSoundRef.current = null
      }
    }
  }, [])

  // Auto-refresh timer to update elapsed times
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        updateElapsedTimes()
        checkForDelayedOrders()
      }, 10000) // Update every 10 seconds
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoRefresh, orders])

  // Load orders from localStorage or mock data
  useEffect(() => {
    setIsLoading(true)

    // Simulate API call with timeout
    setTimeout(() => {
      try {
        const savedOrdersJSON = localStorage.getItem("pendingOrders")
        if (savedOrdersJSON) {
          const savedOrders = JSON.parse(savedOrdersJSON)
          const processedOrders = processOrders(savedOrders)
          setOrders(processedOrders)
        } else {
          // Use mock data if no saved orders
          setOrders(generateMockOrders())
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        setOrders(generateMockOrders())
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }, [])

  // Process orders to add necessary data
  const processOrders = (rawOrders: any[]): Order[] => {
    const now = Date.now()

    return rawOrders
      .map((order) => {
        // Ensure order has all required properties
        if (!order) return null

        // Calculate time elapsed
        const receivedTime = order.timeReceived ? new Date(order.timeReceived).getTime() : now
        const diffMinutes = Math.floor((now - receivedTime) / (1000 * 60))

        // Process items to ensure they have all required properties
        const processedItems = (order.items || []).map((item: any, index: number) => ({
          id: item.id || `item-${order.id}-${index}`,
          name: item.name || "Unknown Item",
          modifiers: item.modifiers || [],
          status: item.status || "new",
          startTime: item.startTime || now,
          estimatedTime: item.estimatedTime || getEstimatedTime(item.name || ""),
          station: item.station || assignStation(item.name || ""),
          course: item.course || determineCourse(item.name || ""),
          priority: order.priority || "normal",
        }))

        return {
          id: order.id || `order-${Date.now()}`,
          table: order.table || "Unknown Table",
          seat: order.seat || 1,
          items: processedItems,
          status: order.status || "new",
          timeReceived: order.timeReceived || new Date().toISOString(),
          timeElapsed: `${diffMinutes}m`,
          startTime: receivedTime,
          priority: order.priority || "normal",
          server: order.server || "Unknown",
          type: order.type || "dine-in",
          course: order.course || "appetizer",
          fired: order.fired !== undefined ? order.fired : true,
        }
      })
      .filter(Boolean) // Remove any null entries
  }

  // Update elapsed times for all orders
  const updateElapsedTimes = () => {
    const now = Date.now()

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        const diffMinutes = Math.floor((now - order.startTime) / (1000 * 60))

        // Update item elapsed times
        const updatedItems = order.items.map((item) => {
          const itemDiffMinutes = Math.floor((now - item.startTime) / (1000 * 60))
          return {
            ...item,
            timeElapsed: `${itemDiffMinutes}m`,
          }
        })

        return {
          ...order,
          timeElapsed: `${diffMinutes}m`,
          items: updatedItems,
        }
      }),
    )
  }

  // Check for orders that have exceeded their estimated time
  const checkForDelayedOrders = () => {
    const now = Date.now()
    let delayedFound = false

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        // Check each item for delays
        const updatedItems = order.items.map((item) => {
          if (item.status === "cooking") {
            const cookingTime = Math.floor((now - item.startTime) / (1000 * 60))
            if (cookingTime > item.estimatedTime && item.status !== "delayed") {
              delayedFound = true
              return { ...item, status: "delayed" }
            }
          }
          return item
        })

        // Update order status based on items
        let orderStatus = order.status
        if (updatedItems.some((item) => item.status === "delayed")) {
          orderStatus = "delayed"
        }

        return {
          ...order,
          items: updatedItems,
          status: orderStatus,
        }
      }),
    )

    // Play alert sound if delayed orders found
    if (delayedFound && soundEnabled && alertSoundRef.current) {
      alertSoundRef.current.play().catch((e) => console.log("Audio play failed:", e))

      // Show toast notification
      toast({
        title: "Order Delayed",
        description: "One or more orders have exceeded their estimated preparation time",
        variant: "destructive",
      })
    }
  }

  // Estimate cooking time based on item name (mock function)
  const getEstimatedTime = (itemName: string): number => {
    const itemLower = itemName.toLowerCase()

    if (itemLower.includes("steak")) return 15
    if (itemLower.includes("burger")) return 10
    if (itemLower.includes("salad")) return 5
    if (itemLower.includes("pasta")) return 12
    if (itemLower.includes("dessert") || itemLower.includes("cake")) return 5
    if (itemLower.includes("appetizer") || itemLower.includes("soup")) return 7

    // Default time
    return 10
  }

  // Assign station based on item name (mock function)
  const assignStation = (itemName: string): "grill" | "fry" | "salad" | "dessert" | "bar" | "appetizer" | "main" => {
    const itemLower = itemName.toLowerCase()

    if (itemLower.includes("steak") || itemLower.includes("grill")) return "grill"
    if (itemLower.includes("fry") || itemLower.includes("fried")) return "fry"
    if (itemLower.includes("salad")) return "salad"
    if (itemLower.includes("dessert") || itemLower.includes("cake")) return "dessert"
    if (itemLower.includes("drink") || itemLower.includes("cocktail")) return "bar"
    if (itemLower.includes("appetizer")) return "appetizer"

    // Default station
    return "main"
  }

  // Determine course based on item name (mock function)
  const determineCourse = (itemName: string): "appetizer" | "main" | "dessert" | "drink" => {
    const itemLower = itemName.toLowerCase()

    if (itemLower.includes("appetizer") || itemLower.includes("starter") || itemLower.includes("soup"))
      return "appetizer"
    if (itemLower.includes("dessert") || itemLower.includes("cake") || itemLower.includes("ice cream")) return "dessert"
    if (itemLower.includes("drink") || itemLower.includes("beverage") || itemLower.includes("coffee")) return "drink"

    // Default course
    return "main"
  }

  // Generate mock orders for testing
  const generateMockOrders = (): Order[] => {
    const now = Date.now()

    return [
      {
        id: "ORD-001",
        table: "Table 5",
        seat: 2,
        items: [
          {
            id: "item-001-1",
            name: "Grilled Salmon",
            modifiers: ["No salt", "Extra lemon"],
            status: "cooking",
            timeElapsed: "8m",
            startTime: now - 8 * 60 * 1000,
            estimatedTime: 15,
            station: "grill",
            course: "main",
            priority: "normal",
          },
          {
            id: "item-001-2",
            name: "Caesar Salad",
            modifiers: ["Dressing on side"],
            status: "ready",
            timeElapsed: "5m",
            startTime: now - 15 * 60 * 1000,
            estimatedTime: 5,
            station: "salad",
            course: "appetizer",
            priority: "normal",
          },
        ],
        status: "cooking",
        timeReceived: "12:30 PM",
        timeElapsed: "15m",
        startTime: now - 15 * 60 * 1000,
        priority: "normal",
        server: "Alex",
        type: "dine-in",
        course: "main",
        fired: true,
      },
      {
        id: "ORD-002",
        table: "Table 3",
        seat: 1,
        items: [
          {
            id: "item-002-1",
            name: "Ribeye Steak",
            modifiers: ["Medium rare", "Mushroom sauce"],
            status: "new",
            timeElapsed: "2m",
            startTime: now - 2 * 60 * 1000,
            estimatedTime: 18,
            station: "grill",
            course: "main",
            priority: "high",
          },
          {
            id: "item-002-2",
            name: "Mashed Potatoes",
            modifiers: [],
            status: "new",
            timeElapsed: "2m",
            startTime: now - 2 * 60 * 1000,
            estimatedTime: 8,
            station: "main",
            course: "main",
            priority: "high",
          },
        ],
        status: "new",
        timeReceived: "12:35 PM",
        timeElapsed: "10m",
        startTime: now - 10 * 60 * 1000,
        priority: "high",
        server: "Morgan",
        type: "dine-in",
        course: "main",
        fired: true,
      },
      {
        id: "ORD-003",
        table: "Table 8",
        seat: 3,
        items: [
          {
            id: "item-003-1",
            name: "Vegetable Pasta",
            modifiers: ["No garlic", "Extra cheese"],
            status: "cooking",
            timeElapsed: "4m",
            startTime: now - 4 * 60 * 1000,
            estimatedTime: 12,
            station: "main",
            course: "main",
            priority: "rush",
          },
        ],
        status: "cooking",
        timeReceived: "12:40 PM",
        timeElapsed: "5m",
        startTime: now - 5 * 60 * 1000,
        priority: "rush",
        server: "Jamie",
        type: "dine-in",
        course: "main",
        fired: true,
      },
      {
        id: "ORD-004",
        table: "Room 101",
        seat: 1,
        items: [
          {
            id: "item-004-1",
            name: "Chicken Soup",
            modifiers: ["Low sodium"],
            status: "ready",
            timeElapsed: "12m",
            startTime: now - 12 * 60 * 1000,
            estimatedTime: 10,
            station: "main",
            course: "appetizer",
            priority: "normal",
          },
          {
            id: "item-004-2",
            name: "Fruit Plate",
            modifiers: ["No melon"],
            status: "ready",
            timeElapsed: "10m",
            startTime: now - 10 * 60 * 1000,
            estimatedTime: 5,
            station: "dessert",
            course: "dessert",
            priority: "normal",
          },
        ],
        status: "ready",
        timeReceived: "12:25 PM",
        timeElapsed: "20m",
        startTime: now - 20 * 60 * 1000,
        priority: "normal",
        server: "Taylor",
        type: "room-service",
        course: "appetizer",
        fired: true,
      },
      {
        id: "ORD-005",
        table: "Memory Care 3",
        seat: 2,
        items: [
          {
            id: "item-005-1",
            name: "Soft Scrambled Eggs",
            modifiers: ["Extra soft", "No pepper"],
            status: "cooking",
            timeElapsed: "6m",
            startTime: now - 6 * 60 * 1000,
            estimatedTime: 8,
            station: "main",
            course: "main",
            priority: "normal",
          },
          {
            id: "item-005-2",
            name: "Toast with Jam",
            modifiers: ["Light toast"],
            status: "ready",
            timeElapsed: "3m",
            startTime: now - 3 * 60 * 1000,
            estimatedTime: 3,
            station: "main",
            course: "main",
            priority: "normal",
          },
        ],
        status: "cooking",
        timeReceived: "12:38 PM",
        timeElapsed: "7m",
        startTime: now - 7 * 60 * 1000,
        priority: "normal",
        server: "Casey",
        type: "memory-care",
        course: "main",
        fired: true,
      },
      {
        id: "ORD-006",
        table: "Takeout #12",
        seat: 1,
        items: [
          {
            id: "item-006-1",
            name: "Burger and Fries",
            modifiers: ["Medium well", "No onions"],
            status: "new",
            timeElapsed: "1m",
            startTime: now - 1 * 60 * 1000,
            estimatedTime: 12,
            station: "grill",
            course: "main",
            priority: "high",
          },
          {
            id: "item-006-2",
            name: "Chocolate Milkshake",
            modifiers: [],
            status: "new",
            timeElapsed: "1m",
            startTime: now - 1 * 60 * 1000,
            estimatedTime: 5,
            station: "bar",
            course: "drink",
            priority: "high",
          },
        ],
        status: "new",
        timeReceived: "12:44 PM",
        timeElapsed: "1m",
        startTime: now - 1 * 60 * 1000,
        priority: "high",
        server: "Sam",
        type: "takeout",
        course: "main",
        fired: true,
      },
    ]
  }

  // Update item status
  const updateItemStatus = (orderId: string, itemId: string, newStatus: "new" | "cooking" | "ready" | "delayed") => {
    // Get current time for ready timestamp
    const now = new Date()
    const timeReadyStr = `${now.getMinutes()} min ago`

    // First update the local state
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((item) => {
            if (item.id === itemId) {
              // If changing to cooking, update the start time
              const updatedItem = {
                ...item,
                status: newStatus,
                ...(newStatus === "cooking" ? { startTime: Date.now() } : {}),
              }
              return updatedItem
            }
            return item
          })

          // Determine overall order status based on items
          let orderStatus: "new" | "cooking" | "ready" | "delayed" = "new"
          if (updatedItems.every((item) => item.status === "ready")) {
            orderStatus = "ready"
          } else if (updatedItems.some((item) => item.status === "delayed")) {
            orderStatus = "delayed"
          } else if (updatedItems.some((item) => item.status === "cooking")) {
            orderStatus = "cooking"
          }

          // Add timeReady if status is ready
          const updatedOrder = {
            ...order,
            items: updatedItems,
            status: orderStatus,
            ...(orderStatus === "ready" || newStatus === "ready" ? { timeReady: timeReadyStr } : {}),
          }

          return updatedOrder
        }
        return order
      })

      // Immediately update localStorage with the new orders
      try {
        localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders))
        console.log("Orders updated in localStorage:", updatedOrders)
      } catch (error) {
        console.error("Error updating orders in localStorage:", error)
      }

      return updatedOrders
    })

    // Show toast notification
    toast({
      title: `Item status updated`,
      description: `Item marked as ${newStatus}`,
      duration: 2000,
    })

    // If item is marked as ready, notify server
    if (newStatus === "ready") {
      notifyServer(orderId, itemId)
    }
  }

  // Mark all items in an order as ready
  const markAllReady = (orderId: string) => {
    // Get current time for ready timestamp
    const now = new Date()
    const timeReadyStr = `${now.getMinutes()} min ago`

    // Update local state
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((item) => ({
            ...item,
            status: "ready" as const,
          }))

          return {
            ...order,
            items: updatedItems,
            status: "ready" as const,
            timeReady: timeReadyStr,
          }
        }
        return order
      })

      // Immediately update localStorage with the new orders
      try {
        localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders))
        console.log("All items marked ready in localStorage:", updatedOrders)
      } catch (error) {
        console.error("Error updating orders in localStorage:", error)
      }

      return updatedOrders
    })

    // Show toast notification
    toast({
      title: `Order ready`,
      description: `Order ${orderId} marked as ready`,
      duration: 2000,
    })

    // Notify servers for all items
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      order.items.forEach((item) => {
        notifyServer(orderId, item.id)
      })
    }
  }

  // Fire a course for an order
  const fireCourse = (orderId: string) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            fired: true,
          }
        }
        return order
      })

      // Immediately update localStorage
      try {
        localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders))
      } catch (error) {
        console.error("Error updating orders in localStorage:", error)
      }

      return updatedOrders
    })

    // Show toast notification
    toast({
      title: `Course fired`,
      description: `Order ${orderId} course has been fired`,
      duration: 2000,
    })
  }

  // Sync orders to localStorage
  const syncOrdersToStorage = () => {
    try {
      localStorage.setItem("pendingOrders", JSON.stringify(orders))
      console.log("Orders synced to localStorage")
    } catch (error) {
      console.error("Error updating orders in localStorage:", error)
    }
  }

  // Notify server that an item is ready
  const notifyServer = (orderId: string, itemId: string) => {
    // In a real app, this would send a notification to the server's device
    // For now, we'll just show a toast
    const order = orders.find((o) => o.id === orderId)
    const item = order?.items.find((i) => i.id === itemId)

    if (order && item) {
      toast({
        title: `Server notification sent`,
        description: `${order.server} has been notified that ${item.name} is ready for ${order.table}`,
        duration: 3000,
      })
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "border-white"
      case "cooking":
        return "border-amber-500"
      case "ready":
        return "border-emerald-500"
      case "delayed":
        return "border-red-500"
      default:
        return "border-white"
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            High Priority
          </Badge>
        )
      case "rush":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            Rush Order
          </Badge>
        )
      default:
        return null
    }
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "dine-in":
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Dine-In
          </Badge>
        )
      case "takeout":
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Takeout
          </Badge>
        )
      case "room-service":
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            Room Service
          </Badge>
        )
      case "memory-care":
        return (
          <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
            Memory Care
          </Badge>
        )
      default:
        return null
    }
  }

  // Get station icon
  const getStationIcon = (station: string) => {
    switch (station) {
      case "grill":
        return <Utensils className="h-4 w-4" />
      case "fry":
        return <Utensils className="h-4 w-4" />
      case "salad":
        return <Utensils className="h-4 w-4" />
      case "dessert":
        return <Cake className="h-4 w-4" />
      case "bar":
        return <Coffee className="h-4 w-4" />
      case "appetizer":
        return <Utensils className="h-4 w-4" />
      default:
        return <Utensils className="h-4 w-4" />
    }
  }

  // Filter orders based on active filters
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (activeTab !== "all" && order.status !== activeTab) return false

    // Filter by role/type
    if (activeRole !== "all") {
      if (activeRole === "dine-in" && order.type !== "dine-in") return false
      if (activeRole === "takeout" && order.type !== "takeout") return false
      if (activeRole === "room-service" && order.type !== "room-service") return false
      if (activeRole === "memory-care" && order.type !== "memory-care") return false
    }

    // Filter by station
    if (activeStation !== "all") {
      if (!order.items.some((item) => item.station === activeStation)) return false
    }

    // Filter by course
    if (activeCourse !== "all") {
      if (!order.items.some((item) => item.course === activeCourse)) return false
    }

    // Hide delayed orders if showDelayed is false
    if (!showDelayed && order.status === "delayed") return false

    return true
  })

  // Sort orders by priority and time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // First sort by priority
    const priorityOrder = { rush: 0, high: 1, normal: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Then sort by time (oldest first)
    return a.startTime - b.startTime
  })

  return (
    <Shell>
      <div className="container py-6">
        <PageHeaderWithTime
          title="Kitchen Display"
          description="Manage and track food preparation"
          actions={
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="sound-mode" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                <Label htmlFor="sound-mode" className="text-sm text-gray-400">
                  {soundEnabled ? (
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-4 w-4" />
                      <span>Sound On</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <VolumeX className="h-4 w-4" />
                      <span>Sound Off</span>
                    </div>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Label htmlFor="auto-refresh" className="text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin-slow" : ""}`} />
                    <span>Auto Refresh</span>
                  </div>
                </Label>
              </div>
            </div>
          }
        />

        {/* Advanced filters */}
        <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <Label htmlFor="role-filter" className="text-xs text-gray-500 mb-1 block">
                  Role View
                </Label>
                <Select value={activeRole} onValueChange={setActiveRole}>
                  <SelectTrigger id="role-filter" className="w-full bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="dine-in">Dine-In</SelectItem>
                    <SelectItem value="takeout">Takeout</SelectItem>
                    <SelectItem value="room-service">Room Service</SelectItem>
                    <SelectItem value="memory-care">Memory Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="station-filter" className="text-xs text-gray-500 mb-1 block">
                  Station
                </Label>
                <Select value={activeStation} onValueChange={setActiveStation}>
                  <SelectTrigger id="station-filter" className="w-full bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    <SelectItem value="grill">Grill</SelectItem>
                    <SelectItem value="fry">Fry</SelectItem>
                    <SelectItem value="salad">Salad</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="main">Main</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="course-filter" className="text-xs text-gray-500 mb-1 block">
                  Course
                </Label>
                <Select value={activeCourse} onValueChange={setActiveCourse}>
                  <SelectTrigger id="course-filter" className="w-full bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="appetizer">Appetizers</SelectItem>
                    <SelectItem value="main">Mains</SelectItem>
                    <SelectItem value="dessert">Desserts</SelectItem>
                    <SelectItem value="drink">Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sync-mode"
                checked={syncMode === "all"}
                onCheckedChange={(checked) => setSyncMode(checked ? "all" : "individual")}
              />
              <Label htmlFor="sync-mode" className="text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Sync All Screens</span>
                </div>
              </Label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all" className="relative">
                All Orders
                <Badge className="ml-2 bg-primary text-xs">{orders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="new" className="relative">
                New
                <Badge className="ml-2 bg-white text-background text-xs">
                  {orders.filter((o) => o.status === "new").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cooking" className="relative">
                Cooking
                <Badge className="ml-2 bg-amber-500 text-background text-xs">
                  {orders.filter((o) => o.status === "cooking").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ready" className="relative">
                Ready
                <Badge className="ml-2 bg-emerald-500 text-background text-xs">
                  {orders.filter((o) => o.status === "ready").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="delayed" className="relative">
                Delayed
                <Badge className="ml-2 bg-red-500 text-background text-xs">
                  {orders.filter((o) => o.status === "delayed").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="shadow-sm animate-pulse">
                <CardHeader className="h-24"></CardHeader>
                <CardContent className="h-48"></CardContent>
                <CardFooter className="h-16"></CardFooter>
              </Card>
            ))}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-secondary/50 p-4 mb-4">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Orders</h3>
            <p className="text-muted-foreground max-w-md">
              There are no {activeTab === "all" ? "" : activeTab} orders to display at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <Card
                    className={`kds-order shadow-lg hover:shadow-xl transition-all duration-300 ${getStatusColor(order.status)}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{order.table}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            Seat {order.seat}
                          </Badge>
                        </div>
                        <CardDescription>
                          Order {order.id} • {order.timeReceived} • {order.server}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {order.timeElapsed}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {getPriorityBadge(order.priority)}
                          {getTypeBadge(order.type)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ScrollArea className="h-[220px] pr-4">
                        <ul className="space-y-4">
                          {order.items.map((item, index) => (
                            <li key={item.id} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      item.status === "new"
                                        ? "bg-white"
                                        : item.status === "cooking"
                                          ? "bg-amber-500"
                                          : item.status === "ready"
                                            ? "bg-emerald-500"
                                            : "bg-red-500 animate-pulse"
                                    }`}
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{item.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2">
                                      {item.station}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`w-7 h-7 p-0 rounded-full ${
                                      item.status === "new"
                                        ? "bg-white/10 text-white"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                    onClick={() => updateItemStatus(order.id, item.id, "new")}
                                    aria-label="Mark as new"
                                  >
                                    <span className="sr-only">New</span>
                                    <span className="text-xs">N</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`w-7 h-7 p-0 rounded-full ${
                                      item.status === "cooking"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                    onClick={() => updateItemStatus(order.id, item.id, "cooking")}
                                    aria-label="Mark as cooking"
                                  >
                                    <span className="sr-only">Cooking</span>
                                    <span className="text-xs">C</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`w-7 h-7 p-0 rounded-full ${
                                      item.status === "ready"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                    onClick={() => updateItemStatus(order.id, item.id, "ready")}
                                    aria-label="Mark as ready"
                                  >
                                    <span className="sr-only">Ready</span>
                                    <span className="text-xs">R</span>
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between ml-4">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Timer className="h-3 w-3" />
                                  <span>
                                    {item.timeElapsed || "0m"} / {item.estimatedTime}m
                                  </span>
                                  {item.status === "delayed" && (
                                    <span className="text-red-400 animate-pulse ml-1">DELAYED</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <div className="h-1 w-16 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        item.status === "delayed"
                                          ? "bg-red-500"
                                          : item.status === "ready"
                                            ? "bg-emerald-500"
                                            : "bg-amber-500"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          item.status === "ready"
                                            ? 100
                                            : (Number.parseInt(item.timeElapsed || "0") / item.estimatedTime) * 100,
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {item.modifiers.length > 0 && (
                                <p className="text-sm text-muted-foreground ml-4">{item.modifiers.join(", ")}</p>
                              )}

                              {index < order.items.length - 1 && <Separator className="mt-2" />}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center">
                      <Badge
                        className={`status-badge ${
                          order.status === "new"
                            ? "status-new"
                            : order.status === "cooking"
                              ? "status-cooking"
                              : order.status === "ready"
                                ? "status-ready"
                                : "status-delayed"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>

                      <div className="flex gap-2">
                        {!order.fired && order.status !== "ready" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fireCourse(order.id)}
                            className="text-sm gap-1 border-amber-800/30 hover:bg-amber-900/20 hover:text-amber-400"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Fire Course
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAllReady(order.id)}
                          className="text-sm gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark All Ready
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Shell>
  )
}
