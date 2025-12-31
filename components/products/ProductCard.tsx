import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Heart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  images: { url: string; alt?: string | null }[]
  category: { name: string }
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  showAddToCart?: boolean
  showWishlist?: boolean
}

export function ProductCard({ product, onAddToCart, onAddToWishlist, showAddToCart = true, showWishlist = true }: ProductCardProps) {
  const primaryImage = product.images[0]?.url || '/placeholder.jpg'
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist()
  const { items, updateQuantity } = useCart()

  const isWishlisted = isInWishlist(product.id)
  const cartItem = items.find(item => item.productId === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        image: product.images[0]?.url,
        slug: product.slug,
        category: product.category.name
      })
    }
  }

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity - 1)
  }

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity + 1)
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart(product)
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Wishlist Button */}
        {showWishlist && (
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${isWishlisted
              ? 'bg-pink-500 text-white opacity-100'
              : 'bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white'
              }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-full border border-gray-100 shadow-sm">
            {product.category.name}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-medium">LKR</span>
            <span className="text-xl font-bold text-gray-900 leading-tight">
              {product.price.toLocaleString()}
            </span>
          </div>

          {showAddToCart && (
            <div className="flex items-center">
              {quantity > 0 ? (
                <div className="flex items-center bg-pink-50 rounded-full p-1 border border-pink-100 shadow-sm animate-fade-in">
                  <button
                    onClick={handleDecreaseQuantity}
                    className="p-1.5 hover:bg-white rounded-full text-pink-600 transition-all active:scale-95"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncreaseQuantity}
                    className="p-1.5 hover:bg-white rounded-full text-pink-600 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAddClick}
                  className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-4 rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
                >
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  Add
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
