import React from 'react'
import { Users, Award, Globe, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'

import { prisma } from '@/lib/prisma'
import { GalleryCarousel } from '@/components/about/GalleryCarousel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about WebMall, your destination for authentic Sri Lankan fashion accessories and handcrafted jewelry.',
}

export default async function AboutPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' }
  })

  const galleryImages = (settings as any)?.aboutGalleryImages || []

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-playfair font-bold text-foreground mb-6">
              About WebMall
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your gateway to beautiful Sri Lankan fashion accessories. We bring you authentic,
              handcrafted jewelry, bags, and accessories that tell the story of Sri Lankan craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-muted-foreground leading-Relaxed">
                <p>
                  WebMall was born from a passion to showcase the exceptional craftsmanship
                  of Sri Lankan artisans to the world. Founded in 2021, we have been
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
              <GalleryCarousel images={galleryImages} />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality First</h3>
              <p className="text-muted-foreground">We prioritize exceptional craftsmanship and premium materials in every product.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Authenticity</h3>
              <p className="text-muted-foreground">Genuine Sri Lankan products with cultural significance and traditional techniques.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="text-muted-foreground">Supporting local artisans and contributing to sustainable economic growth.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Care</h3>
              <p className="text-muted-foreground">Exceptional service and support to ensure your complete satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">
            Join Our Journey
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover authentic Sri Lankan accessories, support local artisans,
            and add beautiful pieces to your collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-foreground text-background hover:bg-muted-foreground font-semibold px-8 transition-colors">
                Shop Our Collection
              </Button>
            </Link>
            <Link href="/cart">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted px-8">
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
