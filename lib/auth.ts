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

export async function resetPasswordForEmail(email: string, redirectTo: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
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
      .from('users')
      .select('*')
      .eq('supabase_id', session.user.id)
      .maybeSingle()

    return {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata.name,
      role: profile?.role || session.user.user_metadata.role || 'customer',
      email_verified: !!session.user.email_confirmed_at,
      phone: profile?.phone || session.user.phone,
      address: profile?.address,
      birthday: profile?.birthday,
      profileImage: profile?.profileImage || profile?.profile_image
    }
  } catch (error) {
    return null
  }
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return null

    // Get user details from public.User table or metadata
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_id', user.id)
      .maybeSingle()

    return {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata.name,
      role: profile?.role || user.user_metadata.role || 'customer',
      email_verified: !!user.email_confirmed_at,
      phone: profile?.phone || user.phone,
      address: profile?.address,
      birthday: profile?.birthday,
      profileImage: profile?.profileImage || profile?.profile_image
    }
  } catch (error) {
    console.error('Error verifying auth token:', error)
    return null
  }
}
