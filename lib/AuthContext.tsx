"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

type AppRole = 'server' | 'cook'

type AuthContextType = {
  user: User | null
  loading: boolean
  userRole: string | null
  userName: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: AppRole) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (data) {
        setUserRole(data.role)
        setUserName(data.name)
        return data
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Handle redirection based on user role
  const handleRoleBasedRedirection = (role: string | null) => {
    // Don't redirect if we're already on a valid page for the role
    const pathname = window.location.pathname
    
    // If already on a valid path for the role, don't redirect
    if (pathname.startsWith('/dashboard') || 
        (role === 'server' && pathname.startsWith('/server')) || 
        (role === 'cook' && pathname.startsWith('/kitchen'))) {
      return
    }
    
    // Default to dashboard, but redirect to role-specific page if on root
    if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
      if (role === 'server') {
        router.push('/server')
      } else if (role === 'cook') {
        router.push('/kitchen')
      } else {
        router.push('/dashboard')
      }
    }
  }

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      setUser(session?.user ?? null)
      
      // Use setTimeout to avoid Supabase deadlock
      setTimeout(async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          handleRoleBasedRedirection(profile?.role)
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null)
          setUserName(null)
          router.push('/')
        }
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string, role: AppRole) => {
    // Sign up the user with metadata including role and name
    const { error: signUpError, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: name,
          role: role // This will be used by the trigger to set the user's role
        }
      }
    })
    if (signUpError) throw signUpError
  }

  const signOut = async () => {
    try {
      setLoading(true); // Show loading state during sign out
      
      // First try server-side signout to clear cookies
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'same-origin',
        });
      } catch (serverError) {
        console.error('Server-side signout error:', serverError);
        // Continue with client-side signout even if server-side fails
      }
      
      // Clear client-side session
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      
      // Clear local state
      setUser(null);
      setUserRole(null);
      setUserName(null);
      
      // Force page refresh to ensure everything is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ title: 'Sign out error', description: 'Failed to sign out properly', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userName, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 