'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Grid2x2 as Grid, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/products/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'

interface Product {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    images: { url: string; alt?: string | null }[]
    category: { name: string } | null | undefined
}

interface ProductsViewProps {
    initialProducts: Product[]
    initialCategories: string[]
}

export function ProductsView({ initialProducts: products, initialCategories: categories }: ProductsViewProps) {
    const searchParams = useSearchParams()
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [sortBy, setSortBy] = useState('name')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const { addItem } = useCart()
    const { addItem: addToWishlist } = useWishlist()
    const { user } = useAuth()

    // Handle URL query parameters on page load
    useEffect(() => {
        const categoryParam = searchParams.get('category')
        const searchParam = searchParams.get('search')

        if (categoryParam) {
            // Find the category name that matches the slug
            // For now, simple capitalize
            setSelectedCategory(categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).replace('-', ' '))
        }

        if (searchParam) {
            setSearchQuery(searchParam)
        }
    }, [searchParams])

    useEffect(() => {
        let filtered = products

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category?.name === selectedCategory)
        }

        // Sort products
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price
                case 'price-high':
                    return b.price - a.price
                case 'name':
                    return a.name.localeCompare(b.name)
                default:
                    return 0
            }
        })

        setFilteredProducts(filtered)
    }, [searchQuery, selectedCategory, sortBy, products])

    const handleAddToCart = (product: any) => {
        if (!user) {
            window.location.href = '/login'
            return
        }
        addItem({
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
                        Fashion Accessories
                    </h1>
                    <p className="text-xl text-gray-600">
                        Discover our complete collection of beautiful accessories
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    {/* Controls Row */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
                            {/* Search Bar */}
                            <div className="relative flex-1 w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full bg-gray-100 rounded-full border-transparent focus:bg-white transition-colors"
                                />
                            </div>

                            {/* Sort */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-[140px] border-none bg-gray-100 rounded-full px-4">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Name A-Z</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 self-end lg:self-auto">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="px-3 rounded-md"
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="px-3 rounded-md"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Category Tabs Row */}
                    <div className="w-full border-t pt-4">
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                        ? 'bg-gray-900 text-white shadow-lg scale-105'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>

                {/* Products Grid */}
                <div className={`grid gap-3 sm:gap-6 ${viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                    }`}>
                    {filteredProducts.map((product) => (
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

                {/* No Results */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="mb-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-6">
                            Try adjusting your search or filter criteria
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery('')
                                setSelectedCategory('All')
                            }}
                            variant="outline"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
