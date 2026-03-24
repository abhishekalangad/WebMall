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
import { useSearchParams, useRouter } from 'next/navigation'

interface Product {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    images: { url: string; alt?: string | null }[]
    category: { name: string } | null | undefined
    description?: string
    variants?: any[]
}

interface ProductsViewProps {
    initialProducts: Product[]
    initialCategories: string[]
}

export function ProductsView({ initialProducts: products, initialCategories: categories }: ProductsViewProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialCategoryParam = searchParams.get('category')?.toLowerCase().replace(/-/g, ' ')
    const initialCategory = categories.find(c => c.toLowerCase() === initialCategoryParam) || 'All'
    const initialSearch = searchParams.get('search') || ''
    const initialSort = searchParams.get('sort') || 'name'
    const initialViewMode = (searchParams.get('view') as 'grid'|'list') || 'grid'

    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)
    const [sortBy, setSortBy] = useState(initialSort)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
    const { addItem } = useCart()
    const { addItem: addToWishlist } = useWishlist()
    const { user } = useAuth()

    // Sync state changes to URL to enable perfect scroll restoration on browser back
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        if (selectedCategory !== 'All') params.set('category', selectedCategory.toLowerCase().replace(/ /g, '-'))
        if (sortBy !== 'name') params.set('sort', sortBy)
        if (viewMode !== 'grid') params.set('view', viewMode)
        
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.history.replaceState(null, '', newUrl)
    }, [searchQuery, selectedCategory, sortBy, viewMode])

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
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-playfair font-bold text-foreground mb-4">
                        Fashion Accessories
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Discover our complete collection of beautiful accessories
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-card dark:border dark:border-border rounded-2xl shadow-sm p-6 mb-8">
                    {/* Controls Row */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
                            {/* Search Bar */}
                            <div className="relative flex-1 w-full sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full bg-muted/50 rounded-full border-transparent focus:bg-background transition-colors"
                                />
                            </div>

                            {/* Sort */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-[140px] border-none bg-muted/50 rounded-full px-4 text-foreground">
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
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 self-end lg:self-auto">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={`px-3 rounded-md ${viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={`px-3 rounded-md ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Category Tabs Row */}
                    <div className="w-full border-t border-border pt-4">
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                        ? 'bg-foreground text-background shadow-lg scale-105'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
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
                    <p className="text-muted-foreground">
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
                            layout={viewMode}
                        />
                    ))}
                </div>

                {/* No Results */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="mb-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                        <p className="text-muted-foreground mb-6">
                            Try adjusting your search or filter criteria
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery('')
                                setSelectedCategory('All')
                            }}
                            variant="outline"
                            className="dark:border-border dark:text-foreground"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
