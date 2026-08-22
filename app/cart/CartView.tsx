'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Gift, Tag, Truck, X, ChevronRight, Sparkles, ArrowLeft, Heart, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getValidImageUrl } from '@/lib/image-utils'

import { useRouter } from 'next/navigation'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

export function CartView() {
    const router = useRouter()
    const { settings } = useSiteConfig()
    const { items, updateQuantity, removeItem, removeUnavailableItems, clearCart, totalItems, totalPrice, refreshCartData } = useCart()
    const { addItem: addToWishlist, isInWishlist, refreshWishlistData } = useWishlist()
    const { toast } = useToast()
    const [imgErrors, setImgErrors] = React.useState<Record<string, boolean>>({})
    React.useEffect(() => {
        refreshCartData()
        refreshWishlistData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run only once on mount

    // Calculate free shipping progress and costs using site settings
    const freeShippingThreshold = settings?.freeShippingThreshold || 5000
    const shippingBaseRate = settings?.shippingBaseRate || 350

    const isFreeShipping = totalPrice >= freeShippingThreshold

    // Shipping logic: Flat rate as configured in admin
    const shippingCost = isFreeShipping ? 0 : shippingBaseRate

    const shippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100)
    const amountToFreeShipping = Math.max(freeShippingThreshold - totalPrice, 0)

    const handleRemoveItem = (productId: string, variantId?: string, itemId?: string) => {
        removeItem(productId, variantId, itemId)
    }

    const finalTotal = totalPrice + shippingCost

    // Categorize items as available vs unavailable
    const availableItems = items.filter(item =>
        !(item.maxStock === 0 || item.isDeleted || item.name.includes('Discontinued') || item.name.includes('No Longer Available'))
    )
    const unavailableItems = items.filter(item =>
        item.maxStock === 0 || item.isDeleted || item.name.includes('Discontinued') || item.name.includes('No Longer Available')
    )
    const hasOutOfStock = unavailableItems.length > 0

    // Product-level savings from discounted variants (ONLY for available/in-stock items!)
    const productSavings = availableItems.reduce((acc, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return acc + (item.originalPrice - item.price) * item.quantity
        }
        return acc
    }, 0)

    // Dynamic banner text based on actual reasons (Out of Stock vs Discontinued vs Both)
    const outOfStockCount = unavailableItems.filter(i => !i.isDeleted && i.maxStock === 0 && !i.name.includes('Discontinued') && !i.name.includes('No Longer Available')).length
    const discontinuedCount = unavailableItems.filter(i => i.isDeleted || i.name.includes('Discontinued') || i.name.includes('No Longer Available')).length

    let unavailableBannerTitle = ''
    const totalUnavailable = unavailableItems.length

    if (outOfStockCount > 0 && discontinuedCount > 0) {
        unavailableBannerTitle = `${totalUnavailable} ${totalUnavailable === 1 ? 'item is' : 'items are'} out of stock or discontinued.`
    } else if (discontinuedCount > 0) {
        unavailableBannerTitle = `${discontinuedCount} ${discontinuedCount === 1 ? 'item is' : 'items are'} discontinued by seller.`
    } else {
        unavailableBannerTitle = `${outOfStockCount} ${outOfStockCount === 1 ? 'item is' : 'items are'} out of stock.`
    }

    // Estimated delivery date (3-5 business days from now)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + 5)
    const formattedDate = estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 dark:from-pink-950/20 dark:via-background dark:to-yellow-950/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-yellow-100 dark:from-pink-900/40 dark:to-yellow-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <ShoppingBag className="h-16 w-16 text-pink-500 dark:text-pink-400" />
                        </div>
                        <h1 className="text-4xl font-playfair font-bold text-foreground mb-4">
                            Your Cart is Empty
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Discover beautiful accessories and fill your cart with joy! ✨
                        </p>
                        <Link href="/products">
                            <Button size="lg" className="bg-gradient-to-r from-pink-400 to-yellow-400 hover:from-pink-500 hover:to-yellow-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Start Shopping
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 dark:from-pink-950/20 dark:via-background dark:to-yellow-950/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    {/* Back Button */}
                    <Link
                        href="/products"
                        className="inline-flex items-center text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Continue Shopping</span>
                    </Link>

                    {/* Header Content */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-foreground mb-2">
                                Shopping Cart
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                            </p>
                        </div>
                        {items.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (confirm('Clear all items from cart?')) {
                                        clearCart()
                                        toast({
                                            title: 'Cart Cleared',
                                            description: 'All items removed from cart'
                                        })
                                    }
                                }}
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Cart
                            </Button>
                        )}
                    </div>
                </div>

                {/* Free Shipping Progress */}
                {shippingProgress < 100 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-card rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-blue-900/40"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                Add LKR {amountToFreeShipping.toLocaleString()} more for FREE shipping!
                            </p>
                            <span className="text-xs text-muted-foreground">{Math.round(shippingProgress)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${shippingProgress}%` }}
                                transition={{ duration: 0.5 }}
                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                            />
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => {
                                const isUnavailable = item.isDeleted || item.maxStock === 0 || item.name.includes('Discontinued') || item.name.includes('No Longer Available')
                                return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: -60, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.25 }}
                                    className={`rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border ${
                                        isUnavailable
                                            ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                                            : 'bg-card border-border'
                                    }`}
                                >
                                    {/* Out of Stock / Deleted Banner */}
                                    {isUnavailable && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-100/80 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/50">
                                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                                {item.isDeleted || item.name.includes('Discontinued') || item.name.includes('No Longer Available')
                                                    ? 'This item has been removed by seller and is no longer available'
                                                    : 'This item is currently out of stock'}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`p-4 sm:p-6 ${isUnavailable ? 'opacity-70' : ''}`}>
                                        <div className="flex flex-row gap-3 sm:gap-4">
                                            {/* Product Image */}
                                            {item.slug && !item.isDeleted ? (
                                                <Link
                                                    href={`/products/${item.slug}`}
                                                    className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-muted rounded-xl overflow-hidden flex-shrink-0 group"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imgErrors[item.id] ? '/placeholder.png' : getValidImageUrl(item.image, '/placeholder.png')}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                                                    />
                                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                                </Link>
                                            ) : (
                                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imgErrors[item.id] ? '/placeholder.png' : getValidImageUrl(item.image, '/placeholder.png')}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover grayscale"
                                                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                                                    />
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    {item.slug && !item.isDeleted ? (
                                                        <Link
                                                            href={`/products/${item.slug}`}
                                                            className="text-base sm:text-lg font-semibold text-foreground hover:text-pink-600 dark:hover:text-pink-400 transition-colors block mb-1 line-clamp-2"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                    ) : (
                                                        <h3 className="text-base sm:text-lg font-semibold text-foreground block mb-1 line-clamp-2">
                                                            {item.name}
                                                        </h3>
                                                    )}

                                                    {/* Variant Details */}
                                                    {item.variantName && (
                                                        <div className="mb-2">
                                                            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1 truncate">
                                                                {item.variantName}
                                                            </p>
                                                            {item.variantAttributes && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {Object.entries(item.variantAttributes).map(([key, value]) => (
                                                                        <Badge key={key} variant="secondary" className="text-xs">
                                                                            {key}: {value as string}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col">
                                                        {item.isDeleted ? (
                                                            <p className="text-red-500 font-semibold text-sm">
                                                                Discontinued
                                                            </p>
                                                        ) : (
                                                            <p className="text-pink-600 dark:text-pink-400 font-bold text-base sm:text-lg">
                                                                LKR {item.price.toLocaleString()}
                                                            </p>
                                                        )}
                                                        {item.originalPrice && item.originalPrice > item.price && !item.isDeleted && (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs text-muted-foreground line-through">
                                                                    LKR {item.originalPrice.toLocaleString()}
                                                                </p>
                                                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-100 border-none">
                                                                    {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                                                    {isUnavailable ? (
                                                        /* Out of Stock / Deleted: show Remove + Wishlist buttons */
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(item.productId, item.variantId, item.id)}
                                                                className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 font-semibold"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Remove from Cart
                                                            </Button>
                                                            {!item.isDeleted && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const alreadyWishlisted = isInWishlist(item.productId, item.variantId)
                                                                        if (!alreadyWishlisted) {
                                                                            addToWishlist({
                                                                                productId: item.productId,
                                                                                variantId: item.variantId,
                                                                                name: item.name,
                                                                                variantName: item.variantName,
                                                                                variantAttributes: item.variantAttributes,
                                                                                price: item.price,
                                                                                currency: 'LKR',
                                                                                image: item.image,
                                                                                slug: item.slug,
                                                                                category: '',
                                                                                inStock: false,
                                                                            })
                                                                        }
                                                                        handleRemoveItem(item.productId, item.variantId, item.id)
                                                                        toast({
                                                                            title: alreadyWishlisted ? 'Removed from Cart' : 'Moved to Wishlist',
                                                                            description: alreadyWishlisted ? 'Item removed from cart (remains saved in your Wishlist).' : 'Item saved to your Wishlist and removed from cart.'
                                                                        })
                                                                    }}
                                                                    className="border-pink-200 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 gap-1.5 font-semibold"
                                                                >
                                                                    <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                                                                    {isInWishlist(item.productId, item.variantId) ? 'In Wishlist (Remove from Cart)' : 'Move to Wishlist'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* In Stock: normal quantity controls */
                                                        <div className="flex items-center border-2 border-border rounded-lg overflow-hidden w-full sm:w-auto bg-card">
                                                            <button
                                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                                                disabled={item.quantity <= 1}
                                                                className="p-2 sm:p-2.5 hover:bg-muted transition-colors flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <Minus className="h-4 w-4 text-foreground mx-auto" />
                                                            </button>
                                                            <span className="px-4 py-2 font-semibold text-foreground min-w-[60px] text-center bg-transparent">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                                                disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                                                                className="p-2 sm:p-2.5 hover:bg-muted transition-colors flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <Plus className="h-4 w-4 text-foreground mx-auto" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Item Total & Remove (only for in-stock items) */}
                                                    {!isUnavailable && (
                                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-xs text-muted-foreground">Total</p>
                                                                <p className="text-lg sm:text-xl font-bold text-foreground">
                                                                    LKR {(item.price * item.quantity).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveItem(item.productId, item.variantId, item.id)}
                                                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex-shrink-0"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )})}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 border border-border">
                            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                                <Gift className="h-6 w-6 text-pink-500 dark:text-pink-400" />
                                Order Summary
                            </h2>



                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-border">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({availableItems.length} {availableItems.length === 1 ? 'item' : 'items'})</span>
                                    <span className="font-medium">LKR {totalPrice.toLocaleString()}</span>
                                </div>

                                {productSavings > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span className="flex items-center gap-1">🏷️ Product Savings</span>
                                        <span>− LKR {productSavings.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Truck className="h-4 w-4" />
                                        Shipping
                                    </span>
                                    {isFreeShipping ? (
                                        <span className="font-medium text-green-600 dark:text-green-400">FREE</span>
                                    ) : (
                                        <span className="font-medium text-foreground">LKR {shippingCost.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-semibold text-foreground">Total</span>
                                    <span className="text-2xl font-bold text-foreground">
                                        LKR {finalTotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Truck className="h-3 w-3" />
                                    Est. delivery by {formattedDate}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                {unavailableItems.length > 0 && (
                                    <div className="flex items-start gap-2 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">
                                                {unavailableBannerTitle}
                                            </p>
                                            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                {availableItems.length > 0
                                                    ? 'Click below to clear unavailable items and checkout with available items.'
                                                    : 'Please remove unavailable items to continue.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {availableItems.length > 0 ? (
                                    <Button
                                        onClick={() => {
                                            if (unavailableItems.length > 0) {
                                                removeUnavailableItems()
                                            }
                                            router.push('/checkout')
                                        }}
                                        className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all rounded-xl gap-2 cursor-pointer"
                                    >
                                        {unavailableItems.length > 0 ? (
                                            <>
                                                Proceed with Available Items ({availableItems.length})
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        ) : (
                                            <>
                                                Proceed to Checkout
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        disabled
                                        className="w-full bg-muted text-muted-foreground font-semibold py-6 text-base shadow-none cursor-not-allowed opacity-60 rounded-xl"
                                    >
                                        No Available Items to Checkout
                                    </Button>
                                )}

                                <Link href="/products" className="block w-full">
                                    <Button variant="outline" className="w-full py-3 dark:border-border dark:text-foreground rounded-xl">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t border-border space-y-3">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                        <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Free Shipping</p>
                                        <p className="text-xs">On orders over LKR {freeShippingThreshold.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                        <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">7-Day Returns</p>
                                        <p className="text-xs">Money-back guarantee</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
