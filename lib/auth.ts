import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  email_verified?: boolean
  profileImage?: string
  phone?: string
  birthday?: string
  address?: string
}

export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return !!user && user.role === 'admin'
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'customer' } // Default role
    }
  })

  if (error) throw new Error(error.message)
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return null

    // Get user details from public.User table or metadata
    // For now, let's use metadata since we set it during signup
    // Or fetch from your database if you sync users
    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('supabaseId', session.user.id)
      .single()

    return {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata.name,
      role: profile?.role || session.user.user_metadata.role || 'customer',
      email_verified: !!session.user.email_confirmed_at
    }
  } catch (error) {
    return null
  }
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  // Handle mock tokens for development when Supabase is not configured
  if (!isSupabaseConfigured()) {
    if (token === 'mock-admin-token') {
      return {
        id: 'mock-admin-id',
        email: 'admin@webmall.com',
        name: 'Admin User',
        role: 'admin',
        email_verified: true
      }
    }
    if (token === 'mock-customer-token') {
      return {
        id: 'mock-customer-id',
        email: 'customer@webmall.com',
        name: 'Customer User',
        role: 'customer',
        email_verified: true
      }
    }
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return null

    // Get user details from public.User table or metadata
    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('supabaseId', user.id)
      .single()

    return {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata.name,
      role: profile?.role || user.user_metadata.role || 'customer',
      email_verified: !!user.email_confirmed_at
    }
  } catch (error) {
    console.error('Error verifying auth token:', error)
    return null
  }
}
