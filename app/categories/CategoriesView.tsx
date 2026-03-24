'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, FolderOpen } from 'lucide-react'

interface CategoriesViewProps {
    categories: any[]
}

export function CategoriesView({ categories }: CategoriesViewProps) {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Header */}
            <section className="bg-muted py-16">
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
                        <h1 className="text-5xl font-playfair font-bold text-foreground mb-6">
                            Browse Categories
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                            <Link key={category.id} href={`/products?category=${category.slug}`} className="group">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border shadow-sm group-hover:shadow-lg transition-all duration-300">
                                    {category.image ? (
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                            <FolderOpen className="h-20 w-20 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 text-white text-shadow-sm">
                                        <h3 className="text-3xl font-playfair font-bold mb-2">{category.name}</h3>
                                        <p className="text-lg mb-2 opacity-90">{category.description || 'No description available.'}</p>
                                        <p className="text-sm opacity-80 font-semibold tracking-wider uppercase">View Collection</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Additional Info */}
            <section className="py-20 bg-background border-t border-border mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-playfair font-bold text-foreground mb-6">
                            Can't Find What You're Looking For?
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                            Browse all our products or use our search feature to find exactly what you need.
                            Our team is always ready to help you find the perfect accessory.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/products">
                                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8 shadow-md">
                                    View All Products
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted px-8">
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
