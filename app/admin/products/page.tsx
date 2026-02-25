'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Eye,
  Package,
  X,
  Save,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/hooks/use-toast'
import { MultiImageUpload } from '@/components/admin/MultiImageUpload'
import { ProductVariants, ProductVariant } from '@/components/admin/ProductVariants'
import { ImageUpload } from '@/components/admin/ImageUpload'

export default function AdminProductsPage() {
  const { user, loading: authLoading, accessToken } = useAuth()
  const router = useRouter()

  // State
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const LIMIT = 20
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'lowstock'>('all')

  // New Category inline creation
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '', description: '', image: '',
    pendingSubcategories: [] as { name: string; description: string; image: string }[]
  })
  const [savingCategory, setSavingCategory] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    subcategoryId: '',
    stockCount: '',
    images: [] as { url: string; alt?: string; position: number }[],
    variants: [] as ProductVariant[],
    inStock: true,
    longDescription: '',
    features: '',
    specifications: '',
    shipping: {
      free: true,
      estimatedDays: '2-3 business days',
      returnPolicy: '30 days'
    }
  })

  // Auth Check
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/login?redirect=/admin/products')
      }
    }
  }, [user, authLoading, router])

  // Fetch Data — initial load
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchInitial()
    }
  }, [user])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0, rootMargin: '600px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading])

  const fetchInitial = async () => {
    try {
      setLoading(true)
      setPage(1)
      setHasMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit

      const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
        fetch(`/api/products?page=1&limit=${LIMIT}`, { headers, cache: 'no-store' }),
        fetch('/api/categories', { headers, cache: 'no-store' }),
        fetch('/api/subcategories', { headers, cache: 'no-store' })
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      const subcategoriesData = await subcategoriesRes.json()

      const productsList = productsData.products || (Array.isArray(productsData) ? productsData : [])
      const pagination = productsData.pagination

      setProducts(productsList)
      setHasMore(pagination ? pagination.hasNextPage : false)
      setTotalCount(pagination?.totalCount ?? productsList.length)
      setActiveCount(pagination?.activeCount ?? 0)
      setLowStockCount(pagination?.lowStockCount ?? 0)
      setPage(2)
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setSubcategories(Array.isArray(subcategoriesData) ? subcategoriesData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/products?page=${page}&limit=${LIMIT}`, { headers, cache: 'no-store' })
      const data = await res.json()
      const newProducts = data.products || []
      const pagination = data.pagination
      setProducts(prev => [...prev, ...newProducts])
      setHasMore(pagination ? pagination.hasNextPage : false)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading more products:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, accessToken])

  // fetchData is kept so post-submit refresh still works — it re-initialises from page 1
  const fetchData = fetchInitial

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category?.name === selectedCategory
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? product.status === 'active' :
      statusFilter === 'inactive' ? product.status !== 'active' :
      statusFilter === 'lowstock' ? product.stock < 5 : true
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handlers
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const token = await accessToken()
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!res.ok) throw new Error('Failed to delete')

      const deleted = products.find(p => p.id === productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      setTotalCount(prev => Math.max(0, prev - 1))
      if (deleted?.status === 'active') setActiveCount(prev => Math.max(0, prev - 1))
      if (deleted?.stock < 5) setLowStockCount(prev => Math.max(0, prev - 1))
      toast({
        title: 'Success',
        description: 'Product deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStock = async (product: any) => {
    try {
      const token = await accessToken()
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify({
          ...product,
          // Preserve existing stock, only toggle status
          categoryId: product.categoryId,
          status: product.status === 'active' ? 'inactive' : 'active',
          stock: product.stock // Keep original stock count
        })
      })

      if (!res.ok) throw new Error('Failed to update')

      const updatedProduct = await res.json()
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      // Adjust activeCount based on the toggle direction
      if (product.status === 'active') {
        setActiveCount(prev => Math.max(0, prev - 1))
      } else {
        setActiveCount(prev => prev + 1)
      }
      toast({
        title: 'Success',
        description: 'Product status updated'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate at least one image
      if (formData.images.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one product image',
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || null,
        stock: parseInt(formData.stockCount),
        status: formData.inStock ? 'active' : 'inactive',
        images: formData.images,
        variants: formData.variants.map(v => ({
          sku: v.sku,
          name: v.name,
          attributes: v.attributes,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          stock: v.stock,
          image: v.image,
          images: v.images
        })),
        currency: 'LKR'
      }

      const token = await accessToken()
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save')
      }

      await fetchData() // Refresh all data
      handleCloseForm()
      toast({
        title: 'Success',
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: '',
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || '',
      stockCount: product.stock.toString(),
      images: product.images && product.images.length > 0
        ? product.images.map((img: any, index: number) => ({
          url: img.url,
          alt: img.alt || '',
          position: img.position ?? index
        }))
        : [],
      variants: product.variants && product.variants.length > 0
        ? product.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          attributes: v.attributes || {},
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          stock: v.stock,
          image: v.image,
          images: v.images || []
        }))
        : [],
      inStock: product.status === 'active',
      longDescription: '',
      features: '',
      specifications: '',
      shipping: {
        free: true,
        estimatedDays: '2-3 business days',
        returnPolicy: '30 days'
      }
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      categoryId: categories[0]?.id || '',
      subcategoryId: '',
      stockCount: '',
      images: [],
      variants: [],
      inStock: true,
      longDescription: '',
      features: '',
      specifications: '',
      shipping: {
        free: true,
        estimatedDays: '2-3 business days',
        returnPolicy: '30 days'
      }
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center h-9 px-3 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5">Manage your product catalog</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setFormData(prev => ({ ...prev, categoryId: categories[0]?.id || '' }))
              setShowAddForm(true)
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold h-11 sm:h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card
            className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-blue-200 ${statusFilter === 'all' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCount || products.length}</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-green-200 ${statusFilter === 'active' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => setStatusFilter(prev => prev === 'active' ? 'all' : 'active')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-red-200 ${statusFilter === 'lowstock' ? 'ring-2 ring-red-400' : ''}`}
            onClick={() => setStatusFilter(prev => prev === 'lowstock' ? 'all' : 'lowstock')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Categories</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Card className="flex-1 p-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 text-sm border-0 focus-visible:ring-0 bg-gray-50"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 h-10 px-3 py-2 text-sm border-0 bg-gray-50 rounded-md focus:outline-none focus:ring-0"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md overflow-hidden bg-gray-50">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List View"
                >
                  <div className="h-5 w-5 flex flex-col justify-center gap-1">
                    <div className="h-0.5 bg-current w-full" />
                    <div className="h-0.5 bg-current w-full" />
                    <div className="h-0.5 bg-current w-full" />
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid View"
                >
                  <div className="h-5 w-5 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                  </div>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Display */}
        {viewMode === 'list' ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Category
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Stock
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                              {product.images?.[0]?.url ? (
                                <Image
                                  src={product.images[0].url}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                              )}
                            </div>
                            <div className="ml-2 sm:ml-4 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-xs">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">{product.category?.name || 'Uncategorized'}</Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <div className="font-medium">{product.currency} {product.price.toLocaleString()}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{product.stock}</span>
                            {product.stock === 0 ? (
                              <Badge className="bg-red-100 text-red-800 text-xs">Out of Stock</Badge>
                            ) : product.stock < 10 ? (
                              <Badge className="bg-amber-100 text-amber-800 text-xs">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 text-xs">In Stock</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                          <Badge
                            className={product.status === 'active' ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}
                          >
                            {product.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/products/${product.slug}`)}
                              className="h-8 w-8 p-0 sm:w-auto sm:px-2 flex-shrink-0"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0 sm:w-auto sm:px-2 flex-shrink-0"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStock(product)}
                              className="hidden lg:inline-flex h-8 flex-shrink-0"
                              title={product.status === 'active' ? 'Archive' : 'Activate'}
                            >
                              {product.status === 'active' ? 'Archive' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="h-8 w-8 p-0 sm:w-auto sm:px-2 text-red-600 hover:text-red-800 flex-shrink-0"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  {/* Status Badge Over Image */}
                  <div className="absolute top-2 right-2">
                    <Badge className={product.status === 'active' ? 'bg-white/90 text-green-700 hover:bg-white' : 'bg-white/90 text-red-700 hover:bg-white'}>
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {/* Stock Badge */}
                  {product.stock < 10 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className={product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} Left`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <p className="font-bold text-gray-900 whitespace-nowrap ml-2">
                      {product.currency} {product.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {product.stock} Stock
                    </div>
                    {product.variants?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        {product.variants.length} Variants
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/products/${product.slug}`)}
                      className="w-full"
                      title="View Page"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="w-full"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStock(product)}
                      className="w-full"
                      title={product.status === 'active' ? 'Archive' : 'Activate'}
                    >
                      {product.status === 'active' ? (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-full hover:bg-red-50 hover:border-red-200"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredProducts.length === 0 && !loading && (
          <Card className="p-12 text-center mt-6">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or add a new product
            </p>
          </Card>
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="py-2" />

        {/* Loading More Spinner */}
        {loadingMore && (
          <div className="flex items-center justify-center py-6 gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
            <span className="text-sm font-medium">Loading more products…</span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && products.length > 0 && !loading && (
          <p className="text-center text-xs text-gray-400 py-4">
            All {products.length} products loaded
          </p>
        )}

        {/* Add/Edit Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
            <div className="w-full min-h-screen sm:min-h-0 sm:my-8 flex items-start sm:items-center justify-center p-0 sm:p-4">
              <Card className="w-full max-w-2xl sm:max-h-[90vh] overflow-y-auto sm:rounded-lg rounded-none">
                <div className="p-4 sm:p-6 sticky top-0 bg-white z-10 border-b sm:border-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseForm}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 pt-4 space-y-6">
                  {/* Section 1: Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Package className="h-5 w-5 text-pink-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1.5 h-10"
                          placeholder="e.g., Cotton T-Shirt"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Keep it clear and descriptive</p>
                      </div>

                      <div>
                        <Label htmlFor="categoryId" className="text-sm font-medium">Category *</Label>
                        <select
                          id="categoryId"
                          value={formData.categoryId || ''}
                          onChange={(e) => {
                            if (e.target.value === '__new__') {
                              setNewCategoryForm({ name: '', description: '', image: '', pendingSubcategories: [] })
                              setShowNewCategoryModal(true)
                              return
                            }
                            setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })
                          }}
                          className="mt-1.5 w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                          required
                        >
                          <option value="" disabled>Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                          <option value="__new__">＋ New Category…</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subcategoryId" className="text-sm font-medium">
                          Subcategory <span className="text-gray-400">(Optional)</span>
                          {formData.categoryId && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({subcategories.filter(sub => sub.categoryId === formData.categoryId).length} available)
                            </span>
                          )}
                        </Label>
                        <select
                          id="subcategoryId"
                          value={formData.subcategoryId || ''}
                          onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                          className="mt-1.5 w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                          disabled={!formData.categoryId}
                        >
                          <option value="">No subcategory</option>
                          {subcategories
                            .filter(sub => sub.categoryId === formData.categoryId)
                            .map((subcategory) => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </option>
                            ))}
                        </select>
                        {!formData.categoryId && (
                          <p className="text-xs text-gray-500 mt-1">Select a category first</p>
                        )}
                        {formData.categoryId && subcategories.filter(sub => sub.categoryId === formData.categoryId).length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ No subcategories available for this category
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">Short Description *</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={3}
                        maxLength={200}
                        placeholder="Brief description that appears in product listings"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 characters</p>
                    </div>
                  </div>

                  {/* Section 2: Product Images */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center gap-2 pb-2">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Upload high-quality images. The first image will be the main product image.</p>

                    <MultiImageUpload
                      images={formData.images}
                      onChange={(images) => setFormData({ ...formData, images })}
                    />

                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p>✓ Supports JPG, PNG, WebP formats</p>
                        <p>✓ Maximum 5MB per image</p>
                        <p>✓ Upload up to 8 images per product</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Pricing & Inventory */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center gap-2 pb-2">
                      <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-sm font-medium">Price (LKR) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="mt-1.5 h-10"
                          placeholder="0.00"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Base price for this product</p>
                      </div>

                      <div>
                        <Label htmlFor="stock" className="text-sm font-medium">Stock Count *</Label>
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={formData.stockCount}
                          onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                          className="mt-1.5 h-10"
                          placeholder="0"
                          required
                        />
                        {formData.stockCount && parseInt(formData.stockCount) === 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 px-2 py-1.5 rounded">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Out of Stock
                          </div>
                        )}
                        {formData.stockCount && parseInt(formData.stockCount) > 0 && parseInt(formData.stockCount) < 10 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Low Stock ({formData.stockCount} units)
                          </div>
                        )}
                        {formData.stockCount && parseInt(formData.stockCount) >= 10 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1.5 rounded">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            In Stock ({formData.stockCount} units)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                      <input
                        type="checkbox"
                        id="inStock"
                        checked={formData.inStock}
                        onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <Label htmlFor="inStock" className="text-sm font-medium cursor-pointer">Mark as Active</Label>
                      <p className="text-xs text-gray-500">(Product will be visible to customers)</p>
                    </div>
                  </div>

                  {/* Section 4: Product Variants */}
                  <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Create variants for different colors, sizes, or styles. Each variant can have its own price and stock.</p>

                    <ProductVariants
                      variants={formData.variants}
                      onChange={(variants) => setFormData({ ...formData, variants })}
                      basePrice={parseFloat(formData.price) || 0}
                      currency="LKR"
                      existingImages={formData.images}
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white pb-4 sm:pb-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseForm}
                      disabled={submitting}
                      className="w-full sm:w-auto h-11 sm:h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto h-11 sm:h-10 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* ── New Category Modal ── sits above the product modal (z-60) */}
        {showNewCategoryModal && (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[60] overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Create New Category</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Available immediately after saving</p>
                </div>
                <button
                  onClick={() => setShowNewCategoryModal(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* ── Category Details ── */}
                <div className="space-y-1 pb-1">
                  <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider">Category Details</p>
                </div>

                  <div>
                  <Label className="text-sm font-medium">Category Name *</Label>
                  <Input
                    autoFocus
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sunglasses"
                    className="mt-1.5 h-10"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">Description <span className="text-gray-400">(Optional)</span></Label>
                  <textarea
                    value={newCategoryForm.description}
                    onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this category"
                    rows={2}
                    className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>

                {/* Image */}
                <div>
                  <Label className="text-sm font-medium">Category Image <span className="text-gray-400">(Optional)</span></Label>
                  <div className="mt-1.5">
                    <ImageUpload
                      onUploadComplete={(url) => setNewCategoryForm(prev => ({ ...prev, image: url }))}
                      currentImageUrl={newCategoryForm.image}
                      bucket="categories"
                    />
                  </div>
                </div>

                {/* ── Subcategories ── */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-pink-500 uppercase tracking-wider">Subcategories <span className="text-gray-400 font-normal normal-case">(Optional)</span></p>
                    <button
                      type="button"
                      onClick={() => setNewCategoryForm(prev => ({
                        ...prev,
                        pendingSubcategories: [...prev.pendingSubcategories, { name: '', description: '', image: '' }]
                      }))}
                      className="flex items-center gap-1.5 text-xs font-medium text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Subcategory
                    </button>
                  </div>

                  {newCategoryForm.pendingSubcategories.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">No subcategories yet. Click "Add Subcategory" to create one.</p>
                  )}

                  {newCategoryForm.pendingSubcategories.map((sub, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 mb-3 space-y-3 bg-gray-50/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Subcategory #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setNewCategoryForm(prev => ({
                            ...prev,
                            pendingSubcategories: prev.pendingSubcategories.filter((_, i) => i !== idx)
                          }))}
                          className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Name *</Label>
                        <Input
                          value={sub.name}
                          onChange={(e) => {
                            const name = e.target.value
                            setNewCategoryForm(prev => ({
                              ...prev,
                              pendingSubcategories: prev.pendingSubcategories.map((s, i) => i === idx ? { ...s, name } : s)
                            }))
                          }}
                          placeholder="e.g., Aviator"
                          className="mt-1 h-9 text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Description <span className="text-gray-400">(Optional)</span></Label>
                        <textarea
                          value={sub.description}
                          onChange={(e) => setNewCategoryForm(prev => ({
                            ...prev,
                            pendingSubcategories: prev.pendingSubcategories.map((s, i) => i === idx ? { ...s, description: e.target.value } : s)
                          }))}
                          rows={2}
                          placeholder="Brief description"
                          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Image <span className="text-gray-400">(Optional)</span></Label>
                        <div className="mt-1">
                          <ImageUpload
                            onUploadComplete={(url) => setNewCategoryForm(prev => ({
                              ...prev,
                              pendingSubcategories: prev.pendingSubcategories.map((s, i) => i === idx ? { ...s, image: url } : s)
                            }))}
                            currentImageUrl={sub.image}
                            bucket="subcategories"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 p-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => setShowNewCategoryModal(false)}
                  disabled={savingCategory}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={savingCategory || !newCategoryForm.name.trim()}
                  className="flex-1 h-10 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
                  onClick={async () => {
                    if (!newCategoryForm.name.trim()) return
                    setSavingCategory(true)
                    try {
                      const token = await accessToken()
                      const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      } as HeadersInit

                      // 1. Create category
                      const catRes = await fetch('/api/categories', {
                        method: 'POST', headers,
                        body: JSON.stringify({
                          name: newCategoryForm.name.trim(),
                          slug: newCategoryForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                          description: newCategoryForm.description.trim() || null,
                          image: newCategoryForm.image || null
                        })
                      })
                      if (!catRes.ok) {
                        const err = await catRes.json()
                        throw new Error(err.error || 'Failed to create category')
                      }
                      const created = await catRes.json()

                      // 2. Create pending subcategories
                      const validSubs = newCategoryForm.pendingSubcategories.filter(s => s.name.trim())
                      const createdSubs: any[] = []
                      for (const sub of validSubs) {
                        try {
                          const subRes = await fetch('/api/subcategories', {
                            method: 'POST', headers,
                            body: JSON.stringify({
                              name: sub.name.trim(),
                              description: sub.description.trim() || null,
                              image: sub.image || null,
                              categoryId: created.id
                            })
                          })
                          if (subRes.ok) createdSubs.push(await subRes.json())
                        } catch { /* skip individual sub failures silently */ }
                      }

                      // 3. Update local state
                      setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
                      if (createdSubs.length > 0) {
                        setSubcategories(prev => [...prev, ...createdSubs])
                      }
                      setFormData(prev => ({ ...prev, categoryId: created.id, subcategoryId: '' }))
                      setShowNewCategoryModal(false)
                      setNewCategoryForm({ name: '', description: '', image: '', pendingSubcategories: [] })
                      toast({
                        title: 'Category created',
                        description: `"${created.name}" created${createdSubs.length > 0 ? ` with ${createdSubs.length} subcategor${createdSubs.length === 1 ? 'y' : 'ies'}` : ''} and selected`
                      })
                    } catch (err: any) {
                      toast({ title: 'Error', description: err.message, variant: 'destructive' })
                    } finally {
                      setSavingCategory(false)
                    }
                  }}
                >
                  {savingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create & Select
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}