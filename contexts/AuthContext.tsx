'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const isRefreshingRef = useRef(false)

  /**
   * Fetch the full user profile from our API and update state.
   * Falls back to basic session data if the API call fails.
   */
  const loadUserProfile = async (sbUser: User, accessToken: string) => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (res.ok) {
        const profileData = await res.json()
        setUser({
          id: sbUser.id,
          email: sbUser.email!,
          role: profileData.role || 'customer',
          email_verified: !!sbUser.email_confirmed_at,
          name: profileData.name || sbUser.user_metadata?.name,
          phone: profileData.phone,
          address: profileData.address,
          birthday: profileData.birthday,
          profileImage: profileData.profileImage
        })
      } else {
        // Fallback: build from session metadata
        const basicUser = await getCurrentUser()
        setUser(basicUser)
      }
    } catch {
      const basicUser = await getCurrentUser()
      setUser(basicUser)
    }
  }

  /**
   * Clear all auth state and wipe the Supabase session.
   * Safe to call even if already signed out.
   */
  const clearSession = async () => {
    setUser(null)
    setSupabaseUser(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore sign-out errors — session may already be gone
    }
  }

  /**
   * Manually refresh user data (e.g. after a profile update).
   * Debounced to prevent concurrent calls.
   */
  const refreshUser = async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        // Invalid/expired refresh token — clear stale session silently
        await clearSession()
        return
      }

      if (session?.user) {
        setSupabaseUser(session.user)
        await loadUserProfile(session.user, session.access_token)
      } else {
        setUser(null)
        setSupabaseUser(null)
      }
    } catch (err: any) {
      const isTokenError =
        err?.message?.includes('refresh') ||
        err?.message?.includes('Refresh Token') ||
        err?.name === 'AuthApiError'

      if (isTokenError) {
        await clearSession()
      } else {
        console.error('Auth refresh error:', err)
        setUser(null)
        setSupabaseUser(null)
      }
    } finally {
      setLoading(false)
      isRefreshingRef.current = false
    }
  }

  useEffect(() => {
    // Suppress and handle Supabase auto-refresh background errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      if (err && err.name === 'AuthApiError' && (err.message.includes('Refresh Token') || err.message.includes('refresh'))) {
        event.preventDefault(); // Prevent Next.js error overlay
        console.warn('Caught invalid refresh token error, clearing session...');
        
        // Clear local storage manually to break the refresh loop
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
        
        clearSession().then(() => {
           window.location.reload();
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // ── 1. Subscribe to auth state changes (the canonical Supabase pattern) ──
    // This fires immediately with the current session and on every future change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSupabaseUser(null)
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            setSupabaseUser(session.user)
            await loadUserProfile(session.user, session.access_token)
          } else {
            // INITIAL_SESSION with no session = user is logged out
            setUser(null)
            setSupabaseUser(null)
          }
          setLoading(false)
          return
        }

        if (event === 'USER_UPDATED') {
          if (session?.user) {
            setSupabaseUser(session.user)
            await loadUserProfile(session.user, session.access_token)
          }
          setLoading(false)
        }
      }
    )

    // ── 2. Cleanup subscription on unmount ──
    return () => {
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    setLoading(true)
    try {
      // Clear cart data from localStorage before signing out
      const cartKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('webmall-cart-')
      )
      cartKeys.forEach(key => localStorage.removeItem(key))

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