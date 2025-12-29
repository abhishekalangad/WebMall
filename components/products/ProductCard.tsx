import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  images: { url: string; alt?: string }[]
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
  const isWishlisted = isInWishlist(product.id)

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
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
              isWishlisted 
                ? 'bg-pink-500 text-white opacity-100' 
                : 'bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-full">
            {product.category.name}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-lg font-bold text-gray-900">
              {product.currency} {product.price.toLocaleString()}
            </span>
          </div>
          
          {showAddToCart && (
            <Button
              size="sm"
              onClick={() => onAddToCart(product)}
              className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-medium"
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}