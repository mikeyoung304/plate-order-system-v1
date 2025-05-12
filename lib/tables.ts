import { createClient } from './supabase/client';
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

<<<<<<< HEAD
// Grid layout configuration
const GRID_CONFIG = {
  startX: 100,
  startY: 100,
  horizontalSpacing: 150,
  verticalSpacing: 150,
  tablesPerRow: 3
};

=======
>>>>>>> 70491df (Add tables and seats)
export async function fetchTables(): Promise<Table[]> {
  const supabase = createClient();
  
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

<<<<<<< HEAD
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
    
=======
  // Transform tables to match mock data format
  return tables.map((table): Table => {
    const defaults = table.type === 'circle' ? CIRCLE_TABLE_DEFAULTS : RECTANGLE_TABLE_DEFAULTS;
    
    // For circle tables, adjust x position based on label to match mock layout
    let x = 100, y = 100;
    
    if (table.type === 'circle') {
      x = 100 + ((table.label - 1) % 3) * 150;
      y = 100 + Math.floor((table.label - 1) / 3) * 150;
    }
    // For rectangle tables, adjust dimensions and position
    else {
      x = 100 + ((table.label - 4) % 2) * 200;
      y = 250 + Math.floor((table.label - 4) / 2) * 150;
    }

>>>>>>> 70491df (Add tables and seats)
    return {
      id: table.id,
      label: table.label.toString(),
      status: table.status as "available" | "occupied" | "reserved",
      type: table.type as "circle" | "rectangle" | "square",
      seats: seatCountMap[table.id] || 0,
<<<<<<< HEAD
      x: x + extraSpacing,
=======
      x,
>>>>>>> 70491df (Add tables and seats)
      y,
      ...defaults
    };
  });
} 