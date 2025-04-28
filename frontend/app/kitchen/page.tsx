"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/v1/orders?skip=0&limit=50');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast({ title: 'Error', description: 'Could not load orders.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-4">Kitchen View</h1>
      <ScrollArea className="h-[80vh]">
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-400">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="bg-gray-800/50 border-gray-700/30">
                <CardContent className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold text-white">Table {order.table_id}, Seat {order.seat_id}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      {order.items && order.items.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={
                      order.status === 'new' ? 'border-blue-500 text-blue-400' :
                      order.status === 'in_progress' ? 'border-amber-500 text-amber-400' :
                      'border-teal-500 text-teal-400'}>
                      {order.status}
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