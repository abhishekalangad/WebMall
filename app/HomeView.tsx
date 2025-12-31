'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/ProductCard'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

interface HomeViewProps {
    initialProducts: any[]
    initialCategories: any[]
}

export function HomeView({ initialProducts, initialCategories }: HomeViewProps) {
    const { user } = useAuth()
    const { addItem: addToCart } = useCart()
    const { addItem: addToWishlist } = useWishlist()
    const { banners } = useSiteConfig()

    const handleAddToCart = (product: any) => {
        if (!user) {
            window.location.href = '/login'
            return
        }
        addToCart({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images[0]?.url,
            slug: product.slug
        })
    }

    const handleAddToWishlist = (product: any) => {
        if (!user) {
            window.location.href = '/login'
            return
        }
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

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-pink-50 via-yellow-50 to-green-50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-yellow-100/20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    {banners.length > 0 ? (
                        <div className="space-y-12">
                            {banners.map((banner, index) => (
                                <div key={banner.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index > 0 ? 'mt-24 pt-24 border-t border-gray-100' : ''}`}>
                                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                                        <h1 className="text-5xl md:text-6xl font-playfair font-bold text-gray-900 mb-6 leading-tight">
                                            {banner.title}
                                        </h1>
                                        {banner.subtitle && (
                                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                                {banner.subtitle}
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {banner.ctaLink && (
                                                <Link href={banner.ctaLink}>
                                                    <Button size="lg" className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8">
                                                        {banner.ctaText || 'Shop Now'}
                                                        <ArrowRight className="ml-2 h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                                        <div className="absolute -inset-4 bg-gradient-to-r from-pink-200 to-yellow-200 rounded-3xl blur-2xl opacity-30"></div>
                                        <div className="relative w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                                            <Image
                                                src={banner.imageUrl}
                                                alt={banner.title}
                                                fill
                                                className="object-cover"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-playfair font-bold text-gray-900 mb-6 leading-tight">
                                    Discover
                                    <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent"> Beautiful </span>
                                    Accessories
                                </h1>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    Explore our curated collection of Sri Lankan fashion accessories.
                                    From handcrafted jewelry to elegant bags, find pieces that tell your unique story.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link href="/products">
                                        <Button size="lg" className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8">
                                            Shop Now
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <Link href="/categories">
                                        <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                                            Browse Categories
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-pink-200 to-yellow-200 rounded-3xl blur-2xl opacity-30"></div>
                                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                                    <Image
                                        src="/hero/img1.png"
                                        alt="Beautiful accessories"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>


            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                            <p className="text-gray-600">Carefully selected accessories made with the finest materials and craftsmanship.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Truck className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                            <p className="text-gray-600">Quick and reliable delivery across Sri Lanka with careful packaging.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-300 to-pink-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
                            <p className="text-gray-600">Safe and secure payment options with buyer protection guarantee.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">Shop by Category</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Explore our diverse collection of fashion accessories, each category carefully curated for style and quality.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {initialCategories.map((category) => (
                            <Link key={category.id} href={`/products?category=${category.slug}`} className="group">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm group-hover:shadow-lg transition-all duration-300">
                                    {category.image ? (
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                            <Sparkles className="h-12 w-12 text-gray-200" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                                        <p className="text-sm opacity-90">View Collection</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">Featured Products</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Discover our most popular and trending accessories, loved by customers across Sri Lanka.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {initialProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                onAddToWishlist={handleAddToWishlist}
                                showAddToCart={!!user}
                                showWishlist={!!user}
                            />
                        ))}
                    </div>
                    <div className="text-center">
                        <Link href="/products">
                            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                View All Products
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-gradient-to-br from-pink-50 to-yellow-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">What Our Customers Say</h2>
                        <p className="text-xl text-gray-600">Join thousands of happy customers who love their WebMall purchases.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center mb-4">
                                    {[...Array(5)].map((_, index) => (
                                        <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-4">
                                    "Amazing quality and beautiful designs! The jewelry I ordered exceeded my expectations.
                                    Fast delivery and excellent customer service."
                                </p>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-yellow-300 rounded-full"></div>
                                    <div className="ml-3">
                                        <p className="font-semibold text-gray-900">Sarah Fernando</p>
                                        <p className="text-sm text-gray-600">Colombo</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-playfair font-bold text-white mb-6">
                        Ready to Find Your Perfect Accessory?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        Join our community of fashion-forward customers and discover accessories that complement your unique style.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/products">
                            <Button size="lg" className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8">
                                Start Shopping
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/about">
                            <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
