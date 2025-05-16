import { supabase } from "@/lib/supabase/client";

/**
 * Fetch a seat ID based on table and seat label
 */
export async function fetchSeatId(tableId: string, seatLabel: number): Promise<string | null> {
  const seatData = await supabase
    .from('seats')
    .select('id')
    .eq('table_id', tableId)
    .eq('label', seatLabel)
    .single();

  if (seatData.error || !seatData.data) {
    console.error('Error fetching seat:', seatData.error);
    return null;
  }

  return seatData.data.id;
}

/**
 * Seat interface
 */
export interface Seat {
  id: string;
  table_id: string;
  label: number;
  position_x: number;
  position_y: number;
  created_at?: string;
} 