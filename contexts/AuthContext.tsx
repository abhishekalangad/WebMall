'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthUser, getCurrentUser } from '@/lib/auth'
import { mockGetCurrentUser } from '@/lib/mock-auth'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
             process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
  }

  const refreshUser = async () => {
    if (isRefreshing) {
      return
    }
    
    setIsRefreshing(true)
    
    try {
      if (!isSupabaseConfigured()) {
        // Use mock auth
        const mockUser = mockGetCurrentUser()
        setUser(mockUser)
        setSupabaseUser(null)
        setLoading(false)
        setIsRefreshing(false)
        return
      }

      // Use Supabase auth
      const { data: { session } } = await supabase.auth.getSession()
      setSupabaseUser(session?.user ?? null)
      
      if (session?.user) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
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
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut()
      } else {
        localStorage.removeItem('user')
      }
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