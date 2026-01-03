'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
    ShoppingBag,
    Heart,
    Share2,
    Star,
    Truck,
    Shield,
    RotateCcw,
    ArrowLeft,
    Plus,
    Minus,
    Check,
    Loader2
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductDetailViewProps {
    product: any
}

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
    const router = useRouter()
    const { items, addItem, updateQuantity } = useCart()
    const { user } = useAuth()
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
    const { toast } = useToast()
    const [selectedImage, setSelectedImage] = useState(0)

    // Find if item is in cart
    const cartItem = items.find(item => item.productId === initialProduct.id)
    const inCartQty = cartItem ? cartItem.quantity : 0

    // Local quantity
    const [quantity, setQuantity] = useState(inCartQty || 1)
    const [activeTab, setActiveTab] = useState('Description')

    // Review state
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const [reviews, setReviews] = useState<any[]>(initialProduct.reviews || [])

    // Sync local quantity with cart
    useEffect(() => {
        if (inCartQty > 0) {
            setQuantity(inCartQty)
        }
    }, [inCartQty])

    // Load reviews
    useEffect(() => {
        const fetchReviews = async () => {
            // Fetch reviews logic here (simplified for now, ideally strictly from API)
            // We'll trust the initial fetch doesn't have them, or add an API endpoint later.
            // For now, let's just use empty or mock.
            // In a real implementation: fetch(`/api/products/${initialProduct.id}/reviews`)
        }
    }, [initialProduct.id])

    // Transform product data, calculating rating from simple fields if needed, 
    // or use passed in calculated fields.
    const { settings } = useSiteConfig()

    // Transform product data
    const product = {
        ...initialProduct,
        images: initialProduct.images && initialProduct.images.length > 0
            ? initialProduct.images.map((img: any) => ({ url: img.url, alt: img.alt || initialProduct.name }))
            : [{ url: '/placeholder.jpg', alt: initialProduct.name }],
        category: initialProduct.category || { name: 'Uncategorized', slug: 'uncategorized' },
        inStock: initialProduct.status === 'active' && initialProduct.stock > 0,
        stockCount: initialProduct.stock || 0,
        // Dynamic features based on real data
        features: [
            initialProduct.category?.name ? `Category: ${initialProduct.category.name}` : null,
            initialProduct.stock > 0 ? `In Stock` : `Out of Stock`,
            // Add more dynamic features if available in DB attributes in future
        ].filter(Boolean),
        specifications: {
            'Category': initialProduct.category?.name || 'General',
            'Currency': initialProduct.currency || 'LKR'
        },
        shipping: {
            free: settings ? initialProduct.price >= settings.freeShippingThreshold : false,
            estimatedDays: '2-3 business days', // Could be dynamic if added to settings
            returnPolicy: '7 days' // Standard policy
        },
        // Real rating or 0
        rating: initialProduct.averageRating || 0,
        reviewCount: initialProduct.reviewCount || 0,
        longDescription: initialProduct.description
    }

    const handleAddToCart = () => {
        if (!user) {
            router.push('/login?redirect=/products/' + product.slug)
            return
        }
        if (inCartQty > 0) {
            updateQuantity(product.id, quantity)
        } else {
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: product.images[0]?.url,
                slug: product.slug
            })
        }
    }

    const handleWishlist = () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (isInWishlist(product.id)) {
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

    const handleSubmitReview = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        if (rating === 0) {
            toast({ title: "Error", description: "Please select a rating", variant: "destructive" })
            return
        }

        setIsSubmittingReview(true)
        try {
            const res = await fetch('/api/products/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    userId: user.id,
                    rating,
                    comment
                })
            })
            const data = await res.json()

            if (!res.ok) {
                // If it's a purchase verification error (403), show clear message
                if (res.status === 403) {
                    toast({
                        title: "Purchase Required",
                        description: "You must have purchased this product to leave a review.",
                        variant: "destructive"
                    })
                } else {
                    throw new Error(data.error || 'Failed to submit')
                }
            } else {
                toast({ title: "Success", description: "Review submitted successfully!" })
                setRating(0)
                setComment('')
                // Refresh reviews (future implementation)
            }
        } catch (error) {
            console.error(error)
            // Toast already handled for API errors often, but catch generic network ones
            if (!(error instanceof Error && error.message === 'Failed to submit')) {
                // handled above
            }
        } finally {
            setIsSubmittingReview(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb ... (omitted for brevity, assume standard) */}
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Images Section */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
                            <Image
                                src={product.images[selectedImage]?.url || '/placeholder.png'}
                                alt={product.name}
                                width={600}
                                height={600}
                                className="w-full h-full object-cover"
                                priority
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {product.images.map((img: any, i: number) => (
                                <button key={i} onClick={() => setSelectedImage(i)} className={`aspect-square rounded-lg border-2 ${selectedImage === i ? 'border-pink-500' : 'border-gray-200'}`}>
                                    <Image src={img.url} alt="thumb" width={100} height={100} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <Badge className="bg-pink-100 text-pink-700">{product.category?.name || 'General'}</Badge>
                            {product.inStock ?
                                <span className="text-green-600 flex items-center text-sm font-medium"><Check className="h-4 w-4 mr-1" /> In Stock</span> :
                                <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                            }
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold">{product.currency} {product.price.toLocaleString()}</span>
                        </div>

                        <p className="text-gray-600">{product.description}</p>

                        {/* Add to Cart Actions */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center space-x-4">
                                <span className="font-medium">Quantity</span>
                                <div className="flex items-center border rounded-lg bg-white">
                                    <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
                                    <span className="w-8 text-center">{quantity}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={handleAddToCart} disabled={!product.inStock} className="flex-1 bg-gradient-to-r from-pink-300 to-yellow-300 text-gray-900 font-semibold h-12">
                                    <ShoppingBag className="mr-2 h-5 w-5" /> {inCartQty > 0 ? 'Update Cart' : 'Add to Cart'}
                                </Button>
                                <Button variant="outline" onClick={handleWishlist} className={`h-12 w-12 ${isInWishlist(product.id) ? 'text-red-500' : ''}`}>
                                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-16">
                    <div className="border-b">
                        <nav className="flex space-x-8">
                            {['Description', 'Specifications', 'Reviews'].map(tab => (
                                <button key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="py-8">
                        {activeTab === 'Description' && (
                            <div className="prose max-w-none text-gray-600">{product.longDescription}</div>
                        )}
                        {activeTab === 'Specifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(product.specifications).map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-2 border-b">
                                        <span className="font-medium text-gray-700">{k}</span>
                                        <span className="text-gray-600">{v as string}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'Reviews' && (
                            <div className="max-w-2xl">
                                <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                                    <h3 className="text-lg font-bold mb-4">Write a Review</h3>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">Rating</label>
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} onClick={() => setRating(star)} type="button">
                                                    <Star className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">Review</label>
                                        <Textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Share your thoughts about this product..."
                                            rows={4}
                                        />
                                    </div>
                                    <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                        {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Review'}
                                    </Button>
                                </div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review: any) => (
                                            <div key={review.id} className="border-b pb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 relative overflow-hidden rounded-full bg-gray-100 border mr-3">
                                                            {review.user?.image ? (
                                                                <Image src={review.user.image} alt={review.user.name || 'User'} fill className="object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold bg-pink-100/50">
                                                                    {(review.user?.name || 'A').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(review.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 mt-2">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                                        <p>No reviews yet. Be the first to review!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
