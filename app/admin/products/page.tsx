'use client'

import { useEffect, useState } from 'react'
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
import { ImageUpload } from '@/components/admin/ImageUpload'

export default function AdminProductsPage() {
  const { user, loading: authLoading, accessToken } = useAuth()
  const router = useRouter()

  // State
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    stockCount: '',
    imageUrl: '',
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

  // Fetch Data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit

      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/categories', { headers })
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      // Handle paginated response structure { products: [], pagination: {} }
      const productsList = productsData.products || (Array.isArray(productsData) ? productsData : [])

      setProducts(productsList)
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
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

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category?.name === selectedCategory
    return matchesSearch && matchesCategory
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

      setProducts(prev => prev.filter(p => p.id !== productId))
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
      toast({
        title: 'Success',
        description: 'Product stock updated'
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
      const payload = {
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        stock: parseInt(formData.stockCount),
        status: formData.inStock ? 'active' : 'inactive',
        images: [{ url: formData.imageUrl, alt: formData.name }],
        variants: [], // Simplified for now
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
      stockCount: product.stock.toString(),
      imageUrl: product.images[0]?.url || '',
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
      stockCount: '',
      imageUrl: '',
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
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mb-2 sm:mb-0" />
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock < 5).length}
                </p>
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

        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-11 sm:h-10 text-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 sm:h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Products Table */}
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
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/products/${product.slug}`)}
                            className="h-8 w-8 p-0 sm:w-auto sm:px-2"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 p-0 sm:w-auto sm:px-2"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStock(product)}
                            className="hidden lg:inline-flex h-8"
                            title={product.status === 'active' ? 'Archive' : 'Activate'}
                          >
                            {product.status === 'active' ? 'Archive' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-8 w-8 p-0 sm:w-auto sm:px-2 text-red-600 hover:text-red-800"
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

                <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 pt-4 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1.5 h-10 sm:h-9"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="categoryId" className="text-sm font-medium">Category</Label>
                      <select
                        id="categoryId"
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="mt-1.5 w-full h-10 sm:h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Short Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={3}
                      placeholder="Enter short product description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label htmlFor="price" className="text-sm font-medium">Price (LKR)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-1.5 h-10 sm:h-9"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="stock" className="text-sm font-medium">Stock Count</Label>
                      <div className="relative">
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={formData.stockCount}
                          onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                          className="mt-1.5 h-10 sm:h-9"
                          placeholder="0"
                          required
                        />
                        {formData.stockCount && parseInt(formData.stockCount) < 10 && parseInt(formData.stockCount) > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Low stock warning
                          </div>
                        )}
                        {formData.stockCount && parseInt(formData.stockCount) === 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-medium">
                            Out of Stock
                          </div>
                        )}
                        {formData.stockCount && parseInt(formData.stockCount) >= 10 && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                            In Stock
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <ImageUpload
                      onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
                      currentImageUrl={formData.imageUrl}
                      bucket="products"
                    />
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
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t sticky bottom-0 bg-white pb-4 sm:pb-0">
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
      </div>
    </div>
  )
}