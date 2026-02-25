'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Package2, Eye, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    images: { url: string }[]
  }
  variant?: {
    name: string
    image?: string
  }
  variantName?: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  user?: {
    id: string
    name?: string
    email: string
    phone?: string
  }
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  paymentMethod: string
  shippingAddress: any
  notes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  couponUsage?: {
    discountAmount: number
    coupon: {
      code: string
      discountType: string
      discountValue: number
    }
  }
}

export default function AdminOrdersPage() {
  const { user, loading, accessToken } = useAuth()
  const { settings } = useSiteConfig()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const LIMIT = 20
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      (order.user?.name || '').toLowerCase().includes(q) ||
      (order.user?.email || '').toLowerCase().includes(q) ||
      (order.user?.phone || '').includes(q) ||
      (order.shippingAddress?.phone || '').includes(q) ||
      (order.status || '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/')
      } else {
        fetchOrders()
      }
    }
  }, [user, loading, router])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreOrders()
        }
      },
      { threshold: 0, rootMargin: '600px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading])

  const fetchOrders = async () => {
    try {
      setPage(1)
      setHasMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const response = await fetch(`/api/orders?page=1&limit=${LIMIT}`, { headers })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.orders || [])
        setHasMore(data.pagination ? data.pagination.hasNextPage : false)
        setPage(2)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const loadMoreOrders = useCallback(async () => {
    if (loadingMore || !hasMore) return
    try {
      setLoadingMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?page=${page}&limit=${LIMIT}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setOrders(prev => [...prev, ...(data.orders || [])])
        setHasMore(data.pagination ? data.pagination.hasNextPage : false)
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to load more orders:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, accessToken])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const token = await accessToken()
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDetailOpen(true)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return <div className="max-w-7xl mx-auto p-6">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package2 className="h-8 w-8" />
          Manage Orders
        </h1>

        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            placeholder="Search orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.user?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.user?.email || 'No email'}</div>
                    {order.user?.phone && (
                      <div className="text-sm text-gray-500">{order.user?.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.currency} {order.totalAmount}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openOrderDetail(order)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{order.orderNumber}</div>
                <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <Badge className={getStatusBadgeColor(order.status)}>
                {order.status}
              </Badge>
            </div>

            <div className="text-sm">
              <div className="font-medium mb-1">Customer</div>
              <div>{order.user?.name || 'N/A'}</div>
              <div className="text-gray-500">{order.user?.email || 'No email'}</div>
            </div>

            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span>{order.currency} {order.totalAmount}</span>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openOrderDetail(order)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <div className="flex-1">
                <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-2" />

      {/* Loading More Spinner */}
      {loadingMore && (
        <div className="flex items-center justify-center py-6 gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
          <span className="text-sm font-medium">Loading more orders…</span>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && orders.length > 0 && !loading && (
        <p className="text-center text-xs text-gray-400 py-4">
          All {orders.length} orders loaded
        </p>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Card className="p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Order Details</h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedOrder.user?.email || 'No email'}</div>
                {selectedOrder.user?.phone && (
                  <div><strong>Phone:</strong> {selectedOrder.user?.phone}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Order Number:</strong> {selectedOrder.orderNumber}</div>
                <div><strong>Status:</strong>
                  <Badge className={`ml-2 ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div><strong>Payment:</strong> {selectedOrder.paymentMethod}</div>
                <div><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                <div><strong>Total:</strong> {selectedOrder.currency} {selectedOrder.totalAmount}</div>
              </div>
            </div>
          </div>

          {selectedOrder.shippingAddress && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                </div>
                <div>{selectedOrder.shippingAddress.address}</div>
                <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
                <div>{selectedOrder.shippingAddress.district}</div>
                {selectedOrder.shippingAddress.phone && (
                  <div className="text-gray-500 mt-1">Phone: {selectedOrder.shippingAddress.phone}</div>
                )}
                {selectedOrder.shippingAddress.email && (
                  <div className="text-gray-500">Email: {selectedOrder.shippingAddress.email}</div>
                )}
              </div>
            </div>
          )}

          {selectedOrder.notes && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="text-sm">{selectedOrder.notes}</div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Items</h3>
            {/* Desktop Items Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden shrink-0">
                            {item.product.images?.[0]?.url && (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {item.product.name}
                              {(item.variantName || item.variant?.name) && (
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  ({item.variantName || item.variant?.name})
                                </span>
                              )}
                            </div>
                            <a
                              href={`/products/${item.product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              View Product
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{selectedOrder.currency} {item.price}</TableCell>
                      <TableCell>{selectedOrder.currency} {item.total}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium text-right">Subtotal:</TableCell>
                    <TableCell>{selectedOrder.currency} {selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0).toLocaleString('en-LK')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium text-right">Processing & Delivery:</TableCell>
                    <TableCell>
                      {(() => {
                        const subtotal = selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0)
                        const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                        const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                        const shippingBaseRate = settings?.shippingBaseRate || 350

                        if (shipping === 0) {
                          return (
                            <div className="flex justify-end gap-2 items-center">
                              <span className="line-through text-gray-400 text-xs">
                                {selectedOrder.currency} {shippingBaseRate.toLocaleString('en-LK')}
                              </span>
                              <span className="text-green-600 font-medium">FREE</span>
                            </div>
                          )
                        }
                        return `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`
                      })()}
                    </TableCell>
                  </TableRow>
                  {selectedOrder.couponUsage && (
                    <TableRow className="text-green-600">
                      <TableCell colSpan={3} className="font-medium text-right">
                        Discount ({selectedOrder.couponUsage.coupon.code}):
                      </TableCell>
                      <TableCell>- {selectedOrder.currency} {Number(selectedOrder.couponUsage.discountAmount).toLocaleString('en-LK')}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold text-right text-base">Final Price:</TableCell>
                    <TableCell className="font-bold text-base">{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Mobile Items List */}
            <div className="md:hidden space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded-md bg-gray-200 overflow-hidden shrink-0">
                      {item.product.images?.[0]?.url && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.product.name}
                        {(item.variantName || item.variant?.name) && (
                          <span className="ml-1 text-xs text-gray-500 font-normal">
                            ({item.variantName || item.variant?.name})
                          </span>
                        )}
                      </div>
                      <a
                        href={`/products/${item.product.slug}`}
                        className="text-xs text-blue-600 mb-2 block"
                      >
                        View Product
                      </a>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{item.quantity} x {selectedOrder.currency} {item.price}</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{selectedOrder.currency} {item.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="space-y-2 border-t pt-3 mt-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>MRP</span>
                  <span>{selectedOrder.currency} {selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0).toLocaleString('en-LK')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing & Delivery</span>
                  <span className="flex gap-2">
                    {(() => {
                      const subtotal = selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0)
                      const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                      const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                      const shippingBaseRate = settings?.shippingBaseRate || 350

                      if (shipping === 0) {
                        return (
                          <>
                            <span className="line-through text-gray-400">
                              {selectedOrder.currency} {shippingBaseRate.toLocaleString('en-LK')}
                            </span>
                            <span className="text-green-600 font-medium">FREE</span>
                          </>
                        )
                      }
                      return `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`
                    })()}
                  </span>
                </div>
                {selectedOrder.couponUsage && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({selectedOrder.couponUsage.coupon.code}):</span>
                    <span>- {selectedOrder.currency} {Number(selectedOrder.couponUsage.discountAmount).toLocaleString('en-LK')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Final Price</span>
                  <span>{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
