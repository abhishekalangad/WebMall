'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import Decimal from 'decimal.js'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  image?: string
  slug: string
  variantName?: string
  variantAttributes?: Record<string, string>
  originalPrice?: number
  maxStock?: number
  isDeleted?: boolean
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, variantId?: string, itemId?: string) => void
  removeUnavailableItems: () => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  refreshCartData: () => Promise<void>
  totalItems: number
  totalPrice: number
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isLoadingCart, setIsLoadingCart] = useState(true)
  const { user } = useAuth()

  // Use ref to prevent unnecessary localStorage saves
  const prevItemsRef = useRef<CartItem[]>([])
  const prevUserIdRef = useRef<string | null>(null)
  // Track whether a server update is in flight to avoid overwriting optimistic state
  const isSyncingRef = useRef(false)

  // Define showToast early since other callbacks depend on it
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Get user-specific cart key
  const getCartKey = useCallback(() => {
    return user ? `webmall-cart-${user.id}` : 'webmall-cart-guest'
  }, [user])

  // Get auth token helper
  const getAuthToken = useCallback(async () => {
    if (!user) return null
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }, [user])

  // Load cart from server for logged-in users
  const loadCartFromServer = useCallback(async () => {
    if (!user) return null

    try {
      const token = await getAuthToken()
      if (!token) return null

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.items || []
      }
    } catch (error) {
      console.error('Error loading cart from server:', error)
    }
    return null
  }, [user, getAuthToken])

  // Sync local cart with server
  const syncCartWithServer = useCallback(async (localItems: CartItem[]) => {
    if (!user || localItems.length === 0) return

    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: localItems })
      })

      if (response.ok) {
        const data = await response.json()
        return data.items || []
      }
    } catch (error) {
      console.error('Failed to sync cart with server:', error)
    }
    return null
  }, [user, getAuthToken])

  // Update server cart on item changes
  const updateServerCart = useCallback(async (action: string, productId: string, quantity: number, variantId?: string, variantName?: string, variantAttributes?: Record<string, string>, maxStock?: number, itemId?: string) => {
    if (!user) return

    isSyncingRef.current = true
    try {
      const token = await getAuthToken()
      if (!token) return

      await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, productId, quantity, variantId, variantName, variantAttributes, maxStock, itemId })
      })
    } catch (error) {
      console.error('Failed to update server cart:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [user, getAuthToken])

  // Helper to deduplicate cart items by productId + variantId
  const deduplicateCartItems = useCallback((raw: CartItem[]): CartItem[] => {
    const map = new Map<string, CartItem>()
    for (const item of raw) {
      const key = `${item.productId}_${item.variantId || 'base'}`
      const existing = map.get(key)
      if (existing) {
        const combinedQty = (Number(existing.quantity) || 0) + (Number(item.quantity) || 0)
        const maxStock = item.maxStock ?? existing.maxStock
        existing.quantity = maxStock !== undefined ? Math.min(combinedQty, maxStock) : combinedQty
      } else {
        map.set(key, { ...item })
      }
    }
    return Array.from(map.values())
  }, [])

  // Load cart when component mounts or user changes
  useEffect(() => {
    const loadCart = async () => {
      // SECURITY: Clear all other users' carts from localStorage
      if (user) {
        const allCartKeys = Object.keys(localStorage).filter(key => key.startsWith('webmall-cart-'))
        const currentCartKey = getCartKey()
        allCartKeys.forEach(key => {
          if (key !== currentCartKey) {
            localStorage.removeItem(key)
          }
        })
      }

      setIsLoadingCart(true)

      if (user) {
        // User is logged in - load from server
        const serverItems = await loadCartFromServer()

        if (serverItems) {
          // Check if there's a guest cart to merge
          const guestCartKey = 'webmall-cart-guest'
          const guestCart = localStorage.getItem(guestCartKey)

          if (guestCart) {
            try {
              const guestItems = JSON.parse(guestCart)
              // Merge guest cart with server cart
              const mergedItems = await syncCartWithServer(guestItems)
              setItems(deduplicateCartItems(mergedItems || serverItems))
              // Clear guest cart after merging
              localStorage.removeItem(guestCartKey)
            } catch (error) {
              console.error('Error merging carts:', error)
              setItems(deduplicateCartItems(serverItems))
            }
          } else {
            setItems(deduplicateCartItems(serverItems))
          }

          // Update localStorage for consistency
          const cartKey = getCartKey()
          localStorage.setItem(cartKey, JSON.stringify(serverItems))
        } else {
          // Fallback to localStorage if server fails
          const cartKey = getCartKey()
          const savedCart = localStorage.getItem(cartKey)
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart)
              setItems(deduplicateCartItems(parsedCart))
              // Try to sync with server in background
              syncCartWithServer(parsedCart)
            } catch (error) {
              console.error('Error parsing cart:', error)
              setItems([])
            }
          } else {
            setItems([])
          }
        }
      } else {
        // Guest user - load from localStorage only
        const cartKey = getCartKey()
        const savedCart = localStorage.getItem(cartKey)

        if (savedCart) {
          try {
            setItems(deduplicateCartItems(JSON.parse(savedCart)))
          } catch (error) {
            console.error('Error parsing cart:', error)
            setItems([])
          }
        } else {
          setItems([])
        }
      }

      setIsLoadingCart(false)
    }

    loadCart()
  }, [user, getCartKey, loadCartFromServer, syncCartWithServer, deduplicateCartItems])

  // Sync cart when user switches back to browser tab (e.g. after adding item on mobile)
  useEffect(() => {
    if (!user) return

    const handleTabFocus = async () => {
      // Skip refetch if a user-triggered update is still in flight
      if (isSyncingRef.current) return
      const serverItems = await loadCartFromServer()
      if (serverItems) {
        setItems(deduplicateCartItems(serverItems))
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleTabFocus()
      }
    }

    window.addEventListener('focus', handleTabFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleTabFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user, loadCartFromServer, deduplicateCartItems])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoadingCart) return

    const currentUserId = user?.id || null
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items)
    const userChanged = prevUserIdRef.current !== currentUserId

    if (itemsChanged || userChanged) {
      const cartKey = getCartKey()
      localStorage.setItem(cartKey, JSON.stringify(items))

      prevItemsRef.current = items
      prevUserIdRef.current = currentUserId
    }
  }, [items, user, isLoadingCart, getCartKey])

  const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    const quantityToAdd = Number(newItem.quantity) || 1

    setItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.productId === newItem.productId &&
        ((item.variantId || null) === (newItem.variantId || null))
      )
      if (existingItem) {
        const proposedQuantity = (Number(existingItem.quantity) || 0) + quantityToAdd
        const newQuantity = existingItem.maxStock !== undefined ? Math.min(proposedQuantity, existingItem.maxStock) : proposedQuantity

        const updatedItems = prevItems.map(item =>
          item.productId === newItem.productId && ((item.variantId || null) === (newItem.variantId || null))
            ? { ...item, quantity: newQuantity, maxStock: newItem.maxStock ?? item.maxStock }
            : item
        )

        if (existingItem.maxStock !== undefined && proposedQuantity > existingItem.maxStock) {
           showToast(`Added max available quantity to cart`, 'info')
        } else {
           showToast(`${newItem.name} quantity updated in cart!`, 'success')
        }

        updateServerCart('update', newItem.productId, newQuantity, newItem.variantId, newItem.variantName, newItem.variantAttributes, newItem.maxStock ?? existingItem.maxStock)
        return updatedItems
      } else {
        const newItems = [...prevItems, { ...newItem, quantity: quantityToAdd, id: Date.now().toString() }]
        showToast(`${newItem.name} added to cart!`, 'success')
        updateServerCart('add', newItem.productId, quantityToAdd, newItem.variantId, newItem.variantName, newItem.variantAttributes, newItem.maxStock)
        return newItems
      }
    })
  }, [updateServerCart, showToast])

  const removeItem = useCallback((productId: string, variantId?: string, itemId?: string) => {
    const itemToRemove = items.find(item =>
      (itemId && item.id === itemId) ||
      (item.productId === productId && (variantId ? item.variantId === variantId : true))
    )

    setItems(prevItems => prevItems.filter(item => {
      if (itemId && item.id === itemId) return false
      if (item.productId !== productId) return true
      if (variantId && item.variantId !== variantId) return true
      return false
    }))

    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from cart`, 'info')
      updateServerCart('remove', productId, 0, variantId, undefined, undefined, undefined, itemId || itemToRemove.id)
    }
  }, [items, updateServerCart, showToast])

  const removeUnavailableItems = useCallback(() => {
    const unavailableItems = items.filter(item =>
      item.maxStock === 0 || item.isDeleted || item.name.includes('Discontinued') || item.name.includes('No Longer Available')
    )

    if (unavailableItems.length === 0) return

    setItems(prevItems => prevItems.filter(item =>
      !(item.maxStock === 0 || item.isDeleted || item.name.includes('Discontinued') || item.name.includes('No Longer Available'))
    ))

    showToast(`Removed ${unavailableItems.length} unavailable item(s) from cart`, 'info')

    unavailableItems.forEach(item => {
      updateServerCart('remove', item.productId, 0, item.variantId, undefined, undefined, undefined, item.id)
    })
  }, [items, updateServerCart, showToast])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const newQuantity = Number(quantity)
    if (isNaN(newQuantity) || newQuantity <= 0) {
      setItems(prevItems => prevItems.filter(item =>
        !(item.productId === productId && item.variantId === variantId)
      ))
      return
    }

    const itemToUpdate = items.find(item =>
      item.productId === productId && item.variantId === variantId
    )

    let finalQuantity = newQuantity
    if (itemToUpdate && itemToUpdate.maxStock !== undefined && newQuantity > itemToUpdate.maxStock) {
       finalQuantity = itemToUpdate.maxStock
       showToast(`Only ${itemToUpdate.maxStock} units available`, 'error')
       if (itemToUpdate.quantity === itemToUpdate.maxStock) return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: finalQuantity }
          : item
      )
    )

    if (itemToUpdate) {
      updateServerCart('update', productId, finalQuantity, variantId, itemToUpdate.variantName, itemToUpdate.variantAttributes, itemToUpdate.maxStock)
    }
  }, [items, updateServerCart, showToast])

  const clearCart = useCallback(async () => {
    setItems([])
    showToast('Cart cleared', 'info')

    if (user) {
      try {
        const token = await getAuthToken()
        if (token) {
          await fetch('/api/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        }
      } catch (error) {
        console.error('Failed to clear server cart:', error)
      }
    }
  }, [user, getAuthToken, showToast])

  const refreshCartData = useCallback(async () => {
    if (user) {
      const token = await getAuthToken()
      if (token) {
        const response = await fetch('/api/cart', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.items) {
            setItems(data.items)
          }
        }
      }
    } else {
      // For guests: re-read from localStorage (already loaded on mount)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getAuthToken])

  const totalItems = items.reduce((sum, item) => {
    if (item.maxStock === 0 || item.isDeleted || item.name === 'Unknown Product' || item.name === 'Product No Longer Available') {
      return sum
    }
    return sum + (Number(item.quantity) || 0)
  }, 0)

  const totalPrice = items.reduce((sum, item) => {
    if (item.maxStock === 0 || item.isDeleted || item.name === 'Unknown Product' || item.name === 'Product No Longer Available') {
      return sum
    }
    const price = new Decimal(item.price || 0)
    const quantity = new Decimal(item.quantity || 0)
    return sum.plus(price.times(quantity))
  }, new Decimal(0)).toNumber()

  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    removeUnavailableItems,
    updateQuantity,
    clearCart,
    refreshCartData,
    totalItems,
    totalPrice,
    showToast,
  }), [items, addItem, removeItem, removeUnavailableItems, updateQuantity, clearCart, refreshCartData, totalItems, totalPrice, showToast])

  return (
    <CartContext.Provider value={contextValue}>
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
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}