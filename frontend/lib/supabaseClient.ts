import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client that doesn't connect to any backend
const createMockClient = () => {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          execute: async () => ({ data: [], error: null })
        }),
        execute: async () => ({ data: [], error: null })
      }),
      insert: () => ({
        execute: async () => ({ data: null, error: null })
      }),
      update: () => ({
        eq: () => ({
          execute: async () => ({ data: null, error: null })
        }),
        execute: async () => ({ data: null, error: null })
      }),
      delete: () => ({
        eq: () => ({
          execute: async () => ({ data: null, error: null })
        }),
        execute: async () => ({ data: null, error: null })
      })
    }),
    auth: {
      signIn: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  } as unknown as SupabaseClient;
};

export const supabase = createMockClient();

// Export a note about the mock
export const MOCK_NOTE = "This is a mock Supabase client and doesn't connect to any real backend.";