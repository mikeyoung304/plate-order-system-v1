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
import { fetchRecentOrders, type Order, updateOrderStatus } from "@/lib/orders"

export default function ExpoPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load orders from Supabase
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true)
        const fetchedOrders = await fetchRecentOrders(50)
        setOrders(fetchedOrders)
      } catch (error) {
        console.error("Error loading orders:", error)
        toast({
          title: "Error",
          description: "Failed to load orders. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [toast])

  // Mark order as delivered
  const markAsDelivered = async (orderId: string) => {
    try {
      // Optimistically update the UI
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'delivered' as const }
          : order
      ));

      await updateOrderStatus(orderId, 'delivered');

      // Show toast notification
      toast({
        title: "Order delivered",
        description: `Order ${orderId} has been marked as delivered`,
        duration: 2000,
      })
    } catch (error) {
      console.error("Error marking order as delivered:", error)
      toast({
        title: "Error",
        description: "Failed to mark order as delivered",
        variant: "destructive",
      })
    }
  }

  // Filter orders by status
  const readyOrders = orders.filter((order) => order.status === "ready")
  const inProgressOrders = orders.filter((order) => order.status === "in_progress")

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
                <AnimatePresence mode="popLayout">
                  {readyOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <Card
                        key={order.id}
                        className="expo-order expo-order-ready shadow-sm hover:shadow-md transition-shadow border-2 border-emerald-500"
                        style={{
                          animation: "pulse-green 2s infinite",
                        }}
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
                              Order {order.id}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </CardHeader>

                        <CardContent>
                          <ScrollArea className="h-[180px] pr-4">
                            <ul className="space-y-2">
                              {order.items.map((item, index) => (
                                <li key={index} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="font-medium">{item}</p>
                                  </div>
                                  {index < order.items.length - 1 && (
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
                          <Badge variant="outline" className={`status-badge status-${order.status}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription>
                          Order {order.id}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                        In Progress
                      </div>
                    </CardHeader>

                    <CardContent>
                      <ScrollArea className="h-[180px] pr-4">
                        <ul className="space-y-2">
                          {order.items.map((item, index) => (
                            <li key={index} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <p className="font-medium">{item}</p>
                              </div>
                              {index < order.items.length - 1 && <Separator className="mt-2" />}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </CardContent>

                    <CardFooter>
                      <div className="w-full py-2 bg-secondary/50 text-muted-foreground rounded-md text-center flex items-center justify-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Being Prepared
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
