// File: frontend/app/server/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Shell } from "@/components/shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FloorPlanView } from "@/components/floor-plan-view"
import { VoiceOrderPanel } from "@/components/voice-order-panel"
import { SeatPickerOverlay } from "@/components/seat-picker-overlay"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Utensils, Coffee, Info, Clock, History } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Table } from "@/lib/floor-plan-utils"
import { fetchTables } from "@/lib/tables"
import { useAuth } from "@/lib/AuthContext"
import { fetchRecentOrders, createOrder, subscribeToOrders, type Order } from "@/lib/orders"
import { createClient } from "@/lib/supabase/client"

export default function ServerPage() {
  const [floorPlanId, setFloorPlanId] = useState("default") // Example ID
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<"food" | "drink" | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Fetch tables from Supabase
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        const fetchedTables = await fetchTables();
        setTables(fetchedTables);
      } catch (error) {
        console.error('Error loading tables:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load tables. Please refresh the page.', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };

    loadTables();
  }, [toast]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Load recent orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await fetchRecentOrders(5);
        setRecentOrders(orders);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load recent orders', 
          variant: 'destructive' 
        });
      }
    };

    loadOrders();
  }, [toast]);

  // Subscribe to order updates
  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (order) => {
        setRecentOrders(prev => {
          // If the order already exists, update it
          const exists = prev.some(o => o.id === order.id);
          if (exists) {
            return prev.map(o => o.id === order.id ? order : o);
          }
          // Otherwise, add it to the beginning and maintain limit of 5
          return [order, ...prev].slice(0, 5);
        });
      },
      (error) => {
        console.error('Subscription error:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to receive order updates', 
          variant: 'destructive' 
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toast]);

  // --- Navigation and Selection Handlers ---

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setShowSeatPicker(true); // Show the overlay
    if (navigator.vibrate) navigator.vibrate(50);
    toast({ title: `Table ${table.label} selected`, description: "Choose a seat", duration: 1500 });
  };

  const handleSeatSelected = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setShowSeatPicker(false); // Close overlay, state change triggers next view
  };

  const handleCloseSeatPicker = () => {
    setShowSeatPicker(false);
    setSelectedTable(null); // Deselect table if closing overlay
  };

  // Reset selection fully when going back from Order Type or Voice Order
  const handleBackToFloorPlan = () => {
    setSelectedTable(null);
    setSelectedSeat(null);
    setOrderType(null);
    setShowSeatPicker(false);
  };

  // Go back from Order Type selection to Floor Plan
  const handleBackFromOrderType = () => {
    setSelectedSeat(null); // Go back to floor plan view
    setOrderType(null);
  };

  // Go back from Voice Order to Order Type selection
  const handleBackFromVoiceOrder = () => {
    setOrderType(null); // Go back to order type selection
  };

  // Called by VoiceOrderPanel upon successful transcription
  const handleOrderSubmitted = useCallback(async (orderText: string) => {
    if (!selectedTable || selectedSeat == null || !user) {
      toast({ title: "Error", description: "Table or seat not selected.", variant: "destructive" });
      return;
    }

    // Get the seat ID from the seats data in the tables response
    const supabase = createClient();
    const seatData = await supabase
      .from('seats')
      .select('id')
      .eq('table_id', selectedTable.id)
      .eq('label', selectedSeat)
      .single();

    if (seatData.error || !seatData.data) {
      toast({ title: "Error", description: "Invalid seat selection.", variant: "destructive" });
      return;
    }

    try {
      const orderData = {
        table_id: selectedTable.id,
        seat_id: seatData.data.id,
        resident_id: user.id, // Temporarily using server as resident for testing
        server_id: user.id,
        items: orderText.split(",").map(item => item.trim()).filter(item => item),
        transcript: orderText,
        type: orderType || 'food'
      };

      const order = await createOrder(orderData);
      
      toast({ 
        title: 'Order Submitted', 
        description: 'Your order has been sent to the kitchen.',
        variant: 'default'
      });
      
      handleBackToFloorPlan();
    } catch (err) {
      console.error('Order submission error:', err);
      toast({ 
        title: 'Submission Failed', 
        description: 'Could not submit order. Please retry.', 
        variant: 'destructive' 
      });
    }
  }, [selectedTable, selectedSeat, user, orderType, toast, handleBackToFloorPlan]);

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.1 } }, exit: { opacity: 0, transition: { when: "afterChildren" } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 500 } }, exit: { y: 20, opacity: 0 } };

  // Determine current main view based on state (excluding the overlay)
  let currentView = 'floorPlan';
  if (selectedSeat && !orderType) {
    currentView = 'orderType';
  } else if (selectedSeat && orderType) {
    currentView = 'voiceOrder';
  }

  return (
    <Shell className="bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-gray-900/95">
      <div className="container py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Server View</h1>
            <p className="text-gray-400 mt-1">Take and manage orders</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/30">
            <Clock className="h-4 w-4 text-teal-400" />
            <span className="text-gray-300 font-medium"> {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <motion.div className="lg:col-span-2" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            {/* Use AnimatePresence to transition between views */}
            <AnimatePresence mode="wait">
              {/* Floor Plan View */}
              {currentView === 'floorPlan' && (
                <motion.div key="floor-plan" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                  <Card className="bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-gray-700/30">
                        <h2 className="text-xl font-medium text-white">Select a Table</h2>
                        <p className="text-gray-400 text-sm mt-1">Choose a table to place an order</p>
                      </div>
                      <div className="p-6">
                        {loading ? (
                          <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                          </div>
                        ) : (
                          <FloorPlanView 
                            floorPlanId={floorPlanId} 
                            onSelectTable={handleSelectTable}
                            tables={tables} // Pass the fetched tables
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Order Type Selection View */}
              {currentView === 'orderType' && selectedTable && selectedSeat && (
                <motion.div key="order-type" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                  <Card className="bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-gray-700/30 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-medium text-white"> Table {selectedTable.label}, Seat {selectedSeat} </h2>
                          <p className="text-gray-400 text-sm mt-1">Select order type</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleBackFromOrderType} className="h-9 gap-1 text-gray-300 hover:text-white hover:bg-gray-700/50">
                          <ChevronLeft className="h-4 w-4" /> Back
                        </Button>
                      </div>
                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                            <Button className="w-full h-48 flex flex-col gap-4 bg-gradient-to-br from-teal-600/90 to-teal-700/90 hover:from-teal-500/90 hover:to-teal-600/90 border-0 rounded-xl shadow-lg" onClick={() => setOrderType("food")}>
                              <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center"> <Utensils className="h-10 w-10 text-teal-300" /> </div>
                              <span className="text-2xl font-medium">Food Order</span>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                            <Button className="w-full h-48 flex flex-col gap-4 bg-gradient-to-br from-amber-600/90 to-amber-700/90 hover:from-amber-500/90 hover:to-amber-600/90 border-0 rounded-xl shadow-lg" onClick={() => setOrderType("drink")}>
                              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center"> <Coffee className="h-10 w-10 text-amber-300" /> </div>
                              <span className="text-2xl font-medium">Drink Order</span>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Voice Order Panel View */}
              {currentView === 'voiceOrder' && selectedTable && selectedSeat && orderType && (
                <motion.div key="voice-order" variants={itemVariants} initial="hidden" animate="visible" exit="exit">
                  <Card className="bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-gray-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderType === "food" ? "bg-teal-500/20 text-teal-400" : "bg-amber-500/20 text-amber-400"}`}>
                            {orderType === "food" ? <Utensils className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
                          </div>
                          <div>
                            <h2 className="text-xl font-medium text-white flex items-center gap-2">
                              {orderType === "food" ? "Food Order" : "Drink Order"}
                              <Badge variant="outline" className="ml-2 text-xs font-normal"> Table {selectedTable.label}, Seat {selectedSeat} </Badge>
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Record your order using voice</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleBackFromVoiceOrder} className="h-9 gap-1 text-gray-300 hover:text-white hover:bg-gray-700/50">
                          <ChevronLeft className="h-4 w-4" /> Back
                        </Button>
                      </div>
                      <div className="p-6">
                        <VoiceOrderPanel
                          tableId={selectedTable.id}
                          tableName={selectedTable.label}
                          seatNumber={selectedSeat}
                          orderType={orderType}
                          onOrderSubmitted={handleOrderSubmitted}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Orders Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="bg-gray-800/40 border-gray-700/30 backdrop-blur-sm overflow-hidden h-full">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="p-6 border-b border-gray-700/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center"> <History className="h-5 w-5 text-gray-300" /> </div>
                  <div>
                    <h2 className="text-xl font-medium text-white">Recent Orders</h2>
                    <p className="text-gray-400 text-sm">Latest orders you've submitted</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-6">
                  {recentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mb-3"> <Info className="h-6 w-6 text-gray-400" /> </div>
                      <p className="text-gray-400 font-medium">No recent orders</p>
                      <p className="text-sm text-gray-500 mt-1">Orders will appear here after submission</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {recentOrders.map((order, index) => (
                          <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: index * 0.05, type: "spring", stiffness: 500, damping: 30 }}>
                            <div className="p-4 rounded-xl bg-gray-800/70 border border-gray-700/30 backdrop-blur-sm hover:bg-gray-800/90 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-medium text-white">Table {order.table} {order.seat ? `(Seat ${order.seat})` : ''}</div>
                                <Badge variant="outline" className={`status-badge status-${order.status}`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="space-y-1 mb-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="text-sm text-gray-300">• {item}</div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.id}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Seat Picker Overlay - Rendered conditionally outside the main grid */}
        <AnimatePresence>
          {showSeatPicker && selectedTable && (
             <SeatPickerOverlay
               table={selectedTable}
               onClose={handleCloseSeatPicker}
               onSelectSeat={handleSeatSelected}
             />
          )}
        </AnimatePresence>

      </div>
    </Shell>
  )
}
