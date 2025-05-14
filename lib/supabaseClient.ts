import { createBrowserClient } from '@supabase/ssr'

// Create real Supabase client for auth with cookie handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a real client for all operations
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Export a note about the mock
export const MOCK_NOTE = "This is a hybrid Supabase client that uses real authentication and user roles, but mocked data methods for other tables.";