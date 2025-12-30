'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  images: { url: string; alt?: string }[]
  category: { name: string }
}




function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()
  const { addItem: addToWishlist } = useWishlist()
  const { user } = useAuth()

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ])

        if (!productsRes.ok) throw new Error('Failed to fetch products')

        const productsData = await productsRes.json()
        setProducts(productsData)
        setFilteredProducts(productsData)

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          const categoryNames = ['All', ...categoriesData.map((c: any) => c.name)]
          setCategories(categoryNames)
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  // Handle URL query parameters on page load
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const searchParam = searchParams.get('search')

    if (categoryParam) {
      // Just set it directly, URL uses slug but we match by name or slug in filter logic
      // For now, let's assume categoryParam is the name for simplicity as per existing logic
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
        product.category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category.name === selectedCategory)
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
      category: product.category.name
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-pink-400 mb-4" />
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Failed to load products</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
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
            <div className={`grid gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-400 mb-4" />
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
