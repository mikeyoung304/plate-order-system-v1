import { createBrowserClient } from '@supabase/ssr'

// Create real Supabase client for auth with cookie handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a hybrid client that uses real auth but mock data
const realClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const supabase = {
  // Use real auth methods with cookie handling
  auth: realClient.auth,
  
  // Keep mock data methods
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
  })
}

// Export a note about the mock
export const MOCK_NOTE = "This is a hybrid Supabase client that uses real authentication but mocked data methods.";