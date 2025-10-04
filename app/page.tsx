'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/ProductCard'
import { useCart } from '@/contexts/CartContext'

// Mock data for featured products
const featuredProducts = [
  {
    id: '1',
    name: 'Pearl & Gold Earrings',
    slug: 'pearl-gold-earrings',
    price: 3500,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings' }],
    category: { name: 'Jewelry' }
  },
  {
    id: '2',
    name: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    price: 8900,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather bag' }],
    category: { name: 'Bags' }
  },
  {
    id: '3',
    name: 'Crystal Bracelet Set',
    slug: 'crystal-bracelet-set',
    price: 2800,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Crystal bracelet' }],
    category: { name: 'Jewelry' }
  },
  {
    id: '4',
    name: 'Silk Phone Cover',
    slug: 'silk-phone-cover',
    price: 1200,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg', alt: 'Phone cover' }],
    category: { name: 'Phone Covers' }
  }
]

const categories = [
  {
    name: 'Jewelry',
    image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg',
    count: '250+ items',
    href: '/products?category=jewelry'
  },
  {
    name: 'Bags',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg',
    count: '150+ items',
    href: '/products?category=bags'
  },
  {
    name: 'Phone Covers',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
    count: '300+ items',
    href: '/products?category=phone-covers'
  },
  {
    name: 'Accessories',
    image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg',
    count: '200+ items',
    href: '/products?category=accessories'
  }
]

export default function HomePage() {
  const { addItem } = useCart()

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0]?.url,
      slug: product.slug
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-yellow-50 to-green-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-yellow-100/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
              <Image
                src="https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg"
                alt="Beautiful accessories"
                width={600}
                height={600}
                className="relative rounded-3xl shadow-2xl object-cover"
              />
            </div>
          </div>
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
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="group">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm group-hover:shadow-lg transition-all duration-300">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm opacity-90">{category.count}</p>
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
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
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