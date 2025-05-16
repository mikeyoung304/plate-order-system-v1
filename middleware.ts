import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetch.bind(globalThis)
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    }
  )

  // Look for both possible cookie names
  const accessToken = request.cookies.get('sb-access-token')?.value || 
                      request.cookies.get('sb-auth-token')?.value

  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  
  if (accessToken) {
    // Set the auth cookie for this client session
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    })
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/auth/callback']
  const pathname = request.nextUrl.pathname
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // API routes are handled separately
  if (pathname.startsWith('/api/')) {
    return response
  }

  // Check authentication for all other routes
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check role-specific access for protected routes
  // A more robust version would pull this from a central config
  if (pathname.startsWith('/server') || pathname.startsWith('/kitchen')) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
        
      if (error || !data) {
        console.error('Error fetching user role:', error)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      // Validate role access to server routes
      if (pathname.startsWith('/server') && data.role !== 'server') {
        return NextResponse.redirect(new URL('/dashboard', request.url)) 
      }
      
      // Validate role access to kitchen routes
      if (pathname.startsWith('/kitchen') && data.role !== 'cook') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Role validation error:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 