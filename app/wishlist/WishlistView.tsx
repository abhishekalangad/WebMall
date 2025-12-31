'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export function WishlistView() {
    const { items, removeItem, clearWishlist, totalItems } = useWishlist()
    const { addItem } = useCart()
    const { user } = useAuth()
    const router = useRouter()

    const handleAddToCart = (item: any) => {
        if (!user) {
            router.push('/login?redirect=/wishlist')
            return
        }

        addItem({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
            slug: item.slug
        })
    }

    const handleRemoveFromWishlist = (productId: string) => {
        removeItem(productId)
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md p-8 text-center">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
                    <p className="text-gray-600 mb-6">
                        Please sign in to view your wishlist
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push('/login?redirect=/wishlist')}
                            className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="w-full"
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                            <p className="text-gray-600">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your wishlist
                            </p>
                        </div>
                    </div>
                    {totalItems > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearWishlist}
                            className="text-red-600 hover:text-red-800"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>

                {totalItems === 0 ? (
                    <Card className="p-12 text-center">
                        <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-600 mb-6">
                            Start adding items you love to your wishlist
                        </p>
                        <Link href="/products">
                            <Button className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold">
                                Start Shopping
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Product Image */}
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <Link href={`/products/${item.slug}`}>
                                        <Image
                                            src={item.image || '/placeholder.jpg'}
                                            alt={item.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </Link>

                                    {/* Remove from wishlist button */}
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item.productId)}
                                        className="absolute top-3 right-3 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                                    >
                                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                                    </button>

                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <Badge variant="secondary" className="bg-white/90 text-gray-700">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <Link href={`/products/${item.slug}`}>
                                        <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg font-bold text-gray-900">
                                            LKR {item.price.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => handleAddToCart(item)}
                                            className="flex-1 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-medium"
                                            size="sm"
                                        >
                                            <ShoppingBag className="h-4 w-4 mr-1" />
                                            Add to Cart
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRemoveFromWishlist(item.productId)}
                                            size="sm"
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
