import { supabase } from './supabase'
import { mockSignIn, mockSignUp, mockGetCurrentUser, mockSignOut } from './mock-auth'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return !!user && user.role === 'admin'
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
}

export async function signUp(email: string, password: string, name: string) {
  // Use mock auth if Supabase not configured
  if (!isSupabaseConfigured()) {
    return mockSignUp(email, password, name)
  }

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to register')
  }
  
  return result.data
}

export async function signIn(email: string, password: string) {
  // Use mock auth if Supabase not configured
  if (!isSupabaseConfigured()) {
    return mockSignIn(email, password)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(error.message)
  } 
  return data
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    mockSignOut()
    return
  }

  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to sign out')
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // Use mock auth if Supabase not configured
  if (!isSupabaseConfigured()) {
    return mockGetCurrentUser()
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token
    const response = await fetch('/api/auth/user', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    const result = await response.json()
    
    if (!response.ok) {
      return null
    }
    
    return result.user
  } catch (error) {
    return null
  }
}