import { createClient } from '@supabase/supabase-js'

// Type definitions
type OrderSuggestion = {
  items: string[]
  frequency: number
}

/**
 * Get order suggestions for a user based on their order history
 * @param userId - The ID of the user to get suggestions for
 * @param orderType - The type of order to analyze (e.g., 'food', 'drink')
 * @param limit - Maximum number of suggestions to return (default: 5)
 * @returns Array of order suggestions sorted by frequency
 */
export async function getOrderSuggestions(
  userId: string,
  orderType: string,
  limit: number = 5
): Promise<OrderSuggestion[]> {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch user's order history
  const { data: orders, error } = await supabase
    .from('orders')
    .select('items')
    .eq('resident_id', userId)
    .eq('type', orderType)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch order history: ${error.message}`)
  }

  if (!orders || orders.length === 0) {
    return []
  }

  // Create a frequency map of order combinations
  const orderFrequencyMap = new Map<string, OrderSuggestion>()

  orders.forEach(order => {
    const items = order.items as string[]
    // Sort items alphabetically to ensure consistent string representation
    const sortedItems = [...items].sort()
    const orderKey = JSON.stringify(sortedItems)

    const existing = orderFrequencyMap.get(orderKey)
    if (existing) {
      orderFrequencyMap.set(orderKey, {
        items: sortedItems,
        frequency: existing.frequency + 1
      })
    } else {
      orderFrequencyMap.set(orderKey, {
        items: sortedItems,
        frequency: 1
      })
    }
  })

  // Convert map to array and sort by frequency
  const suggestions = Array.from(orderFrequencyMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)

  return suggestions
} 