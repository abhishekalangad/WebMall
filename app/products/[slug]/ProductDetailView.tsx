'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
    X,
    Loader2
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getValidImageUrl, handleImageError } from '@/lib/image-utils'

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
    const [manualImageOverride, setManualImageOverride] = useState<string | null>(null)

    // Local quantity
    const [quantity, setQuantity] = useState(1)
    const [activeTab, setActiveTab] = useState('Description')
    const [selectedVariant, setSelectedVariant] = useState<any>(null)

    // Review state
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const [reviews, setReviews] = useState<any[]>(initialProduct.reviews || [])

    // Auto-switch image when variant is selected
    useEffect(() => {
        if (selectedVariant) {
            // Priority 1: If variant has multiple images, show the first one
            if (selectedVariant.images && selectedVariant.images.length > 0) {
                setManualImageOverride(selectedVariant.images[0])
                return
            }

            // Priority 2: If variant has its own specific single image, show it (backward compatible)
            if (selectedVariant.image) {
                setManualImageOverride(selectedVariant.image)
                return
            }

            // Priority 3: Reset override if no specific image
            setManualImageOverride(null)

            // Priority 3: Try to find mapping in main images (existing logic)
            if (initialProduct.variants && initialProduct.images &&
                initialProduct.variants.length === initialProduct.images.length) {

                const variantIndex = initialProduct.variants.findIndex((v: any) => v.id === selectedVariant.id)

                if (variantIndex !== -1) {
                    setSelectedImage(variantIndex)
                    return
                }
            }

            // Don't reset selectedImage to 0 if we just don't have a mapping, 
            // user might be looking at a specific image.
        } else {
            setManualImageOverride(null)
        }
    }, [selectedVariant, initialProduct])

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

    // Transform product data with normalization
    const product = {
        ...initialProduct,
        variants: initialProduct.variants || [],  // Ensure variants is always an array
        images: initialProduct.images && initialProduct.images.length > 0
            ? initialProduct.images
                .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                .map((img: any) => ({ url: getValidImageUrl(img.url, '/placeholder.png'), alt: img.alt || initialProduct.name }))
            : [{ url: '/placeholder.png', alt: initialProduct.name }],
        category: initialProduct.category || { name: 'Uncategorized', slug: 'uncategorized' },
        inStock: selectedVariant
            ? selectedVariant.stock > 0
            : initialProduct.status === 'active' && initialProduct.stock > 0,
        stockCount: selectedVariant ? selectedVariant.stock : initialProduct.stock || 0,
        // Dynamic features based on real data
        features: [
            initialProduct.category?.name ? `Category: ${initialProduct.category.name}` : null,
            initialProduct.stock > 0 ? `In Stock` : `Out of Stock`,
            // Add more dynamic features if available in DB attributes in future
        ].filter(Boolean),
        specifications: {
            'Category': initialProduct.category?.name || 'General',
            'Currency': initialProduct.currency || 'LKR',
            ...(initialProduct.subcategory ? { 'Subcategory': initialProduct.subcategory.name } : {})
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

    // Calculate effective price based on variant selection
    const effectivePrice = selectedVariant?.priceOverride || product.price
    const maxStock = selectedVariant ? selectedVariant.stock : product.stockCount

    const handleAddToCart = () => {
        if (!user) {
            router.push('/login?redirect=/products/' + product.slug)
            return
        }

        // Validate variant selection if product has variants
        if (product.variants.length > 0 && !selectedVariant) {
            toast({
                title: "Selection Required",
                description: "Please select product options before adding to cart",
                variant: "destructive"
            })
            return
        }

        // Validate stock availability
        const availableStock = selectedVariant ? selectedVariant.stock : product.stockCount
        if (availableStock <= 0) {
            toast({
                title: "Out of Stock",
                description: "This product is currently unavailable",
                variant: "destructive"
            })
            return
        }

        // Find if this specific variant is already in cart
        const cartItem = items.find(item =>
            item.productId === product.id &&
            item.variantId === selectedVariant?.id
        )
        const inCartQty = cartItem ? cartItem.quantity : 0

        // Check if adding would exceed stock
        if (inCartQty + quantity > availableStock) {
            toast({
                title: "Stock Limit",
                description: `Only ${availableStock} units available. You have ${inCartQty} in cart.`,
                variant: "destructive"
            })
            return
        }

        // Prepare variant display name for toast
        const variantInfo = selectedVariant
            ? ` (${selectedVariant.name})`
            : ''

        if (inCartQty > 0) {
            // Update existing cart item with variant ID
            updateQuantity(product.id, quantity + inCartQty, selectedVariant?.id)
            toast({
                title: "Cart Updated",
                description: `${product.name}${variantInfo} quantity updated to ${quantity + inCartQty}!`,
            })
        } else {
            addItem({
                productId: product.id,
                variantId: selectedVariant?.id,
                name: product.name,
                price: effectivePrice,
                quantity: quantity,
                image: (selectedVariant?.images && selectedVariant.images.length > 0)
                    ? selectedVariant.images[0]
                    : (selectedVariant?.image || product.images[selectedImage]?.url || product.images[0]?.url),
                slug: product.slug,
                variantName: selectedVariant?.name,
                variantAttributes: selectedVariant?.attributes
            })
            toast({
                title: "Added to Cart!",
                description: `${product.name}${variantInfo} × ${quantity}`,
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 lg:pb-8">
                {/* Breadcrumb ... (omitted for brevity, assume standard) */}
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Images Section */}
                    <div className="space-y-4">
                        {/* Helper Banner for Variants */}
                        {product.variants && product.variants.length > 1 && product.images.length === product.variants.length && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                                <div className="bg-blue-500 rounded-full p-1">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">Tip:</span> Click on images below to select different variants
                                </p>
                            </div>
                        )}

                        <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
                            <Image
                                src={getValidImageUrl(manualImageOverride || product.images[selectedImage]?.url, '/placeholder.png')}
                                alt={product.name}
                                width={600}
                                height={600}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                                priority
                            />
                        </div>
                        {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {product.images.map((img: any, i: number) => {
                                    // Link image to variant if same number of images and variants
                                    const linkedVariant = product.variants && product.variants.length === product.images.length
                                        ? product.variants[i]
                                        : null

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedImage(i)
                                                setManualImageOverride(null)
                                                // If this image is linked to a variant, select it
                                                if (linkedVariant) {
                                                    setSelectedVariant(linkedVariant)
                                                }
                                            }}
                                            className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${selectedImage === i
                                                ? 'border-pink-500 ring-2 ring-pink-200 scale-105'
                                                : 'border-gray-200 hover:border-pink-300 hover:scale-102'
                                                }`}
                                        >
                                            <Image
                                                src={getValidImageUrl(img.url, '/placeholder.png')}
                                                alt={`Product view ${i + 1}`}
                                                width={100}
                                                height={100}
                                                className="w-full h-full object-cover"
                                                onError={handleImageError}
                                            />
                                            {/* Show variant badge if linked */}
                                            {linkedVariant && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 text-center truncate">
                                                    {Object.values(linkedVariant.attributes)[0] as string}
                                                </div>
                                            )}
                                            {/* Active indicator */}
                                            {selectedImage === i && (
                                                <div className="absolute top-1 right-1 bg-pink-500 rounded-full p-1">
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <Badge className="bg-pink-100 text-pink-700">{product.category?.name || 'General'}</Badge>
                                {product.subcategory && (
                                    <Badge variant="outline">{product.subcategory.name}</Badge>
                                )}
                            </div>
                            {product.inStock ?
                                <span className="text-green-600 flex items-center text-sm font-medium"><Check className="h-4 w-4 mr-1" /> In Stock ({maxStock})</span> :
                                <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                            }
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

                        {/* Price */}
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold">{product.currency} {effectivePrice.toLocaleString()}</span>
                            {selectedVariant && selectedVariant.priceOverride && (
                                <span className="text-lg text-gray-500 line-through">{product.currency} {product.price.toLocaleString()}</span>
                            )}
                        </div>

                        <p className="text-gray-600">{product.description}</p>

                        {/* Variants Selection */}
                        {product.variants.length > 0 && (
                            <div className="border-t pt-6 space-y-4">
                                {/* Variant Selection - Enhanced Beautiful Design */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-gray-900">Choose Options</h3>
                                            {selectedVariant && (
                                                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                    ✓ Selected
                                                </span>
                                            )}
                                        </div>

                                        {(() => {
                                            // Get all unique attribute types
                                            const allAttributeTypes = new Set<string>()
                                            product.variants.forEach((v: any) => {
                                                Object.keys(v.attributes).forEach(key => allAttributeTypes.add(key))
                                            })

                                            const attributeTypes = Array.from(allAttributeTypes)

                                            return attributeTypes.map(attrType => {
                                                const attrValues = new Set<string>()
                                                product.variants.forEach((v: any) => {
                                                    if (v.attributes[attrType]) {
                                                        attrValues.add(v.attributes[attrType])
                                                    }
                                                })

                                                const isColorAttr = attrType.toLowerCase().includes('color') || attrType.toLowerCase().includes('colour')
                                                const isSizeAttr = attrType.toLowerCase().includes('size')

                                                return (
                                                    <div key={attrType} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <Label className="text-base font-bold text-gray-900 capitalize mb-3 block flex items-center gap-2">
                                                            {isColorAttr && <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full" />}
                                                            {isSizeAttr && <span className="text-pink-500">📏</span>}
                                                            {attrType}
                                                            {selectedVariant?.attributes[attrType] && (
                                                                <span className="text-sm font-normal text-gray-600">
                                                                    : {selectedVariant.attributes[attrType]}
                                                                </span>
                                                            )}
                                                        </Label>

                                                        <div className={`grid gap-2 sm:gap-3 ${isColorAttr
                                                            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
                                                            : isSizeAttr
                                                                ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6'
                                                                : 'grid-cols-2 sm:grid-cols-3'}`}>
                                                            {Array.from(attrValues).map(value => {
                                                                const selectedAttr = selectedVariant?.attributes[attrType]
                                                                const isSelected = selectedAttr === value

                                                                // Find variants with this attribute value
                                                                const variantsWithThisValue = product.variants.filter((v: any) =>
                                                                    v.attributes[attrType] === value
                                                                )
                                                                const hasStock = variantsWithThisValue.some((v: any) => v.stock > 0)
                                                                const totalStock = variantsWithThisValue.reduce((sum: number, v: any) => sum + v.stock, 0)

                                                                return isColorAttr ? (
                                                                    <button
                                                                        key={value}
                                                                        onClick={() => {
                                                                            const matchingVariant = product.variants.find((v: any) =>
                                                                                v.attributes[attrType] === value && v.stock > 0
                                                                            ) || variantsWithThisValue[0]
                                                                            setSelectedVariant(matchingVariant)
                                                                        }}
                                                                        disabled={!hasStock}
                                                                        className={`group relative p-4 border-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                                                                            ? 'border-pink-500 bg-pink-50 ring-4 ring-pink-100 scale-105 shadow-lg'
                                                                            : 'border-gray-200 hover:border-pink-300 hover:shadow-md hover:scale-102'
                                                                            }`}
                                                                        title={`${value} ${hasStock ? `(${totalStock} available)` : '(Out of stock)'}`}
                                                                    >
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            {/* Color Swatch */}
                                                                            <div
                                                                                className={`w-10 h-10 rounded-full shadow-inner border-2 ${isSelected ? 'border-pink-400' : 'border-gray-300'} group-hover:scale-110 transition-transform`}
                                                                                style={{
                                                                                    backgroundColor: value.toLowerCase().replace(/\s/g, ''),
                                                                                    background: value.toLowerCase() === 'multicolor' || value.toLowerCase() === 'multi'
                                                                                        ? 'conic-gradient(from 0deg, red, orange, yellow, green, blue, indigo, violet, red)'
                                                                                        : value.toLowerCase()
                                                                                }}
                                                                            />
                                                                            {/* Color Name */}
                                                                            <span className={`text-xs font-semibold capitalize ${isSelected ? 'text-pink-700' : 'text-gray-700'}`}>
                                                                                {value}
                                                                            </span>
                                                                            {/* Stock Badge */}
                                                                            {hasStock && (
                                                                                <span className="text-[10px] text-green-600 font-medium">
                                                                                    {totalStock} left
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Selection Checkmark */}
                                                                        {isSelected && (
                                                                            <div className="absolute -top-2 -right-2 bg-pink-500 rounded-full p-1 shadow-md">
                                                                                <Check className="h-4 w-4 text-white" />
                                                                            </div>
                                                                        )}

                                                                        {/* Out of Stock Overlay */}
                                                                        {!hasStock && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl backdrop-blur-sm">
                                                                                <div className="text-center">
                                                                                    <X className="h-6 w-6 text-red-500 mx-auto mb-1" />
                                                                                    <span className="text-xs text-red-600 font-bold">Out</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        key={value}
                                                                        onClick={() => {
                                                                            const matchingVariant = product.variants.find((v: any) =>
                                                                                v.attributes[attrType] === value && v.stock > 0
                                                                            ) || variantsWithThisValue[0]
                                                                            setSelectedVariant(matchingVariant)
                                                                        }}
                                                                        disabled={!hasStock}
                                                                        className={`group relative py-2 px-3 sm:py-3 sm:px-4 border-2 rounded-xl text-center font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isSelected
                                                                            ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-700 ring-4 ring-pink-100 shadow-lg scale-105'
                                                                            : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50 hover:shadow-md'
                                                                            }`}
                                                                        title={`${value} ${hasStock ? `(${totalStock} available)` : '(Out of stock)'}`}
                                                                    >
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <span className="text-sm uppercase tracking-wide">{value}</span>
                                                                            {hasStock && (
                                                                                <span className="text-[10px] text-green-600 font-medium">
                                                                                    {totalStock} left
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {isSelected && (
                                                                            <div className="absolute -top-2 -right-2 bg-pink-500 rounded-full p-1 shadow-md">
                                                                                <Check className="h-4 w-4 text-white" />
                                                                            </div>
                                                                        )}

                                                                        {!hasStock && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl backdrop-blur-sm">
                                                                                <div className="text-center">
                                                                                    <X className="h-5 w-5 text-red-500 mx-auto mb-1" />
                                                                                    <span className="text-xs text-red-600 font-bold">Out</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        })()}

                                        {/* Selected Variant Summary */}
                                        {selectedVariant && (
                                            <Card className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-blue-50 border-2 border-pink-300 shadow-md">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Check className="h-5 w-5 text-green-600" />
                                                            <p className="text-sm font-medium text-gray-600">Your Selection:</p>
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900">{selectedVariant.name}</p>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {Object.entries(selectedVariant.attributes).map(([key, value]) => (
                                                                <Badge key={key} className="bg-pink-500 text-white">
                                                                    {key}: {value as string}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-pink-200 pt-3 sm:pt-0 sm:pl-4">
                                                        <p className="text-xs text-gray-600 mb-1">Price</p>
                                                        <p className="text-2xl font-bold text-pink-600">
                                                            {product.currency} {effectivePrice.toLocaleString()}
                                                        </p>
                                                        <div className="mt-2">
                                                            {selectedVariant.stock > 10 ? (
                                                                <Badge className="bg-green-500 text-white">
                                                                    ✓ In Stock ({selectedVariant.stock} units)
                                                                </Badge>
                                                            ) : selectedVariant.stock > 0 ? (
                                                                <Badge className="bg-amber-500 text-white">
                                                                    ⚠ Only {selectedVariant.stock} left!
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    ✗ Out of Stock
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add to Cart Actions */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center space-x-4">
                                <span className="font-medium">Quantity</span>
                                <div className="flex items-center border rounded-lg bg-white">
                                    <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
                                    <span className="w-8 text-center">{quantity}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={handleAddToCart} disabled={!product.inStock} className="flex-1 bg-gradient-to-r from-pink-300 to-yellow-300 text-gray-900 font-semibold h-12">
                                    <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
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

            {/* Sticky Mobile Add to Cart - Only shows on mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 lg:hidden shadow-2xl z-50">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-lg font-bold text-pink-600">
                            {product.currency} {effectivePrice.toLocaleString()}
                        </p>
                        {selectedVariant && (
                            <p className="text-xs text-gray-600 truncate">{selectedVariant.name}</p>
                        )}
                    </div>

                    {/* Quantity & Add Button */}
                    <div className="flex items-center gap-2">
                        {/* Compact Quantity Selector */}
                        <div className="flex items-center border-2 border-gray-300 rounded-lg">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2 hover:bg-gray-100"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 font-semibold text-sm">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                                className="p-2 hover:bg-gray-100"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            onClick={handleAddToCart}
                            disabled={!product.inStock}
                            className="bg-gradient-to-r from-pink-400 to-yellow-400 hover:from-pink-500 hover:to-yellow-500 text-white font-semibold px-6 py-6 shadow-lg"
                        >
                            <ShoppingBag className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
