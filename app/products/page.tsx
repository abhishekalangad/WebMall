'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Grid2x2 as Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/products/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { useSearchParams } from 'next/navigation'

// Mock products data
const mockProducts = [
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
  },
  {
    id: '5',
    name: 'Designer Wallet',
    slug: 'designer-wallet',
    price: 4500,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Wallet' }],
    category: { name: 'Accessories' }
  },
  {
    id: '6',
    name: 'Gold Chain Necklace',
    slug: 'gold-chain-necklace',
    price: 6200,
    currency: 'LKR',
    images: [{ url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Gold necklace' }],
    category: { name: 'Jewelry' }
  }
]

const categories = ['All', 'Jewelry', 'Bags', 'Phone Covers', 'Accessories']

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(mockProducts)
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { addItem } = useCart()

  // Handle URL query parameters on page load
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      // Map URL parameter values to category names
      const categoryMap: { [key: string]: string } = {
        'jewelry': 'Jewelry',
        'bags': 'Bags',
        'phone-covers': 'Phone Covers',
        'accessories': 'Accessories'
      }
      
      if (categoryMap[categoryParam]) {
        setSelectedCategory(categoryMap[categoryParam])
      }
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
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
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