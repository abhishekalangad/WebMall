'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthUser, getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => Promise<void>
  accessToken: () => Promise<string | undefined>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)


  const refreshUser = async () => {
    if (isRefreshing) {
      return
    }

    setIsRefreshing(true)

    try {
      // Use Supabase auth with timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
      )

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      // If there's an error getting the session, clear it
      if (error) {
        console.warn('Session error, clearing:', error.message)
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setUser(null)
        return
      }

      setSupabaseUser(session?.user ?? null)

      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        // Fetch full profile from our server API (bypassing RLS)
        try {
          const res = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })

          if (res.ok) {
            const profileData = await res.json()
            // Map API/Prisma response (camelCase) to AuthUser
            const currentUser: AuthUser = {
              id: session.user.id,
              email: session.user.email!,
              role: profileData.role || 'customer',
              email_verified: !!session.user.email_confirmed_at,
              name: profileData.name || session.user.user_metadata.name,
              phone: profileData.phone,
              address: profileData.address,
              birthday: profileData.birthday,
              profileImage: profileData.profileImage
            }
            setUser(currentUser)
          } else {
            // Fallback to basic session data if API fails
            const basicUser = await getCurrentUser()
            setUser(basicUser)
          }
        } catch (e) {
          console.error('Failed to fetch profile via API', e)
          const basicUser = await getCurrentUser()
          setUser(basicUser)
        }
      } else {
        setUser(null)
      }
    } catch (error: any) {
      // Handle various error types
      const isAuthError = error?.message?.includes('refresh') ||
        error?.message?.includes('Invalid Refresh Token') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('fetch') ||
        error?.name === 'AuthApiError' ||
        error?.code === 'ECONNREFUSED'

      if (isAuthError) {
        // Clear the invalid session
        try {
          await supabase.auth.signOut()
        } catch (e) {
          // Ignore signout errors
        }
      } else {
        // Only log unexpected errors
        console.error('Auth refresh error:', error)
      }

      setUser(null)
      setSupabaseUser(null)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial auth check
    refreshUser()
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      setUser(null)
      setSupabaseUser(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signOut: handleSignOut,
        refreshUser,
        updateUser: async (updates: Partial<AuthUser>) => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
              throw new Error('No access token available')
            }

            // Update database via API
            const response = await fetch('/api/user/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updates)
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Failed to update profile')
            }

            const data = await response.json()

            // Update local state with response from server
            setUser(prev => prev ? { ...prev, ...data.user } : null)

            return data.user
          } catch (error) {
            console.error('Error updating user:', error)
            throw error
          }
        },
        accessToken: async () => {
          const { data: { session } } = await supabase.auth.getSession()
          return session?.access_token
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}