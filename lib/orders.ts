import { supabase } from './supabase/client';

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

  return data.map((order: OrderRow) => ({
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

export async function updateOrderStatus(orderId: string, status: OrderRow['status']): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}