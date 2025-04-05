import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { debug } from "../utils/debug";
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // Use solid icon for action

// Interface matching the OrderSchema from backend (reuse or redefine if needed)
interface Order {
  id: number;
  table_id?: number;
  seat_number?: number;
  room_number?: string;
  details: string;
  status: string; // 'pending', 'in_progress', 'ready', 'completed'
  created_at: string;
  meal_period?: string;
  order_type: string;
}

const DEBUG_OPTIONS = { component: "ExpeditorView", timestamp: true };
const POLLING_INTERVAL = 7000; // Poll slightly less frequently than KDS

const ExpeditorView: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch orders ready for completion (e.g., status 'ready')
  const {
    data: orders,
    isLoading,
    error,
    isFetching,
  } = useQuery<Order[]>({
    queryKey: ["expeditorOrders"],
    queryFn: async () => {
      debug.logApiCall("/api/orders?status=ready", "GET", {}, DEBUG_OPTIONS); // Filter for 'ready' status
      const response = await api.get("/api/orders?status=ready"); // Adjust endpoint/params as needed
      debug.info(`Fetched ${response.data.length} ready orders`, DEBUG_OPTIONS);
      return response.data;
    },
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: true,
  });

  // Mutation to update order status to 'completed'
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      debug.logApiCall(
        `/api/orders/${orderId}`,
        "PUT",
        { status: "completed" },
        DEBUG_OPTIONS,
      );
      const response = await api.put(`/api/orders/${orderId}`, {
        status: "completed",
      });
      return response.data;
    },
    onSuccess: (data, orderId) => {
      debug.info(`Order ${orderId} marked as completed`, DEBUG_OPTIONS);
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["expeditorOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] }); // Refresh KDS too
    },
    onError: (error: any, orderId) => {
      debug.error(`Failed to complete order ${orderId}`, DEBUG_OPTIONS, error);
      alert(
        `Failed to mark order ${orderId} as completed: ${error.response?.data?.detail || error.message}`,
      );
    },
  });

  const handleCompleteOrder = (orderId: number) => {
    completeOrderMutation.mutate(orderId);
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-dark-text">
          Expeditor View
        </h2>
        <p className="text-dark-text-secondary">Loading ready orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-dark-text">
          Expeditor View
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
        <h2 className="text-2xl font-bold text-dark-text">Expeditor View</h2>
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
              className="bg-dark-secondary p-4 rounded-lg shadow-lg border border-dark-border flex flex-col justify-between hover:border-green-700 transition-colors"
            >
              {/* Order details (similar to KDS) */}
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200 border border-green-700`}
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
              {/* Complete Button - Dark Theme */}
              <button
                onClick={() => handleCompleteOrder(order.id)}
                disabled={
                  completeOrderMutation.isPending &&
                  completeOrderMutation.variables === order.id
                }
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-700 text-white px-3 py-2 rounded-md hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="h-5 w-5" />
                {completeOrderMutation.isPending &&
                completeOrderMutation.variables === order.id
                  ? "Completing..."
                  : "Mark Completed"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-dark-text-secondary col-span-full text-center mt-10">
            No orders ready for expediting.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpeditorView;
