"use client"

import { useState, useEffect } from "react"
import { Shell } from "@/components/shell"
import { PageHeaderWithTime } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Clock, CheckCircle, AlertCircle, ChefHat, Utensils } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"

type Order = {
  id: string
  table: string
  seat: number
  items: {
    id: string
    name: string
    modifiers: string[]
    status: "new" | "cooking" | "ready" | "delayed"
  }[]
  status: "new" | "cooking" | "ready" | "delayed" | "delivered"
  timeReady?: string
  timeReceived: string
  startTime: number
  server?: string
  type?: string
}

export default function ExpoPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load orders from localStorage with more frequent polling
  useEffect(() => {
    setIsLoading(true)

    const loadOrders = () => {
      try {
        const savedOrdersJSON = localStorage.getItem("pendingOrders")
        if (savedOrdersJSON) {
          const savedOrders = JSON.parse(savedOrdersJSON)
          console.log("Loaded orders from localStorage:", savedOrders)
          setOrders(savedOrders)
        } else {
          console.log("No orders found in localStorage")
          setOrders([])
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    // Initial load
    loadOrders()

    // Set up interval to check for new orders more frequently (every 2 seconds)
    const intervalId = setInterval(loadOrders, 2000)

    return () => clearInterval(intervalId)
  }, [])

  // Mark order as delivered
  const markAsDelivered = (orderId: string) => {
    // Update local state
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: "delivered" as const }
        }
        return order
      }),
    )

    // Update localStorage
    try {
      const savedOrdersJSON = localStorage.getItem("pendingOrders")
      if (savedOrdersJSON) {
        const savedOrders = JSON.parse(savedOrdersJSON)
        const updatedOrders = savedOrders.map((order: any) => {
          if (order.id === orderId) {
            return { ...order, status: "delivered" }
          }
          return order
        })
        localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders))
        console.log("Order marked as delivered in localStorage:", updatedOrders)
      }
    } catch (error) {
      console.error("Error updating orders in localStorage:", error)
    }

    // Show toast notification
    toast({
      title: "Order delivered",
      description: `Order ${orderId} has been marked as delivered`,
      duration: 2000,
    })
  }

  // Handle double-click to remove order
  const handleDoubleClick = (orderId: string) => {
    // Remove from local state
    setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))

    // Remove from localStorage
    try {
      const savedOrdersJSON = localStorage.getItem("pendingOrders")
      if (savedOrdersJSON) {
        const savedOrders = JSON.parse(savedOrdersJSON)
        const updatedOrders = savedOrders.filter((order: any) => order.id !== orderId)
        localStorage.setItem("pendingOrders", JSON.stringify(updatedOrders))
        console.log("Order removed from localStorage:", updatedOrders)
      }
    } catch (error) {
      console.error("Error removing order from localStorage:", error)
    }

    // Show toast notification
    toast({
      title: "Order completed",
      description: `Order ${orderId} has been completed and removed`,
      duration: 2000,
    })
  }

  // Filter orders by status - improved logic for ready orders
  const readyOrders = orders.filter((order) => {
    // Check if the order status is ready OR if any items are ready
    return order.status === "ready" || order.items.some((item) => item.status === "ready")
  })

  // Also update the in-progress orders filter to avoid showing ready orders there
  const inProgressOrders = orders.filter((order) => {
    // Only show orders that are not delivered and not completely ready
    return (
      order.status !== "delivered" && order.status !== "ready" && !order.items.every((item) => item.status === "ready")
    )
  })

  return (
    <Shell>
      <div className="container py-6">
        <PageHeaderWithTime title="Expo View" description="Manage order delivery to tables" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <h2 className="text-xl font-semibold">Ready for Service ({readyOrders.length})</h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="shadow-sm animate-pulse">
                    <CardHeader className="h-24"></CardHeader>
                    <CardContent className="h-48"></CardContent>
                    <CardFooter className="h-16"></CardFooter>
                  </Card>
                ))}
              </div>
            ) : readyOrders.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-secondary/50 p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">All Caught Up</h3>
                  <p className="text-muted-foreground max-w-md">There are no orders ready for service at this time.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {readyOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        key={order.id}
                        className="expo-order expo-order-ready shadow-sm hover:shadow-md transition-shadow border-2 border-emerald-500"
                        style={{
                          animation: "pulse-green 2s infinite",
                        }}
                        onDoubleClick={() => handleDoubleClick(order.id)}
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
                              Order {order.id} • Server: {order.server || "Unknown"}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {order.timeReady || "Just now"}
                          </div>
                        </CardHeader>

                        <CardContent>
                          <ScrollArea className="h-[180px] pr-4">
                            <ul className="space-y-2">
                              {order.items
                                .filter((item) => item.status === "ready")
                                .map((item, index) => (
                                  <li key={index} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <p className="font-medium">{item.name}</p>
                                    </div>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                      <p className="text-sm text-muted-foreground ml-4">{item.modifiers.join(", ")}</p>
                                    )}

                                    {index < order.items.filter((item) => item.status === "ready").length - 1 && (
                                      <Separator className="mt-2" />
                                    )}
                                  </li>
                                ))}
                            </ul>
                          </ScrollArea>
                        </CardContent>

                        <CardFooter>
                          <Button onClick={() => markAsDelivered(order.id)} className="w-full gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Mark as Delivered
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <h2 className="text-xl font-semibold">In Progress ({inProgressOrders.length})</h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="shadow-sm animate-pulse">
                    <CardHeader className="h-24"></CardHeader>
                    <CardContent className="h-48"></CardContent>
                    <CardFooter className="h-16"></CardFooter>
                  </Card>
                ))}
              </div>
            ) : inProgressOrders.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-secondary/50 p-4 mb-4">
                    <ChefHat className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Orders In Progress</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no orders currently being prepared in the kitchen.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="expo-order expo-order-waiting shadow-sm hover:shadow-md transition-shadow"
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
                          Order {order.id} • Server: {order.server || "Unknown"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        {order.status === "cooking" ? "Cooking" : order.status === "delayed" ? "Delayed" : "Waiting"}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ScrollArea className="h-[180px] pr-4">
                        <ul className="space-y-2">
                          {order.items.map((item, index) => (
                            <li key={index} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    item.status === "new"
                                      ? "bg-white"
                                      : item.status === "cooking"
                                        ? "bg-amber-500"
                                        : item.status === "ready"
                                          ? "bg-emerald-500"
                                          : "bg-red-500"
                                  }`}
                                />
                                <p className="font-medium">{item.name}</p>
                              </div>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <p className="text-sm text-muted-foreground ml-4">{item.modifiers.join(", ")}</p>
                              )}

                              {index < order.items.length - 1 && <Separator className="mt-2" />}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </CardContent>

                    <CardFooter>
                      <div className="w-full py-2 bg-secondary/50 text-muted-foreground rounded-md text-center flex items-center justify-center gap-2">
                        {order.status === "delayed" ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400">Delayed in Kitchen</span>
                          </>
                        ) : (
                          <>
                            <Utensils className="h-4 w-4" />
                            Waiting for Kitchen
                          </>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
