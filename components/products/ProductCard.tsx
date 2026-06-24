'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const maxStock = cartItem?.maxStock ?? product.stock ?? Infinity

  const prices = [product.price, ...(product.variants?.map((v: any) => v.priceOverride).filter(Boolean) || [])].map(p => Number(p))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const hasPriceRange = minPrice !== maxPrice
  const hasDiscount = maxPrice > minPrice
  const discountPercent = hasDiscount ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0

  // Find the variant with the min price to show its specification
  const minPriceVariant = product.variants?.find((v: any) => Number(v.priceOverride) === minPrice)
  const minPriceSpec = minPriceVariant ? Object.values(minPriceVariant.attributes || {}).join(', ') : null

  const isOutOfStock = product.stock !== undefined && product.stock <= 0


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
        className="group relative bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-row h-48 sm:h-56 cursor-pointer"
      >
        {/* Product Image - Fixed Width */}
        <div className="relative w-1/3 sm:w-48 md:w-56 overflow-hidden bg-muted flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => handleImageError(e as any)}
          />

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-2 left-2">
              <span className="inline-block px-2 py-0.5 bg-card/90 text-[10px] font-medium text-foreground/80 rounded-full border border-border shadow-sm">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground mb-1 hover:text-pink-600 transition-colors text-lg">
                {product.name}
              </h3>
              {showWishlist && (
                <button
                  onClick={handleWishlistToggle}
                  className={`p-1.5 rounded-full transition-all duration-200 z-10 ${isWishlisted
                    ? 'bg-pink-50 text-pink-500'
                    : 'bg-muted/50 text-muted-foreground/80 hover:text-pink-500 hover:bg-pink-50'
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

            <p className="text-muted-foreground text-sm line-clamp-2 mb-3 hidden sm:block">
              {product.description || 'No description available.'}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground font-medium">{product.currency}</span>
                {hasPriceRange && !hasDiscount && <span className="text-xs text-pink-600 font-medium whitespace-nowrap">From</span>}
                <span className="text-xl font-bold text-foreground leading-tight">
                  {minPrice.toLocaleString()}
                </span>
                {minPriceSpec && (
                  <span className="text-[10px] text-muted-foreground/80 bg-muted/50 border border-border px-1 rounded uppercase font-bold tracking-tighter">
                    {minPriceSpec}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground/80 line-through">
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
                {isOutOfStock ? (
                  <button
                    onClick={handleWishlistToggle}
                    className={`flex-1 px-4 sm:px-6 py-2 text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center font-semibold border-2 ${isWishlisted ? 'text-red-500 border-red-300 bg-red-50' : 'text-foreground/80 border-border/60 hover:border-red-300 hover:bg-red-50 hover:text-red-500'}`}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    {isWishlisted ? 'In Wishlist' : 'Out of Stock - Add to Wishlist'}
                  </button>
                ) : (
                  <>
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
                          const buyNowItem = {
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            image: primaryImage,
                            slug: product.slug,
                            variantId: undefined,
                            variantName: undefined,
                            variantAttributes: undefined
                          }
                          localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
                          router.push('/checkout?buyNow=true')
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
                        <span className="w-8 text-center font-bold text-foreground text-sm">
                          {quantity}
                        </span>
                        <button
                          onClick={handleIncreaseQuantity}
                          className={`p-1.5 hover:bg-pink-100 rounded text-pink-600 transition-all ${quantity >= maxStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddClick}
                        className="p-2 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-foreground rounded-lg shadow-sm transition-all"
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
                  </>
                )}
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
      className="flex flex-col group relative bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => handleImageError(e as any)}
        />

        {/* Wishlist Button — fixed 32×32 circle so icon is perfectly centered */}
        {showWishlist && (
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-all duration-200 z-10 ${
              isWishlisted
                ? 'bg-pink-500 text-white opacity-100'
                : 'bg-white/90 text-gray-400 hover:text-pink-500 hover:bg-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-block px-2 py-0.5 bg-white/90 text-[10px] font-semibold text-gray-700 rounded-full shadow-sm">
              {product.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Product Info — flex-1 so it fills remaining height, flex-col to push action to bottom */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Product Name */}
        <h3 className="font-semibold text-foreground mb-1.5 hover:text-pink-600 transition-colors line-clamp-2 text-sm sm:text-[0.9rem] leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        {product.avgRating !== undefined && product.avgRating > 0 && (
          <div className="mb-1.5">
            <StarRating rating={product.avgRating} size="sm" count={product.reviewCount} />
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="mb-1.5">
            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Middle content — flex-1 pushes action row to bottom */}
        <div className="flex-1">
          {/* Price Block: discount line ABOVE final price */}
          <div>
            {/* 1. Variant spec badge (if any) */}
            {minPriceSpec && (
              <div className="mb-0.5">
                <span className="text-[10px] text-muted-foreground/80 bg-muted/60 border border-border px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                  {minPriceSpec}
                </span>
              </div>
            )}

            {/* 2. Strikethrough original price + discount badge — shown ABOVE final price */}
            {hasDiscount && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-muted-foreground/70 line-through">
                  {product.currency} {maxPrice.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </div>
            )}

            {/* 3. Final (discounted) price — large and bold */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground font-medium">{product.currency}</span>
              {hasPriceRange && !hasDiscount && (
                <span className="text-xs text-pink-500 font-medium">From</span>
              )}
              <span className="text-lg sm:text-xl font-bold text-foreground leading-none">
                {minPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Row — mt-auto pins it to the bottom regardless of content height */}
        {showAddToCart && (
          <div className="mt-auto pt-3" onClick={(e) => e.stopPropagation()}>
            {isOutOfStock ? (
              /* Out of stock — full-width Add to Wishlist */
              <button
                onClick={handleWishlistToggle}
                className={`w-full h-9 px-3 text-xs rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  isWishlisted
                    ? 'text-pink-600 border-pink-300 bg-pink-50'
                    : 'text-foreground/70 border-border hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            ) : quantity > 0 ? (
              /* In cart — show compact qty controls full-width (no Buy Now to prevent wrapping) */
              <div className="flex items-center justify-between h-9 bg-pink-50 rounded-xl px-2 border border-pink-200 shadow-sm">
                <button
                  onClick={handleDecreaseQuantity}
                  className="w-6 h-6 flex items-center justify-center hover:bg-pink-100 rounded-lg text-pink-600 transition-all"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-foreground text-sm tabular-nums">{quantity}</span>
                <button
                  onClick={handleIncreaseQuantity}
                  className={`w-6 h-6 flex items-center justify-center hover:bg-pink-100 rounded-lg text-pink-600 transition-all ${quantity >= maxStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              /* Not in cart — Buy Now + cart icon */
              <div className="flex items-center gap-2 h-9">
                <div
                  className="flex-1 h-9 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer whitespace-nowrap"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const hasVariants = product.variants && product.variants.length > 0
                    if (hasVariants) {
                      router.push(`/products/${product.slug}`)
                    } else {
                      const buyNowItem = {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: primaryImage,
                        slug: product.slug,
                        variantId: undefined,
                        variantName: undefined,
                        variantAttributes: undefined
                      }
                      localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
                      router.push('/checkout?buyNow=true')
                    }
                  }}
                >
                  Buy Now
                </div>
                <button
                  onClick={handleAddClick}
                  className="w-9 h-9 flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-700 rounded-xl shadow-sm transition-all"
                  title="Add to Cart"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </Link>
  )
}
