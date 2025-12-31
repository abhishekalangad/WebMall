'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    Check
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { motion, AnimatePresence } from 'framer-motion'
import { SITE_URL } from '@/lib/constants'

interface ProductDetailViewProps {
    product: any
}

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
    const router = useRouter()
    const { items, addItem, updateQuantity } = useCart()
    const { user } = useAuth()
    const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
    const [selectedImage, setSelectedImage] = useState(0)

    // Find if item is in cart
    const cartItem = items.find(item => item.productId === initialProduct.id)
    const inCartQty = cartItem ? cartItem.quantity : 0

    // Local quantity for adding new items or updating existing ones
    const [quantity, setQuantity] = useState(inCartQty || 1)
    const [activeTab, setActiveTab] = useState('Description')

    // Sync local quantity with cart when cart changes
    React.useEffect(() => {
        if (inCartQty > 0) {
            setQuantity(inCartQty)
        }
    }, [inCartQty])

    const jsonLd = {
        // ... (truncated for brevity in search/replace)
    };

    // Transform product data for display if needed
    const product = {
        ...initialProduct,
        images: initialProduct.images && initialProduct.images.length > 0
            ? initialProduct.images.map((img: any) => ({ url: img.url, alt: img.alt || initialProduct.name }))
            : [{ url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: initialProduct.name }],
        category: initialProduct.category || { name: 'Uncategorized', slug: 'uncategorized' },
        inStock: initialProduct.status === 'active' && initialProduct.stock > 0,
        stockCount: initialProduct.stock || 0,
        features: [
            `Category: ${initialProduct.category?.name || 'General'}`,
            `Stock: ${initialProduct.stock || 0} units available`,
            'Premium quality',
            'Fast delivery',
            'Secure payment'
        ],
        specifications: {
            'Product ID': initialProduct.id,
            'Category': initialProduct.category?.name || 'General',
            'Status': initialProduct.status,
            'Stock': `${initialProduct.stock || 0} units`,
            'Currency': initialProduct.currency || 'LKR'
        },
        shipping: {
            free: initialProduct.price >= 2000,
            estimatedDays: '2-3 business days',
            returnPolicy: '30 days'
        },
        rating: 4.8, // Mock
        reviewCount: 127, // Mock
        longDescription: initialProduct.description // Use same description for now
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
            router.push('/login?redirect=/products/' + product.slug)
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
                category: product.category.name
            })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-gray-700">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-gray-700">Products</Link>
                    <span>/</span>
                    <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-700">
                        {product.category.name}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </div>

                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
                            <Image
                                src={product.images[selectedImage]?.url}
                                alt={product.images[selectedImage]?.alt || product.name}
                                width={600}
                                height={600}
                                className="w-full h-full object-cover"
                                priority
                            />
                        </div>

                        {/* Thumbnail Images */}
                        <div className="grid grid-cols-4 gap-3">
                            {product.images.map((image: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-pink-500' : 'border-gray-200'
                                        }`}
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.alt || product.name}
                                        width={150}
                                        height={150}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Category & Stock */}
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                {product.category.name}
                            </Badge>
                            <div className="flex items-center space-x-2">
                                {product.inStock ? (
                                    <div className="flex items-center text-green-600">
                                        <Check className="h-4 w-4 mr-1" />
                                        <span className="text-sm font-medium">In Stock ({product.stockCount})</span>
                                    </div>
                                ) : (
                                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                                )}
                            </div>
                        </div>

                        {/* Title & Rating */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < Math.floor(product.rating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {product.rating} ({product.reviewCount} reviews)
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center space-x-4">
                            <span className="text-3xl font-bold text-gray-900">
                                {product.currency} {product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && (
                                <>
                                    <span className="text-xl text-gray-500 line-through">
                                        {product.currency} {product.originalPrice.toLocaleString()}
                                    </span>
                                    <Badge className="bg-red-100 text-red-700">
                                        {product.discount}% OFF
                                    </Badge>
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>

                        {/* Features */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                            <ul className="space-y-2">
                                {product.features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-center text-gray-600">
                                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Quantity & Add to Cart */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                                    <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const newQty = Math.max(0, quantity - 1)
                                                setQuantity(newQty)
                                                if (inCartQty > 0) updateQuantity(product.id, newQty)
                                            }}
                                            className="hover:text-pink-600"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="px-4 py-2 text-sm font-bold min-w-[3rem] text-center">{quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const newQty = Math.min(product.stockCount, quantity + 1)
                                                setQuantity(newQty)
                                                if (inCartQty > 0) updateQuantity(product.id, newQty)
                                            }}
                                            className="hover:text-pink-600"
                                            disabled={quantity >= product.stockCount}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {inCartQty > 0 && (
                                    <Badge variant="outline" className="text-pink-600 border-pink-200 bg-pink-50 animate-fade-in">
                                        <Check className="h-3 w-3 mr-1" />
                                        {inCartQty} in Cart
                                    </Badge>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock || (quantity === inCartQty && inCartQty > 0)}
                                    className={`flex-1 font-semibold py-3 transition-all ${inCartQty > 0
                                            ? 'bg-gray-900 hover:bg-black text-white'
                                            : 'bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900'
                                        }`}
                                >
                                    <ShoppingBag className="h-5 w-5 mr-2" />
                                    {inCartQty > 0 ? (quantity === 0 ? 'Remove from Cart' : 'Update Cart Quantity') : 'Add to Cart'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleWishlist}
                                    className={`px-4 ${isInWishlist(product.id) ? 'text-red-500 border-red-500' : ''}`}
                                >
                                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                </Button>
                                <Button variant="outline" className="px-4">
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <Card className="p-4 bg-green-50 border-green-200">
                            <div className="flex items-center space-x-4">
                                <Truck className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-800">
                                        {product.shipping.free ? 'Free Shipping' : 'Shipping Available'}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Estimated delivery: {product.shipping.estimatedDays}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Product Details Tabs */}
                <div className="mt-16">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
                            {['Description', 'Specifications', 'Shipping & Returns'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${activeTab === tab
                                        ? 'border-pink-500 text-pink-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="py-8 relative overflow-hidden min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'Description' && (
                                <motion.div
                                    key="description"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="prose max-w-none"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
                                    <p className="text-gray-600 leading-relaxed mb-6">{product.longDescription}</p>
                                </motion.div>
                            )}

                            {activeTab === 'Specifications' && (
                                <motion.div
                                    key="specifications"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="prose max-w-none"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                        {Object.entries(product.specifications).map(([key, value]) => (
                                            <div key={key} className="flex justify-between py-3 border-b border-gray-100 items-center">
                                                <span className="font-medium text-gray-700">{key}:</span>
                                                <span className="text-gray-600 text-right ml-4">{value as string}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'Shipping & Returns' && (
                                <motion.div
                                    key="shipping"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="prose max-w-none"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping & Returns</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                                <Truck className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Free Shipping</h4>
                                            <p className="text-sm text-gray-600">On orders over LKR 2,000. Reliable island-wide delivery.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                                <Shield className="h-6 w-6 text-green-500" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
                                            <p className="text-sm text-gray-600">Your payment information is end-to-end encrypted and safe.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                                <RotateCcw className="h-6 w-6 text-purple-500" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Easy Returns</h4>
                                            <p className="text-sm text-gray-600">Hassle-free {product.shipping.returnPolicy} return policy if you're not satisfied.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
