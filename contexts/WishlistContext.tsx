'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true)
  const { user } = useAuth()

  // Use ref to prevent unnecessary localStorage saves
  const prevItemsRef = useRef<WishlistItem[]>([])
  const prevUserIdRef = useRef<string | null>(null)

  // Get user-specific wishlist key
  const getWishlistKey = () => {
    return user ? `webmall-wishlist-${user.id}` : 'webmall-wishlist-guest'
  }

  // Get auth token helper
  const getAuthToken = async () => {
    if (!user) return null
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Load wishlist from server for logged-in users
  const loadWishlistFromServer = async () => {
    if (!user) return null

    try {
      const token = await getAuthToken()
      if (!token) return null

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.items || []
      }
    } catch (error) {
      console.error('Error loading wishlist from server:', error)
    }
    return null
  }

  // Add item to server wishlist
  const addItemToServer = useCallback(async (productId: string) => {
    if (!user) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      })
    } catch (error) {
      console.error('Failed to add to server wishlist:', error)
    }
  }, [user, getAuthToken])

  // Remove item from server wishlist
  const removeItemFromServer = useCallback(async (productId: string) => {
    if (!user) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Failed to remove from server wishlist:', error)
    }
  }, [user, getAuthToken])

  // Clear server wishlist
  const clearServerWishlist = useCallback(async () => {
    if (!user) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Failed to clear server wishlist:', error)
    }
  }, [user, getAuthToken])

  // Load wishlist when component mounts or user changes
  useEffect(() => {
    const loadWishlist = async () => {
      setIsLoadingWishlist(true)

      if (user) {
        // User is logged in - load from server
        const serverItems = await loadWishlistFromServer()

        if (serverItems) {
          setItems(serverItems)
          // Update localStorage for consistency
          const wishlistKey = getWishlistKey()
          localStorage.setItem(wishlistKey, JSON.stringify(serverItems))
        } else {
          // Fallback to localStorage if server fails
          const wishlistKey = getWishlistKey()
          const savedWishlist = localStorage.getItem(wishlistKey)
          if (savedWishlist) {
            try {
              setItems(JSON.parse(savedWishlist))
            } catch (error) {
              console.error('Error parsing wishlist:', error)
              setItems([])
            }
          } else {
            setItems([])
          }
        }
      } else {
        // Guest user - load from localStorage only
        const wishlistKey = getWishlistKey()
        const savedWishlist = localStorage.getItem(wishlistKey)

        if (savedWishlist) {
          try {
            setItems(JSON.parse(savedWishlist))
          } catch (error) {
            console.error('Error parsing wishlist:', error)
            setItems([])
          }
        } else {
          setItems([])
        }
      }

      setIsLoadingWishlist(false)
    }

    loadWishlist()
  }, [user])

  // Save wishlist to localStorage whenever items change (with optimization to prevent unnecessary saves)
  useEffect(() => {
    // Skip during initial load
    if (isLoadingWishlist) return

    const currentUserId = user?.id || null
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items)
    const userChanged = prevUserIdRef.current !== currentUserId

    // Only save if items actually changed or user changed
    if (itemsChanged || userChanged) {
      const wishlistKey = getWishlistKey()
      localStorage.setItem(wishlistKey, JSON.stringify(items))

      // Update refs to current values
      prevItemsRef.current = items
      prevUserIdRef.current = currentUserId
    }
  }, [items, user, isLoadingWishlist])

  // Define showToast first since other functions depend on it
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const addItem = useCallback((newItem: Omit<WishlistItem, 'id' | 'addedAt'>) => {
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

    // Add to server for logged-in users
    addItemToServer(newItem.productId)
  }, [items, addItemToServer])

  const removeItem = useCallback((productId: string) => {
    const itemToRemove = items.find(item => item.productId === productId)
    setItems(prev => prev.filter(item => item.productId !== productId))
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from wishlist`, 'info')
      // Remove from server for logged-in users
      removeItemFromServer(productId)
    }
  }, [items, removeItemFromServer])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.productId === productId)
  }, [items])

  const clearWishlist = useCallback(() => {
    setItems([])
    showToast('Wishlist cleared', 'info')
    // Clear server wishlist for logged-in users
    clearServerWishlist()
  }, [clearServerWishlist])

  const totalItems = items.length

  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
    totalItems,
    showToast,
  }), [items, addItem, removeItem, isInWishlist, clearWishlist, totalItems, showToast])

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className={`h-5 w-5 rounded-full ${toast.type === 'success' ? 'bg-green-500' :
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
