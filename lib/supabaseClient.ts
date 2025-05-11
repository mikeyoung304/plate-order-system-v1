import { createBrowserClient } from '@supabase/ssr'

// Create real Supabase client for auth with cookie handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a real client for auth and user roles
const realClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const supabase = {
  // Use real auth methods with cookie handling
  auth: realClient.auth,
  
  // Hybrid data methods - real for user_roles, mock for everything else
  from: (table: string) => {
    // Use real client for user_roles table
    if (table === 'user_roles') {
      return realClient.from(table)
    }

    // Mock data methods for all other tables
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          execute: async () => ({ data: [], error: null })
        }),
        execute: async () => ({ data: [], error: null })
      }),
      insert: (data: any) => ({
        select: () => ({
          execute: async () => ({ data, error: null })
        }),
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
    }
  }
}

// Export a note about the mock
export const MOCK_NOTE = "This is a hybrid Supabase client that uses real authentication and user roles, but mocked data methods for other tables.";