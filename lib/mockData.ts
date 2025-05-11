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