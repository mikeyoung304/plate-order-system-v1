"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchRecentOrders, type Order } from "@/lib/orders";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initial load of orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRecentOrders(50); // Get up to 50 recent orders
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        toast({ 
          title: 'Error', 
          description: 'Could not load orders. Please refresh the page.', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [toast]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-4">Kitchen View</h1>
      <ScrollArea className="h-[80vh]">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-gray-800/50 border-gray-700/30 animate-pulse">
                <CardContent className="h-24"></CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <p className="text-gray-400">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className={`bg-gray-800/50 border-gray-700/30 kds-order kds-order-${order.status}`}>
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <div className="text-lg font-semibold text-white">{order.table}, Seat {order.seat}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      {order.items && order.items.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`status-badge status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}