'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, Heart, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { StarRating } from '@/components/ui/star-rating'
import { getValidImageUrl, handleImageError } from '@/lib/image-utils'

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
  variants?: any[]
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
  const primaryImage = getValidImageUrl(product.images[0]?.url, '/placeholder.png')
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist()
  const { items, updateQuantity } = useCart()
  const router = useRouter()

  const isWishlisted = isInWishlist(product.id)
  const cartItem = items.find(item => item.productId === product.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const prices = [product.price, ...(product.variants?.map((v: any) => v.priceOverride).filter(Boolean) || [])].map(p => Number(p))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const hasPriceRange = minPrice !== maxPrice
  const hasDiscount = maxPrice > minPrice
  const discountPercent = hasDiscount ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0

  // Find the variant with the min price to show its specification
  const minPriceVariant = product.variants?.find((v: any) => Number(v.priceOverride) === minPrice)
  const minPriceSpec = minPriceVariant ? Object.values(minPriceVariant.attributes || {}).join(', ') : null

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isWishlisted) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: minPrice,
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
      <Link
        href={`/products/${product.slug}`}
        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-row h-48 sm:h-56 cursor-pointer"
      >
        {/* Product Image - Fixed Width */}
        <div className="relative w-1/3 sm:w-48 md:w-56 overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />

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
              <h3 className="font-semibold text-gray-900 mb-1 hover:text-pink-600 transition-colors text-lg">
                {product.name}
              </h3>
              {showWishlist && (
                <button
                  onClick={handleWishlistToggle}
                  className={`p-1.5 rounded-full transition-all duration-200 z-10 ${isWishlisted
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-gray-500 font-medium">{product.currency}</span>
                {hasPriceRange && !hasDiscount && <span className="text-xs text-pink-600 font-medium whitespace-nowrap">From</span>}
                <span className="text-xl font-bold text-gray-900 leading-tight">
                  {minPrice.toLocaleString()}
                </span>
                {minPriceSpec && (
                  <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1 rounded uppercase font-bold tracking-tighter">
                    {minPriceSpec}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-400 line-through">
                    {product.currency} {maxPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {showAddToCart && (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Buy Now Button - Using div to avoid nested <a> tags */}
                <div
                  className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-semibold px-4 sm:px-6 py-2 text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const hasVariants = product.variants && product.variants.length > 0
                    if (hasVariants) {
                      router.push(`/products/${product.slug}`)
                    } else {
                      onAddToCart(product)
                      router.push('/checkout')
                    }
                  }}
                >
                  Buy Now
                </div>

                {/* Add to Cart Icon Button */}
                {quantity > 0 ? (
                  <div className="flex items-center bg-pink-50 rounded-lg p-1.5 border border-pink-200 shadow-sm">
                    <button
                      onClick={handleDecreaseQuantity}
                      className="p-1.5 hover:bg-pink-100 rounded text-pink-600 transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncreaseQuantity}
                      className="p-1.5 hover:bg-pink-100 rounded text-pink-600 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddClick}
                    className="p-2 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 rounded-lg shadow-sm transition-all"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </button>
                )}

                {/* Wishlist Icon Button */}
                <button
                  onClick={handleWishlistToggle}
                  className={`p-2 rounded-lg shadow-sm transition-all ${isWishlisted
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 hover:bg-pink-200 text-pink-600'
                    }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-10 opacity-transition duration-300 sm:group-hover:opacity-10"></div>

        {/* Wishlist Button - Top Right */}
        {showWishlist && (
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${isWishlisted
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
        <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] text-sm sm:text-base">
          {product.name}
        </h3>

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

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm text-gray-500 font-medium">{product.currency}</span>
              {hasPriceRange && !hasDiscount && <span className="text-xs text-pink-600 font-medium">From</span>}
              <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                {minPrice.toLocaleString()}
              </span>
              {minPriceSpec && (
                <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1 rounded uppercase font-bold tracking-tighter">
                  {minPriceSpec}
                </span>
              )}
            </div>
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 line-through">
                  {product.currency} {maxPrice.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded">
                  {discountPercent}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buy Now Section */}
        {showAddToCart && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Buy Now Button - Using div instead of Link to avoid nested <a> tags */}
            <div
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-semibold px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const hasVariants = product.variants && product.variants.length > 0
                if (hasVariants) {
                  router.push(`/products/${product.slug}`)
                } else {
                  onAddToCart(product)
                  router.push('/checkout')
                }
              }}
            >
              Buy Now
            </div>

            {/* Add to Cart Icon Button */}
            {quantity > 0 ? (
              <div className="flex items-center bg-pink-50 rounded-lg p-1.5 border border-pink-200 shadow-sm">
                <button
                  onClick={handleDecreaseQuantity}
                  className="p-1 hover:bg-pink-100 rounded text-pink-600 transition-all"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center font-bold text-gray-900 text-xs">
                  {quantity}
                </span>
                <button
                  onClick={handleIncreaseQuantity}
                  className="p-1 hover:bg-pink-100 rounded text-pink-600 transition-all"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="p-2 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 rounded-lg shadow-sm transition-all"
                title="Add to Cart"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            )}

            {/* Wishlist Icon Button (duplicate for bottom) */}
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-lg shadow-sm transition-all lg:hidden ${isWishlisted
                ? 'bg-pink-500 text-white'
                : 'bg-pink-100 hover:bg-pink-200 text-pink-600'
                }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}
