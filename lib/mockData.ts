// Mock data client that mimics Supabase's interface
export const mockDataClient = {
  from: (table: string) => ({
    select: () => ({
      eq: (column: string, value: any) => ({
        single: async () => ({ data: null, error: null }),
        execute: async () => ({ data: [], error: null })
      }),
      execute: async () => ({ data: [], error: null })
    }),
    insert: (data: any) => ({
      execute: async () => ({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        execute: async () => ({ data: null, error: null })
      }),
      execute: async () => ({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        execute: async () => ({ data: null, error: null })
      }),
      execute: async () => ({ data: null, error: null })
    })
  })
}

// Export a note about the mock
export const MOCK_NOTE = "This is a mock data client that mimics Supabase's interface but returns empty data.";

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
  // Transcribe audio to text
  transcribeAudio: async (audioBlob: Blob) => {
    // Simulate network delay for transcription
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockTranscription(audioBlob);
  }
}; 