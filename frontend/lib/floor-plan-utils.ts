// File: frontend/lib/floor-plan-utils.ts

// Frontend Table Type (matching editor/view)
export type Table = {
  id: string
  type: "circle" | "rectangle" | "square"
  x: number
  y: number
  width: number
  height: number
  seats: number
  label: string
  rotation?: number
  status?: "available" | "occupied" | "reserved"
  zIndex?: number
}

// Backend Table Type (matching editor/view)
export type BackendTable = {
    id: number;
    name: string;
    shape: "circle" | "rectangle" | "square";
    width: number;
    height: number;
    position_x: number;
    position_y: number;
    rotation: number;
    seat_count: number;
    zone?: string | null;
    status: "available" | "reserved" | "out_of_service";
    floor_plan_id: string;
};

// Backend Payloads (matching editor)
export type TableCreatePayload = {
    name: string;
    shape: "circle" | "rectangle" | "square";
    width: number;
    height: number;
    position_x: number;
    position_y: number;
    rotation: number;
    seat_count: number;
    zone?: string | null;
    status: "available" | "reserved" | "out_of_service";
    floor_plan_id: string;
};

export type TableUpdatePayload = {
    name?: string;
    shape?: "circle" | "rectangle" | "square";
    width?: number;
    height?: number;
    position_x?: number;
    position_y?: number;
    rotation?: number;
    seat_count?: number;
    zone?: string | null;
    status?: "available" | "reserved" | "out_of_service";
};


// Helper function to map backend table status to frontend status
export const mapBackendStatusToFrontend = (backendStatus: BackendTable['status']): Table['status'] => {
    switch (backendStatus) {
        case "available": return "available";
        case "reserved": return "reserved";
        case "out_of_service": return "reserved"; // Map OOS to reserved for now
        // Add mapping for 'occupied' if backend adds it
        default: return "available";
    }
};

// Helper function to map frontend table status to backend status
export const mapFrontendStatusToBackend = (frontendStatus: Table['status']): BackendTable['status'] => {
    switch (frontendStatus) {
        case "available": return "available";
        case "reserved": return "reserved";
        case "occupied": return "reserved"; // Map occupied to reserved for backend (adjust if backend adds 'occupied')
        default: return "available";
    }
};

// Helper function to map backend table structure to frontend
export const mapBackendTableToFrontend = (backendTable: BackendTable): Table => {
  return {
    id: `backend-${backendTable.id}`, // Prefix backend IDs to distinguish them
    type: backendTable.shape, // Direct mapping from shape to type
    x: backendTable.position_x,
    y: backendTable.position_y,
    width: backendTable.width,
    height: backendTable.height,
    seats: backendTable.seat_count,
    label: backendTable.name,
    rotation: backendTable.rotation || 0,
    status: mapBackendStatusToFrontend(backendTable.status),
    zIndex: 1, // zIndex might need to be fetched or managed differently
  };
};

// Helper function to map frontend table to backend CREATE payload
export const mapFrontendTableToCreatePayload = (table: Table, floorPlanId: string): TableCreatePayload => ({
    name: table.label,
    shape: table.type, // Map the frontend 'type' to backend 'shape' property
    width: table.width,
    height: table.height,
    position_x: table.x,
    position_y: table.y,
    rotation: table.rotation || 0,
    seat_count: table.seats,
    status: mapFrontendStatusToBackend(table.status || "available"),
    floor_plan_id: floorPlanId, // Add floor plan ID
    // zone: table.zone, // Add zone if implemented
});

// Helper function to map frontend table changes to backend UPDATE payload
export const mapFrontendTableToUpdatePayload = (frontendTable: Table, backendTable: BackendTable): TableUpdatePayload | null => {
    const payload: TableUpdatePayload = {};
    let hasChanges = false;

    // Compare relevant fields and add to payload if changed
    // Use Math.round for positions/dimensions to avoid tiny floating point differences triggering updates
    if (frontendTable.label !== backendTable.name) { payload.name = frontendTable.label; hasChanges = true; }
    if (frontendTable.type !== backendTable.shape) { payload.shape = frontendTable.type; hasChanges = true; }
    if (Math.round(frontendTable.width) !== Math.round(backendTable.width)) { payload.width = frontendTable.width; hasChanges = true; }
    if (Math.round(frontendTable.height) !== Math.round(backendTable.height)) { payload.height = frontendTable.height; hasChanges = true; }
    if (Math.round(frontendTable.x) !== Math.round(backendTable.position_x)) { payload.position_x = frontendTable.x; hasChanges = true; }
    if (Math.round(frontendTable.y) !== Math.round(backendTable.position_y)) { payload.position_y = frontendTable.y; hasChanges = true; }
    if (Math.round(frontendTable.rotation || 0) !== Math.round(backendTable.rotation || 0)) { payload.rotation = frontendTable.rotation || 0; hasChanges = true; }
    if (frontendTable.seats !== backendTable.seat_count) { payload.seat_count = frontendTable.seats; hasChanges = true; }
    const backendMappedStatus = mapFrontendStatusToBackend(frontendTable.status || "available");
    if (backendMappedStatus !== backendTable.status) { payload.status = backendMappedStatus; hasChanges = true; }
    // Add zone comparison if implemented: if (frontendTable.zone !== backendTable.zone) { payload.zone = frontendTable.zone; hasChanges = true; }

    return hasChanges ? payload : null;
};