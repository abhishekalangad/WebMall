'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/ProductCard'
import { InstagramShowcase } from '@/components/home/InstagramShowcase'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

interface HomeViewProps {
    featuredProducts: any[]
    initialCategories: any[]
}

export function HomeView({ featuredProducts, initialCategories }: HomeViewProps) {
    const { user } = useAuth()
    const { addItem: addToCart } = useCart()
    const { addItem: addToWishlist } = useWishlist()
    const { banners, settings } = useSiteConfig()
    const [currentSlide, setCurrentSlide] = React.useState(0)

    React.useEffect(() => {
        if (banners.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % banners.length)
            }, 5000)
            return () => clearInterval(timer)
        }
    }, [banners.length])

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length)
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)

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
            category: product.category?.name || 'Uncategorized'
        })
    }

    return (
        <div className="min-h-screen">
            <section className="relative min-h-[600px] lg:h-[800px] bg-[#fffcf9] overflow-hidden flex items-center">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#fdf2f8]/50 skew-x-[-12deg] translate-x-32 z-0" />
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-pink-100/40 rounded-full blur-3xl z-0 animate-pulse" />
                <div className="absolute bottom-[10%] right-[15%] w-96 h-96 bg-yellow-50/60 rounded-full blur-3xl z-0" />

                {banners.length > 0 ? (
                    <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={banners[currentSlide].id}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
                            >
                                {/* Text Content Side */}
                                <div className="order-2 lg:order-1 text-center lg:text-left">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-pink-500 bg-pink-50 rounded-full">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            New Arrival
                                        </span>

                                        <h1 className="text-5xl md:text-7xl font-playfair font-bold text-gray-900 mb-8 leading-[1.1]">
                                            {banners[currentSlide].title.split(' ').map((word, i) => (
                                                <motion.span
                                                    key={i}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                                    className="inline-block mr-3"
                                                >
                                                    {word}
                                                </motion.span>
                                            ))}
                                        </h1>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.7 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed"
                                        >
                                            {banners[currentSlide].subtitle}
                                        </motion.p>

                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                            className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start"
                                        >
                                            <Link href={banners[currentSlide].ctaLink || '/products'}>
                                                <Button size="lg" className="h-14 px-10 rounded-full bg-gray-900 text-white hover:bg-black hover:scale-105 transition-all duration-300 font-bold shadow-xl">
                                                    {banners[currentSlide].ctaText || 'Shop Now'}
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                            </Link>

                                            <Link href="/products" className="text-gray-900 font-semibold border-b-2 border-pink-200 hover:border-pink-400 transition-all py-1">
                                                View Collection
                                            </Link>
                                        </motion.div>
                                    </motion.div>
                                </div>

                                {/* Image Side - Editorial Frame */}
                                <div className="order-1 lg:order-2 relative">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "circOut" }}
                                        className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] group"
                                    >
                                        <Image
                                            src={banners[currentSlide].imageUrl}
                                            alt={banners[currentSlide].title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent" />

                                        {/* Floating Badge on Image */}
                                        {banners[currentSlide].showBadge && (
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute top-8 right-8 w-24 h-24 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-center p-2 shadow-lg border border-white/20"
                                            >
                                                <span className="text-[10px] font-bold text-gray-900 leading-tight uppercase tracking-tighter">
                                                    Authentic<br />Sri Lankan<br />Craft
                                                </span>
                                            </motion.div>
                                        )}
                                    </motion.div>

                                    {/* Decorative Floating Card */}
                                    {banners[currentSlide].showTopRated && (
                                        <motion.div
                                            initial={{ x: 50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl hidden md:block"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
                                                    <Star className="w-5 h-5 fill-current" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">Top Rated</p>
                                                    <p className="text-[10px] text-gray-500">Selected by customers</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Pagination Progress Controls */}
                        {banners.length > 1 && (
                            <div className="absolute bottom-[-60px] lg:bottom-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 flex items-center gap-4">
                                <div className="flex gap-2">
                                    {banners.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-12 bg-gray-900' : 'w-4 bg-gray-200'}`}
                                        />
                                    ))}
                                </div>
                                <div className="hidden lg:flex gap-2 ml-4">
                                    <button onClick={prevSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={nextSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </section>


            {/* Features Section */}
            <section className="py-12 md:py-20 bg-white">
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
            <section className="py-12 md:py-20 bg-gray-50">
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
            <section className="py-12 md:py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">Featured Products</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Discover our most popular and trending accessories, loved by customers across Sri Lanka.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12">
                        {featuredProducts.map((product) => (
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



            {/* Instagram Showcase */}
            {settings && (
                <InstagramShowcase
                    instagramUrl1={settings.instagramUrl || ''}
                    instagramUrl2={settings.instagramUrl2 || ''}
                />
            )}

            {/* CTA Section */}
            <section className="py-12 md:py-20 bg-gray-900">
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
