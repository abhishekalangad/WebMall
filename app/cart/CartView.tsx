'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, Gift, Tag, Truck, X, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getValidImageUrl, handleImageError } from '@/lib/image-utils'

export function CartView() {
    const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart()
    const { toast } = useToast()
    const [promoCode, setPromoCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [removingItem, setRemovingItem] = useState<string | null>(null)

    // Calculate free shipping progress and costs
    const freeShippingThreshold = 5000
    const shippingRatePerItem = 350
    const isFreeShipping = totalPrice >= freeShippingThreshold

    // Shipping logic: Per item charge if under threshold
    const shippingCost = isFreeShipping ? 0 : (totalItems * shippingRatePerItem)

    const shippingProgress = Math.min((totalPrice / freeShippingThreshold) * 100, 100)
    const amountToFreeShipping = Math.max(freeShippingThreshold - totalPrice, 0)

    // ... promo logic ...
    const handleApplyPromo = () => {
        // Demo promo codes
        const promos: Record<string, number> = {
            'SAVE10': 0.1,
            'WELCOME': 0.15,
            'SAVE20': 0.2
        }

        if (promos[promoCode.toUpperCase()]) {
            const discountPercent = promos[promoCode.toUpperCase()]
            setDiscount(discountPercent)
            toast({
                title: '✨ Promo Applied!',
                description: `${(discountPercent * 100)}% discount added to your order`
            })
        } else {
            toast({
                title: 'Invalid Code',
                description: 'Please check your promo code and try again',
                variant: 'destructive'
            })
        }
    }

    const handleRemoveItem = (productId: string, variantId?: string) => {
        setRemovingItem(productId)
        setTimeout(() => {
            removeItem(productId, variantId)
            setRemovingItem(null)
            toast({
                title: 'Item Removed',
                description: 'Item has been removed from your cart'
            })
        }, 300)
    }

    const finalTotal = totalPrice - (totalPrice * discount) + shippingCost

    // Estimated delivery date (3-5 business days from now)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + 5)
    const formattedDate = estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <ShoppingBag className="h-16 w-16 text-pink-500" />
                        </div>
                        <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
                            Your Cart is Empty
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
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
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    {/* Back Button */}
                    <Link
                        href="/products"
                        className="inline-flex items-center text-gray-600 hover:text-pink-600 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Continue Shopping</span>
                    </Link>

                    {/* Header Content */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-gray-900 mb-2">
                                Shopping Cart
                            </h1>
                            <p className="text-gray-600 flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
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
                                className="border-red-200 text-red-600 hover:bg-red-50"
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
                        className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-blue-100"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-blue-600" />
                                Add LKR {amountToFreeShipping.toLocaleString()} more for FREE shipping!
                            </p>
                            <span className="text-xs text-gray-500">{Math.round(shippingProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
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
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: removingItem === item.productId ? 0 : 1,
                                        scale: removingItem === item.productId ? 0.9 : 1
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Product Image */}
                                            <Link
                                                href={`/products/${item.slug}`}
                                                className="relative w-full sm:w-24 h-40 sm:h-24 md:w-28 md:h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 group"
                                            >
                                                <Image
                                                    src={getValidImageUrl(item.image, '/placeholder.png')}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={handleImageError}
                                                />
                                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                            </Link>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <Link
                                                        href={`/products/${item.slug}`}
                                                        className="text-base sm:text-lg font-semibold text-gray-900 hover:text-pink-600 transition-colors block mb-1 line-clamp-2"
                                                    >
                                                        {item.name}
                                                    </Link>

                                                    {/* Variant Details */}
                                                    {item.variantName && (
                                                        <div className="mb-2">
                                                            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1 truncate">
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

                                                    <p className="text-pink-600 font-bold text-base sm:text-lg">
                                                        LKR {item.price.toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Controls - Mobile Optimized */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden w-full sm:w-auto">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                                            className="p-2 sm:p-2.5 hover:bg-pink-50 transition-colors flex-1 sm:flex-none"
                                                        >
                                                            <Minus className="h-4 w-4 text-gray-600 mx-auto" />
                                                        </button>
                                                        <span className="px-4 py-2 font-semibold text-gray-900 min-w-[60px] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                                            className="p-2 sm:p-2.5 hover:bg-pink-50 transition-colors flex-1 sm:flex-none"
                                                        >
                                                            <Plus className="h-4 w-4 text-gray-600 mx-auto" />
                                                        </button>
                                                    </div>

                                                    {/* Item Total & Remove */}
                                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-xs text-gray-500">Total</p>
                                                            <p className="text-lg sm:text-xl font-bold text-gray-900">
                                                                LKR {(item.price * item.quantity).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveItem(item.productId, item.variantId)}
                                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Gift className="h-6 w-6 text-pink-500" />
                                Order Summary
                            </h2>

                            {/* Promo Code */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleApplyPromo}
                                        variant="outline"
                                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                                    >
                                        Apply
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Try: SAVE10, WELCOME, SAVE20</p>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6 pb-6 border-b">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span className="font-medium">LKR {totalPrice.toLocaleString()}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="h-4 w-4" />
                                            Discount ({(discount * 100)}%)
                                        </span>
                                        <span className="font-medium">- LKR {(totalPrice * discount).toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Truck className="h-4 w-4" />
                                        Shipping
                                    </span>
                                    {isFreeShipping ? (
                                        <span className="font-medium text-green-600">FREE</span>
                                    ) : (
                                        <span className="font-medium text-gray-900">LKR {shippingCost.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        LKR {finalTotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Truck className="h-3 w-3" />
                                    Est. delivery by {formattedDate}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-6">
                                <Link href="/checkout" className="block mb-4">
                                    <Button className="w-full bg-gradient-to-r from-pink-400 to-yellow-400 hover:from-pink-500 hover:to-yellow-500 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                        Proceed to Checkout
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/products">
                                    <Button variant="outline" className="w-full py-3">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <Truck className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Free Shipping</p>
                                        <p className="text-xs">All orders across Sri Lanka</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Gift className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">7-Day Returns</p>
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
