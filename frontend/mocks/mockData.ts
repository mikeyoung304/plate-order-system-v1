// Mock data for the application to replace backend API calls

// Mock tables for floor plans
export const mockTables = {
  default: [
    {
      id: "table-1",
      floor_plan_id: "default",
      label: "1",
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-2",
      floor_plan_id: "default",
      label: "2",
      x: 250,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-3",
      floor_plan_id: "default",
      label: "3",
      x: 400,
      y: 100,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-4",
      floor_plan_id: "default",
      label: "4",
      x: 100,
      y: 250,
      width: 120,
      height: 80,
      type: "rectangle",
      seats: 6,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-5",
      floor_plan_id: "default",
      label: "5",
      x: 300,
      y: 250,
      width: 120,
      height: 80,
      type: "rectangle",
      seats: 6,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-6",
      floor_plan_id: "default",
      label: "6",
      x: 100,
      y: 400,
      width: 140,
      height: 80,
      type: "rectangle",
      seats: 8,
      rotation: 0,
      status: "available"
    },
    {
      id: "table-7",
      floor_plan_id: "default",
      label: "7",
      x: 300,
      y: 400,
      width: 80,
      height: 80,
      type: "circle",
      seats: 4,
      rotation: 0,
      status: "available"
    }
  ]
};

// Mock orders
export const mockOrders = [
  {
    id: "ord-001",
    table_id: "table-5",
    seat_id: 2,
    items: ["Grilled Salmon", "Caesar Salad"],
    transcript: "I'd like the grilled salmon and a caesar salad",
    status: "ready",
    type: "food",
    created_at: new Date(Date.now() - 5 * 60000).toISOString() // 5 minutes ago
  },
  {
    id: "ord-002",
    table_id: "table-3",
    seat_id: 1,
    items: ["Ribeye Steak", "Mashed Potatoes"],
    transcript: "I'll have the ribeye steak and mashed potatoes",
    status: "cooking",
    type: "food",
    created_at: new Date(Date.now() - 12 * 60000).toISOString() // 12 minutes ago
  },
  {
    id: "ord-003",
    table_id: "table-8",
    seat_id: 4,
    items: ["Vegetable Pasta"],
    transcript: "I would like the vegetable pasta please",
    status: "new",
    type: "food",
    created_at: new Date(Date.now() - 15 * 60000).toISOString() // 15 minutes ago
  },
  {
    id: "ord-004",
    table_id: "table-2",
    seat_id: 3,
    items: ["Margarita", "Chips and Salsa"],
    transcript: "a margarita and chips and salsa please",
    status: "ready",
    type: "drink",
    created_at: new Date(Date.now() - 8 * 60000).toISOString() // 8 minutes ago
  },
  {
    id: "ord-005",
    table_id: "table-1",
    seat_id: 1,
    items: ["Chocolate Cake", "Coffee"],
    transcript: "I'll have the chocolate cake and a coffee",
    status: "new",
    type: "food",
    created_at: new Date(Date.now() - 3 * 60000).toISOString() // 3 minutes ago
  }
];

// Helper function to generate a mock order ID
let orderIdCounter = 6;
export const generateOrderId = () => {
  return `ord-${String(orderIdCounter++).padStart(3, '0')}`;
};

// Mock response for voice transcription
export const mockTranscription = (audioBlob: Blob) => {
  // Generate a semi-random response based on audio blob size
  const size = audioBlob.size;
  
  // Predefined responses based on different audio blob sizes
  const responses = [
    "I'd like the grilled salmon with a side salad, please.",
    "Can I get a cheeseburger medium rare with fries?",
    "I'll have the chicken alfredo pasta and a water, thank you.",
    "I would like the veggie pizza with extra mushrooms.",
    "Could I get the steak, medium, with mashed potatoes and asparagus?",
    "Just a coffee, black, and the chocolate cake for dessert."
  ];
  
  // Use audio size modulo to select a response, adding some variety
  const responseIndex = Math.abs(size % responses.length);
  
  return {
    text: responses[responseIndex]
  };
};

// Mock API functions that simulate backend behavior
export const mockAPI = {
  // Get tables for a floor plan
  getTables: async (floorPlanId: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockTables[floorPlanId as keyof typeof mockTables] || [];
  },
  
  // Update tables for a floor plan
  updateTables: async (floorPlanId: string, tables: any[]) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Update the mock tables
    if (floorPlanId in mockTables) {
      mockTables[floorPlanId as keyof typeof mockTables] = tables;
    }
    
    return tables;
  },
  
  // Get orders
  getOrders: async (params?: { skip?: number; limit?: number }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const skip = params?.skip || 0;
    const limit = params?.limit || 50;
    
    return mockOrders.slice(skip, skip + limit);
  },
  
  // Create a new order
  createOrder: async (orderData: any) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrder = {
      id: generateOrderId(),
      ...orderData,
      status: "new",
      created_at: new Date().toISOString()
    };
    
    // Add to the beginning of the mock orders array
    mockOrders.unshift(newOrder);
    
    return newOrder;
  },
  
  // Transcribe audio to text
  transcribeAudio: async (audioBlob: Blob) => {
    // Simulate network delay for transcription
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockTranscription(audioBlob);
  }
}; 