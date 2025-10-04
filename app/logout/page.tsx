'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function LogoutPage() {
  const { signOut } = useAuth()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut()
        // Redirect to home page after logout
        window.location.href = '/'
      } catch (error) {
        console.error('Logout error:', error)
        // Redirect anyway
        window.location.href = '/'
      }
    }

    handleLogout()
  }, [signOut])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}
