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
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
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

  // Get user-specific cart key
  const getCartKey = () => {
    return user ? `webmall-cart-${user.id}` : 'webmall-cart-guest'
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

  // Load cart from server for logged-in users
  const loadCartFromServer = async () => {
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
  }

  // Sync local cart with server
  const syncCartWithServer = async (localItems: CartItem[]) => {
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
  }

  // Update server cart on item changes
  const updateServerCart = useCallback(async (action: string, productId: string, quantity: number, variantId?: string, variantName?: string, variantAttributes?: Record<string, string>) => {
    if (!user) return

    try {
      const token = await getAuthToken()
      if (!token) return

      await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, productId, quantity, variantId, variantName, variantAttributes })
      })
    } catch (error) {
      console.error('Failed to update server cart:', error)
    }
  }, [user, getAuthToken])

  // Load cart when component mounts or user changes
  useEffect(() => {
    const loadCart = async () => {
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
              setItems(mergedItems || serverItems)
              // Clear guest cart after merging
              localStorage.removeItem(guestCartKey)
            } catch (error) {
              console.error('Error merging carts:', error)
              setItems(serverItems)
            }
          } else {
            setItems(serverItems)
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
              setItems(parsedCart)
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
            setItems(JSON.parse(savedCart))
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
  }, [user])

  // Save cart to localStorage whenever items change (with optimization to prevent unnecessary saves)
  useEffect(() => {
    // Skip during initial load
    if (isLoadingCart) return

    const currentUserId = user?.id || null
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items)
    const userChanged = prevUserIdRef.current !== currentUserId

    // Only save if items actually changed or user changed
    if (itemsChanged || userChanged) {
      const cartKey = getCartKey()
      localStorage.setItem(cartKey, JSON.stringify(items))

      // Update refs to current values
      prevItemsRef.current = items
      prevUserIdRef.current = currentUserId
    }
  }, [items, user, isLoadingCart])

  // Define showToast first since other functions depend on it
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    // Sanity check for quantity
    const quantityToAdd = Number(newItem.quantity) || 1

    setItems(prevItems => {
      // Match by both productId AND variantId to allow different variants as separate items
      const existingItem = prevItems.find(item =>
        item.productId === newItem.productId &&
        item.variantId === newItem.variantId
      )
      if (existingItem) {
        const newQuantity = (Number(existingItem.quantity) || 0) + quantityToAdd
        const updatedItems = prevItems.map(item =>
          item.productId === newItem.productId && item.variantId === newItem.variantId
            ? { ...item, quantity: newQuantity }
            : item
        )
        showToast(`${newItem.name} quantity updated in cart!`, 'success')
        // Update server for logged-in users
        updateServerCart('update', newItem.productId, newQuantity, newItem.variantId, newItem.variantName, newItem.variantAttributes)
        return updatedItems
      } else {
        const newItems = [...prevItems, { ...newItem, quantity: quantityToAdd, id: Date.now().toString() }]
        showToast(`${newItem.name} added to cart!`, 'success')
        // Update server for logged-in users
        updateServerCart('add', newItem.productId, quantityToAdd, newItem.variantId, newItem.variantName, newItem.variantAttributes)
        return newItems
      }
    })
  }, [updateServerCart])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    const itemToRemove = items.find(item =>
      item.productId === productId &&
      (variantId ? item.variantId === variantId : true)
    )

    setItems(prevItems => prevItems.filter(item => {
      if (item.productId !== productId) return true
      if (variantId && item.variantId !== variantId) return true
      return false
    }))

    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from cart`, 'info')
      // Update server for logged-in users
      updateServerCart('remove', productId, 0, variantId)
    }
  }, [items, updateServerCart])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const newQuantity = Number(quantity)
    if (isNaN(newQuantity) || newQuantity <= 0) {
      // Remove the specific variant item
      setItems(prevItems => prevItems.filter(item =>
        !(item.productId === productId && item.variantId === variantId)
      ))
      return
    }

    // Find the item to get variant details for server update
    const itemToUpdate = items.find(item =>
      item.productId === productId && item.variantId === variantId
    )

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
    // Update server for logged-in users with full variant details
    if (itemToUpdate) {
      updateServerCart('update', productId, newQuantity, variantId, itemToUpdate.variantName, itemToUpdate.variantAttributes)
    }
  }, [items, updateServerCart])

  const clearCart = useCallback(async () => {
    setItems([])
    showToast('Cart cleared', 'info')

    // Clear server cart for logged-in users
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
  }, [user, getAuthToken])

  // Calculate total items (safe with integers)
  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  // Calculate total price using Decimal.js to prevent floating-point errors
  const totalPrice = items.reduce((sum, item) => {
    const price = new Decimal(item.price || 0)
    const quantity = new Decimal(item.quantity || 0)
    return sum.plus(price.times(quantity))
  }, new Decimal(0)).toNumber()

  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    showToast,
  }), [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, showToast])

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