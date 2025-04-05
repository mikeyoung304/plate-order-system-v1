import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import { debug } from "../utils/debug";

// Interface matching the OrderSchema from backend (adjust if needed)
interface Order {
  id: number;
  table_id?: number;
  seat_number?: number;
  room_number?: string;
  resident_id?: number;
  details: string;
  status: string; // e.g., 'pending', 'in_progress', 'ready'
  created_at: string;
  meal_period?: string;
  order_type: string; // 'table', 'room_service', 'memory_care'
  // Add other relevant fields displayed on KDS
}

const DEBUG_OPTIONS = { component: "KitchenDisplay", timestamp: true };
const POLLING_INTERVAL = 5000; // Fetch orders every 5 seconds

const KitchenDisplay: React.FC = () => {
  // Fetch active orders (pending, in_progress)
  const {
    data: orders,
    isLoading,
    error,
    isFetching,
  } = useQuery<Order[]>({
    queryKey: ["activeOrders"],
    queryFn: async () => {
      debug.logApiCall("/api/orders/active", "GET", {}, DEBUG_OPTIONS);
      // Assuming '/api/orders/active' endpoint exists as planned or use filtering:
      // const response = await api.get('/api/orders?status=pending&status=in_progress');
      const response = await api.get("/api/orders/active");
      debug.info(
        `Fetched ${response.data.length} active orders`,
        DEBUG_OPTIONS,
      );
      return response.data;
    },
    refetchInterval: POLLING_INTERVAL, // Enable polling
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-dark-text">
          Kitchen Display System (KDS)
        </h2>
        <p className="text-dark-text-secondary">Loading active orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-dark-text">
          Kitchen Display System (KDS)
        </h2>
        <p className="text-red-400">
          Error loading orders: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-dark-text">
          Kitchen Display System (KDS)
        </h2>
        {isFetching && (
          <span className="text-xs text-blue-400 animate-pulse">
            Updating...
          </span>
        )}
      </div>
      {/* Grid for order cards - Adjust padding/scrollbar styling */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-dark-accent scrollbar-track-dark-primary">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            // Use consistent dark theme card styling
            <div
              key={order.id}
              className="bg-dark-secondary p-4 rounded-lg shadow-lg border border-dark-border flex flex-col justify-between hover:border-blue-700 transition-colors"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg text-dark-text truncate pr-2">
                    {" "}
                    {/* Add truncate */}
                    {order.order_type === "table"
                      ? `T${order.table_id} / S${order.seat_number}`
                      : `Room ${order.room_number || "N/A"}`}{" "}
                    {/* Shorten display */}
                  </span>
                  {/* Use consistent status badge styling */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "pending"
                        ? "bg-yellow-900 text-yellow-200 border border-yellow-700"
                        : order.status === "in_progress"
                          ? "bg-blue-900 text-blue-200 border border-blue-700"
                          : "bg-gray-700 text-gray-300 border border-gray-600" // Default/other status
                    }`}
                  >
                    {order.status.replace("_", " ").toUpperCase()}{" "}
                    {/* Format status */}
                  </span>
                </div>
                <p className="text-dark-text-secondary text-xs mb-3">
                  {" "}
                  {/* Smaller timestamp */}
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  | {order.meal_period}
                </p>
                <p className="text-dark-text text-sm whitespace-pre-wrap break-words">
                  {order.details}
                </p>{" "}
                {/* Added break-words */}
              </div>
              {/* Add button for Expeditor later */}
              {/* <button className="...">Mark Ready</button> */}
            </div>
          ))
        ) : (
          <p className="text-dark-text-secondary col-span-full text-center mt-10">
            No active orders.
          </p>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
