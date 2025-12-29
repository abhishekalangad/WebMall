'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  currency: string
  image?: string
  slug: string
  category: string
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  totalItems: number
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { user } = useAuth()

  // Get user-specific wishlist key
  const getWishlistKey = () => {
    return user ? `webmall-wishlist-${user.id}` : 'webmall-wishlist-guest'
  }

  // Load wishlist from localStorage when user changes
  useEffect(() => {
    const wishlistKey = getWishlistKey()
    const savedWishlist = localStorage.getItem(wishlistKey)
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist))
      } catch (error) {
        console.error('Error parsing wishlist data:', error)
        setItems([])
      }
    } else {
      setItems([])
    }
  }, [user])

  // Save wishlist to localStorage whenever items change
  useEffect(() => {
    const wishlistKey = getWishlistKey()
    localStorage.setItem(wishlistKey, JSON.stringify(items))
  }, [items, user])

  // Clear wishlist when user logs out
  useEffect(() => {
    if (!user) {
      setItems([])
    }
  }, [user])

  const addItem = (newItem: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    if (isInWishlist(newItem.productId)) {
      showToast(`${newItem.name} is already in your wishlist!`, 'info')
      return
    }

    const wishlistItem: WishlistItem = {
      ...newItem,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    }

    setItems(prev => [...prev, wishlistItem])
    showToast(`${newItem.name} added to wishlist!`, 'success')
  }

  const removeItem = (productId: string) => {
    const itemToRemove = items.find(item => item.productId === productId)
    setItems(prev => prev.filter(item => item.productId !== productId))
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from wishlist`, 'info')
    }
  }

  const isInWishlist = (productId: string) => {
    return items.some(item => item.productId === productId)
  }

  const clearWishlist = () => {
    setItems([])
    showToast('Wishlist cleared', 'info')
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const totalItems = items.length

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
        totalItems,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className={`h-5 w-5 rounded-full ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
