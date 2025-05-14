import { createClient } from './supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface OrderRow {
  id: string;
  table_id: string;
  seat_id: string;
  resident_id: string;
  server_id: string;
  items: string[];
  transcript: string;
  status: 'new' | 'in_progress' | 'ready' | 'delivered';
  type: 'food' | 'drink';
  created_at: string;
  tables: {
    label: number;
  };
  seats: {
    label: number;
  };
}

export interface Order extends OrderRow {
  table: string;
  seat: number;
}

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables!inner(label),
      seats!inner(label)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data.map(order => ({
    ...order,
    table: `Table ${order.tables.label}`,
    seat: order.seats.label,
    items: order.items || []
  }));
}

export async function createOrder(orderData: {
  table_id: string;
  seat_id: string;
  resident_id: string;
  server_id: string;
  items: string[];
  transcript: string;
  type: 'food' | 'drink';
}): Promise<Order> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        ...orderData,
        status: 'new'
      }
    ])
    .select(`
      *,
      tables!inner(label),
      seats!inner(label)
    `)
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }

  return {
    ...data,
    table: `Table ${data.tables.label}`,
    seat: data.seats.label,
    items: data.items || []
  } as Order;
}

export function subscribeToOrders(
  callback: (order: Order) => void,
  errorCallback: (error: any) => void
) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      async (payload: RealtimePostgresChangesPayload<OrderRow>) => {
        if (!payload.new?.id) {
          return;
        }

        // Fetch the complete order data with table and seat info
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            tables!inner(label),
            seats!inner(label)
          `)
          .eq('id', payload.new.id)
          .single();

        if (error) {
          errorCallback(error);
          return;
        }

        callback({
          ...data,
          table: `Table ${data.tables.label}`,
          seat: data.seats.label,
          items: data.items || []
        } as Order);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
} 