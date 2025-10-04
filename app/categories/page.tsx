'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const categories = [
  {
    name: 'Jewelry',
    image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg',
    description: 'Beautiful traditional and modern jewelry pieces',
    count: '250+ items',
    href: '/products?category=jewelry'
  },
  {
    name: 'Bags',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg',
    description: 'Elegant bags and purses for every occasion',
    count: '150+ items',
    href: '/products?category=bags'
  },
  {
    name: 'Phone Covers',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
    description: 'Stylish and protective phone covers',
    count: '300+ items',
    href: '/products?category=phone-covers'
  },
  {
    name: 'Accessories',
    image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg',
    description: 'Essential accessories to complete your look',
    count: '200+ items',
    href: '/products?category=accessories'
  }
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-pink-50 to-yellow-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-playfair font-bold text-gray-900 mb-6">
              Browse Categories
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our diverse collection of Sri Lankan fashion accessories. 
              Each category is carefully curated to offer you the finest selection 
              of authentic products.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="group">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm group-hover:shadow-lg transition-all duration-300">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-3xl font-playfair font-bold mb-2">{category.name}</h3>
                    <p className="text-lg mb-2 opacity-90">{category.description}</p>
                    <p className="text-sm opacity-80">{category.count}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Browse all our products or use our search feature to find exactly what you need. 
              Our team is always ready to help you find the perfect accessory.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8">
                  View All Products
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                  Sign In to Save Favorites
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
