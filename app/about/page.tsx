import React from 'react'
import { Users, Award, Globe, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about WebMall, your destination for authentic Sri Lankan fashion accessories and handcrafted jewelry.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-yellow-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-playfair font-bold text-gray-900 mb-6">
              About WebMall
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your gateway to beautiful Sri Lankan fashion accessories. We bring you authentic,
              handcrafted jewelry, bags, and accessories that tell the story of Sri Lankan craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-Relaxed">
                <p>
                  WebMall was born from a passion to showcase the exceptional craftsmanship
                  of Sri Lankan artisans to the world. Founded in 2024, we have been
                  curating and delivering beautiful fashion accessories that blend traditional
                  techniques with modern aesthetics.
                </p>
                <p>
                  Our journey began with a simple belief: that authentic Sri Lankan fashion
                  accessories deserve a global platform. Today, we're proud to connect
                  thousands of customers worldwide with the finest jewelry, bags, and
                  accessories crafted by skilled local artisans.
                </p>
                <p>
                  Every piece in our collection is carefully selected for its quality,
                  uniqueness, and cultural significance. We work directly with artisans
                  and suppliers to ensure authenticity while supporting local communities.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-12 w-12 text-pink-500" />
                  </div>
                  <p className="text-gray-700 font-medium">Crafting Beautiful Memories</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality First</h3>
              <p className="text-gray-600">We prioritize exceptional craftsmanship and premium materials in every product.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Authenticity</h3>
              <p className="text-gray-600">Genuine Sri Lankan products with cultural significance and traditional techniques.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-300 to-pink-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="text-gray-600">Supporting local artisans and contributing to sustainable economic growth.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-green-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Care</h3>
              <p className="text-gray-600">Exceptional service and support to ensure your complete satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-playfair font-bold text-gray-900 mb-6">
            Join Our Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover authentic Sri Lankan accessories, support local artisans,
            and add beautiful pieces to your collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8">
                Shop Our Collection
              </Button>
            </Link>
            <Link href="/cart">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
