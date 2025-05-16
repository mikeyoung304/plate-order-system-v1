import { supabase } from './supabase/client';
import { Table } from './floor-plan-utils';

interface SupabaseTable {
  id: string;
  label: number;
  type: string;
  status: string;
}

interface SupabaseSeat {
  id: string;
  table_id: string;
  label: number;
  status: string;
}

// Default circle table dimensions from mock data
const CIRCLE_TABLE_DEFAULTS = {
  width: 80,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default'
};

// Default rectangle table dimensions from mock data
const RECTANGLE_TABLE_DEFAULTS = {
  width: 120,
  height: 80,
  rotation: 0,
  floor_plan_id: 'default'
};

// Grid layout configuration
const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  horizontalSpacing: 150,
  verticalSpacing: 150,
  tablesPerRow: 3
};

export async function fetchTables(): Promise<Table[]> {
  // Fetch tables and their seats in parallel
  const [tablesResponse, seatsResponse] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .order('label'),
    supabase
      .from('seats')
      .select('*')
  ]);

  if (tablesResponse.error) {
    console.error('Error fetching tables:', tablesResponse.error);
    throw new Error('Failed to fetch tables');
  }

  if (seatsResponse.error) {
    console.error('Error fetching seats:', seatsResponse.error);
    throw new Error('Failed to fetch seats');
  }

  const tables = tablesResponse.data as SupabaseTable[];
  const seats = seatsResponse.data as SupabaseSeat[];

  // Create a map of table_id to seat count
  const seatCountMap = seats.reduce((acc, seat) => {
    acc[seat.table_id] = (acc[seat.table_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transform tables to match mock data format with grid layout
  return tables.map((table, index): Table => {
    const defaults = table.type === 'circle' ? CIRCLE_TABLE_DEFAULTS : RECTANGLE_TABLE_DEFAULTS;
    
    // Calculate grid position
    const row = Math.floor(index / GRID_CONFIG.tablesPerRow);
    const col = index % GRID_CONFIG.tablesPerRow;
    
    // Calculate x and y coordinates based on grid position
    const x = GRID_CONFIG.startX + (col * GRID_CONFIG.horizontalSpacing);
    const y = GRID_CONFIG.startY + (row * GRID_CONFIG.verticalSpacing);
    
    // Add extra spacing for rectangle tables since they're wider
    const extraSpacing = table.type === 'rectangle' ? 30 : 0;
    
    return {
      id: table.id,
      label: table.label.toString(),
      status: table.status as "available" | "occupied" | "reserved",
      type: table.type as "circle" | "rectangle" | "square",
      seats: seatCountMap[table.id] || 0,
      x: x + extraSpacing,
      y,
      ...defaults
    };
  });
} 