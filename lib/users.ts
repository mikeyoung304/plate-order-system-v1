import { supabase } from './supabase/client'

// Type definitions
export type User = {
  id: string
  name: string
}

/**
 * Fetches all users with the 'resident' role from the database
 * @returns Array of residents
 */
export async function getAllResidents(): Promise<User[]> {
  // Get all residents from profiles
  const { data: residents, error } = await supabase
    .from('profiles')
    .select('user_id, name')
    .eq('role', 'resident')

  if (error) {
    throw new Error(`Failed to fetch residents: ${error.message}`)
  }

  if (!residents) {
    return []
  }

  // Transform the data into the expected format
  return residents.map(resident => ({
    id: resident.user_id,
    name: resident.name,
  }))
} 