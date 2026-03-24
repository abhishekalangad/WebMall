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
import { getValidImageUrl, handleImageError } from '@/lib/image-utils'

export function WishlistView() {
    const { items, removeItem, clearWishlist, totalItems, refreshWishlistData } = useWishlist()
    const { addItem } = useCart()
    const { user } = useAuth()
    const router = useRouter()

    React.useEffect(() => {
        refreshWishlistData()
    }, [refreshWishlistData])

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
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center bg-card border-border shadow-lg">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
                    <p className="text-muted-foreground mb-6">
                        Please sign in to view your wishlist
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push('/login?redirect=/wishlist')}
                            className="w-full bg-foreground text-background hover:bg-muted-foreground font-semibold"
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="w-full border-border hover:bg-muted"
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center border-border hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                            <p className="text-muted-foreground">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your wishlist
                            </p>
                        </div>
                    </div>
                    {totalItems > 0 && (
                        <Button
                            variant="outline"
                            onClick={clearWishlist}
                            className="text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>

                {totalItems === 0 ? (
                    <Card className="p-12 text-center bg-card border-border shadow-sm">
                        <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
                        <p className="text-muted-foreground mb-6">
                            Start adding items you love to your wishlist
                        </p>
                        <Link href="/products">
                            <Button className="bg-foreground text-background hover:bg-muted-foreground font-semibold px-8 transition-colors">
                                Start Shopping
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="group relative overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300">
                                {/* Product Image */}
                                <div className="relative aspect-square overflow-hidden bg-muted">
                                    <Link href={`/products/${item.slug}`}>
                                        <Image
                                            src={getValidImageUrl(item.image, '/placeholder.png')}
                                            alt={item.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={handleImageError}
                                        />
                                    </Link>

                                    {/* Remove from wishlist button */}
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item.productId)}
                                        className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background shadow-sm"
                                    >
                                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                                    </button>

                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <Link href={`/products/${item.slug}`}>
                                        <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors line-clamp-2">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg font-bold text-foreground">
                                            LKR {item.price.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex space-x-2">
                                        {item.inStock === false ? (
                                            <Button
                                                disabled
                                                className="flex-1 bg-muted text-muted-foreground font-medium"
                                                size="sm"
                                            >
                                                Out of Stock
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleAddToCart(item)}
                                                className="flex-1 bg-foreground text-background hover:bg-muted-foreground font-medium transition-colors"
                                                size="sm"
                                            >
                                                <ShoppingBag className="h-4 w-4 mr-1" />
                                                Add to Cart
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRemoveFromWishlist(item.productId)}
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 border-border hover:bg-muted"
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
