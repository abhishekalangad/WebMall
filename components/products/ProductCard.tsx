import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Heart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { StarRating } from '@/components/ui/star-rating'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  images: { url: string; alt?: string | null }[]
  category: { name: string } | null | undefined
  description?: string
  avgRating?: number
  reviewCount?: number
  stock?: number
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  showAddToCart?: boolean
  showWishlist?: boolean
  layout?: 'grid' | 'list'
}

export function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  showAddToCart = true,
  showWishlist = true,
  layout = 'grid'
}: ProductCardProps) {
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
        category: product.category?.name || 'Uncategorized'
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

  if (layout === 'list') {
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-row h-48 sm:h-56">
        {/* Product Image - Fixed Width */}
        <div className="relative w-1/3 sm:w-48 md:w-56 overflow-hidden bg-gray-100 flex-shrink-0">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-2 left-2">
              <span className="inline-block px-2 py-0.5 bg-white/90 text-[10px] font-medium text-gray-700 rounded-full border border-gray-100 shadow-sm">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-semibold text-gray-900 mb-1 hover:text-pink-600 transition-colors text-lg">
                  {product.name}
                </h3>
              </Link>
              {showWishlist && (
                <button
                  onClick={handleWishlistToggle}
                  className={`p-1.5 rounded-full transition-all duration-200 ${isWishlisted
                    ? 'bg-pink-50 text-pink-500'
                    : 'bg-gray-50 text-gray-400 hover:text-pink-500 hover:bg-pink-50'
                    }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {product.avgRating !== undefined && product.avgRating > 0 && (
              <div className="mb-2">
                <StarRating
                  rating={product.avgRating}
                  size="sm"
                  count={product.reviewCount}
                />
              </div>
            )}

            <p className="text-gray-500 text-sm line-clamp-2 mb-3 hidden sm:block">
              {product.description || 'No description available.'}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 font-medium">LKR</span>
              <span className="text-xl font-bold text-gray-900 leading-tight">
                {product.price.toLocaleString()}
              </span>
            </div>

            {showAddToCart && (
              <div className="flex items-center">
                {quantity > 0 ? (
                  <div className="flex items-center bg-pink-50 rounded-full p-1 border border-pink-100 shadow-sm">
                    <button onClick={handleDecreaseQuantity} className="p-1.5 hover:bg-white rounded-full text-pink-600">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 text-sm">{quantity}</span>
                    <button onClick={handleIncreaseQuantity} className="p-1.5 hover:bg-white rounded-full text-pink-600">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleAddClick}
                    className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-6 rounded-full"
                  >
                    Add to Cart
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-10 opacity-transition duration-300 sm:group-hover:opacity-10"></div>

        {/* Wishlist Button */}
        {showWishlist && (
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${isWishlisted
              ? 'bg-pink-500 text-white opacity-100'
              : 'bg-white/80 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-white'
              }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-2 py-1 bg-white/90 text-xs font-medium text-gray-700 rounded-full border border-gray-100 shadow-sm">
              {product.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] text-sm sm:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.avgRating !== undefined && product.avgRating > 0 && (
          <div className="mb-2">
            <StarRating
              rating={product.avgRating}
              size="sm"
              count={product.reviewCount}
            />
          </div>
        )}

        {/* Stock Badge */}
        {product.stock !== undefined && product.stock === 0 && (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
              Out of Stock
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-medium">LKR</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
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
                  className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-3 sm:px-4 text-xs sm:text-sm h-8 rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
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
