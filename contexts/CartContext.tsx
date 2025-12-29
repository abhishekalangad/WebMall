'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  slug: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { user } = useAuth()

  // Get user-specific cart key
  const getCartKey = () => {
    return user ? `webmall-cart-${user.id}` : 'webmall-cart-guest'
  }

  // Load cart from localStorage when user changes
  useEffect(() => {
    const cartKey = getCartKey()
    const savedCart = localStorage.getItem(cartKey)

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)

        // If user just logged in and had a guest cart, merge them
        if (user) {
          const guestCartKey = 'webmall-cart-guest'
          const guestCart = localStorage.getItem(guestCartKey)

          if (guestCart && guestCartKey !== cartKey) {
            try {
              const guestItems = JSON.parse(guestCart)
              // Merge guest cart with user cart
              const mergedItems = [...parsedCart]

              guestItems.forEach((guestItem: CartItem) => {
                const existingIndex = mergedItems.findIndex(
                  item => item.productId === guestItem.productId
                )
                if (existingIndex >= 0) {
                  // Increase quantity if item exists
                  mergedItems[existingIndex].quantity += guestItem.quantity
                } else {
                  // Add new item
                  mergedItems.push(guestItem)
                }
              })

              setItems(mergedItems)
              // Clear guest cart after merging
              localStorage.removeItem(guestCartKey)
              return
            } catch (error) {
              console.error('Error merging carts:', error)
            }
          }
        }

        setItems(parsedCart)
      } catch (error) {
        console.error('Error parsing cart data:', error)
        setItems([])
      }
    } else {
      // Only clear items if there's no saved cart
      if (!user) {
        setItems([])
      }
    }
  }, [user])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    const cartKey = getCartKey()
    localStorage.setItem(cartKey, JSON.stringify(items))
  }, [items, user])

  const syncCartWithServer = async () => {
    try {
      // TODO: Implement server cart sync
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      if (response.ok) {
        const serverItems = await response.json()
        setItems(serverItems)
      }
    } catch (error) {
      console.error('Failed to sync cart:', error)
    }
  }

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === newItem.productId)
      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
        showToast(`${newItem.name} quantity updated in cart!`, 'success')
        return updatedItems
      } else {
        const newItems = [...prevItems, { ...newItem, id: Date.now().toString() }]
        showToast(`${newItem.name} added to cart!`, 'success')
        return newItems
      }
    })
  }

  const removeItem = (productId: string) => {
    const itemToRemove = items.find(item => item.productId === productId)
    setItems(prevItems => prevItems.filter(item => item.productId !== productId))
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from cart`, 'info')
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    showToast('Cart cleared', 'info')
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        showToast,
      }}
    >
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