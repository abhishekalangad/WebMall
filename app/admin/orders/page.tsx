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
import { Package2, Eye, Loader2, X, Download, FileSpreadsheet } from 'lucide-react'

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

// ─── Excel helpers ────────────────────────────────────────────────────────────

async function exportSingleOrderToExcel(order: Order, shippingBaseRate: number) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WebMall Admin'
  wb.created = new Date()

  const ws = wb.addWorksheet('Order Details')

  // ---- Header section ----
  const addSection = (title: string) => {
    const row = ws.addRow([title])
    row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }
    ws.mergeCells(`A${row.number}:F${row.number}`)
    return row
  }

  const addKV = (key: string, value: string | number) => {
    const row = ws.addRow([key, String(value)])
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
  }

  // Order info
  addSection('ORDER INFORMATION')
  addKV('Order Number', order.orderNumber)
  addKV('Status', order.status.toUpperCase())
  addKV('Payment Method', order.paymentMethod.toUpperCase())
  addKV('Date', new Date(order.createdAt).toLocaleString())
  addKV('Currency', order.currency)
  ws.addRow([])

  // Customer info
  addSection('CUSTOMER INFORMATION')
  addKV('Name', order.user?.name || 'N/A')
  addKV('Email', order.user?.email || 'N/A')
  addKV('Phone', order.user?.phone || 'N/A')
  ws.addRow([])

  // Shipping address
  if (order.shippingAddress) {
    addSection('SHIPPING ADDRESS')
    const sa = order.shippingAddress
    addKV('Full Name', `${sa.firstName || ''} ${sa.lastName || ''}`.trim())
    addKV('Address', sa.address || '')
    addKV('City', sa.city || '')
    addKV('District', sa.district || '')
    addKV('Postal Code', sa.postalCode || '')
    addKV('Phone', sa.phone || '')
    addKV('Email', sa.email || '')
    ws.addRow([])
  }

  // Notes
  if (order.notes) {
    addSection('NOTES')
    ws.addRow([order.notes])
    ws.addRow([])
  }

  // Items table
  addSection('ORDER ITEMS')
  const headerRow = ws.addRow(['Product', 'Variant', 'Quantity', 'Unit Price (LKR)', 'Total (LKR)'])
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
  headerRow.alignment = { horizontal: 'center' }

  const subtotal = order.items.reduce((acc, i) => acc + Number(i.total), 0)

  order.items.forEach(item => {
    const row = ws.addRow([
      item.product.name,
      item.variantName || item.variant?.name || '—',
      item.quantity,
      Number(item.price),
      Number(item.total),
    ])
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(4).numFmt = '#,##0.00'
    row.getCell(5).numFmt = '#,##0.00'
  })

  ws.addRow([])

  // Totals
  const discount = Number(order.couponUsage?.discountAmount || 0)
  const shipping = Math.max(0, Number(order.totalAmount) - (subtotal - discount))

  const addTotal = (label: string, value: number, bold = false) => {
    const row = ws.addRow(['', '', '', label, value])
    row.getCell(4).font = { bold }
    row.getCell(5).font = { bold }
    row.getCell(5).numFmt = '#,##0.00'
  }

  addTotal('Subtotal (LKR)', subtotal)
  if (discount > 0) {
    addTotal(`Discount (${order.couponUsage?.coupon.code || 'COUPON'}) (LKR)`, -discount)
  }
  addTotal(shipping === 0 ? 'Shipping (FREE)' : 'Shipping (LKR)', shipping)
  addTotal('TOTAL (LKR)', Number(order.totalAmount), true)

  // Column widths
  ws.columns = [
    { width: 35 },
    { width: 20 },
    { width: 10 },
    { width: 22 },
    { width: 18 },
    { width: 10 },
  ]

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, `Order_${order.orderNumber}.xlsx`)
}

async function exportAllOrdersToExcel(orders: Order[]) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WebMall Admin'
  wb.created = new Date()

  const ws = wb.addWorksheet('All Orders')

  // Header row
  const headerRow = ws.addRow([
    'Order Number', 'Date', 'Status', 'Payment',
    'Customer Name', 'Customer Email', 'Customer Phone',
    'Shipping Name', 'Shipping Address', 'Shipping City', 'Shipping District', 'Shipping Phone',
    'Items (Summary)', 'Subtotal (LKR)', 'Discount (LKR)', 'Shipping (LKR)', 'Total (LKR)',
    'Coupon Code', 'Notes'
  ])
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }
  headerRow.alignment = { horizontal: 'center', wrapText: true }

  orders.forEach(order => {
    const sa = order.shippingAddress || {}
    const subtotal = order.items.reduce((acc, i) => acc + Number(i.total), 0)
    const discount = Number(order.couponUsage?.discountAmount || 0)
    const shipping = Math.max(0, Number(order.totalAmount) - (subtotal - discount))
    const itemsSummary = order.items
      .map(i => `${i.product.name}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`)
      .join('; ')

    const row = ws.addRow([
      order.orderNumber,
      new Date(order.createdAt).toLocaleString(),
      order.status,
      order.paymentMethod,
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.user?.phone || '',
      `${sa.firstName || ''} ${sa.lastName || ''}`.trim(),
      sa.address || '',
      sa.city || '',
      sa.district || '',
      sa.phone || '',
      itemsSummary,
      subtotal,
      discount,
      shipping,
      Number(order.totalAmount),
      order.couponUsage?.coupon.code || '',
      order.notes || '',
    ])

    // Colour by status
    const statusColors: Record<string, string> = {
      pending: 'FFFFF9C4',
      confirmed: 'FFE3F2FD',
      shipped: 'FFF3E5F5',
      delivered: 'FFE8F5E9',
      cancelled: 'FFFFEBEE',
    }
    const bg = statusColors[order.status] || 'FFFFFFFF'
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }

    // Number formats
    ;[14, 15, 16, 17].forEach(c => { row.getCell(c).numFmt = '#,##0.00' })
  })

  // Auto-fit column widths
  ws.columns = [
    { width: 22 }, { width: 20 }, { width: 12 }, { width: 12 },
    { width: 20 }, { width: 28 }, { width: 16 },
    { width: 22 }, { width: 35 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 50 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 14 }, { width: 30 },
  ]

  ws.autoFilter = { from: 'A1', to: 'S1' }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, `WebMall_Orders_${new Date().toISOString().split('T')[0]}.xlsx`)
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { user, loading, accessToken } = useAuth()
  const { settings } = useSiteConfig()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportingSingle, setExportingSingle] = useState(false)
  const LIMIT = 20
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

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

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !loading) {
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
      loadingMoreRef.current = true
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
    } finally {
      loadingMoreRef.current = false
    }
  }

  const loadMoreOrders = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return
    try {
      loadingMoreRef.current = true
      setLoadingMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?page=${page}&limit=${LIMIT}`, { headers })
      const data = await res.json()
      if (res.ok) {
        const incoming: Order[] = data.orders || []
        setOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id))
          const fresh = incoming.filter(o => !existingIds.has(o.id))
          return fresh.length > 0 ? [...prev, ...fresh] : prev
        })
        setHasMore(data.pagination ? data.pagination.hasNextPage : false)
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to load more orders:', error)
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [page, hasMore, accessToken])

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
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev)
        }
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportAll = async () => {
    setExportingAll(true)
    try {
      // Fetch all orders for export (no pagination limit)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?limit=all`, { headers })
      const data = await res.json()
      await exportAllOrdersToExcel(data.orders || orders)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingAll(false)
    }
  }

  const handleExportSingle = async (order: Order) => {
    setExportingSingle(true)
    try {
      await exportSingleOrderToExcel(order, settings?.shippingBaseRate || 350)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingSingle(false)
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

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Search orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Export All Button */}
          <Button
            onClick={handleExportAll}
            disabled={exportingAll || orders.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
          >
            {exportingAll
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <FileSpreadsheet className="h-4 w-4" />}
            Export All
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      title="View order details"
                    >
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

      {/* Mobile Cards */}
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
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedOrder(order)}>
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

      {loadingMore && (
        <div className="flex items-center justify-center py-6 gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
          <span className="text-sm font-medium">Loading more orders…</span>
        </div>
      )}

      {!hasMore && orders.length > 0 && !loading && (
        <p className="text-center text-xs text-gray-400 py-4">
          All {orders.length} orders loaded
        </p>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export single order */}
                <Button
                  size="sm"
                  onClick={() => handleExportSingle(selectedOrder)}
                  disabled={exportingSingle}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {exportingSingle
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5" />}
                  Export Excel
                </Button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="ml-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Top info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Customer</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedOrder.user?.name || 'N/A'}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedOrder.user?.email || 'No email'}</span></div>
                    {selectedOrder.user?.phone && (
                      <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedOrder.user.phone}</span></div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Order Info</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-gray-500">Order #:</span> <span className="font-medium">{selectedOrder.orderNumber}</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Status:</span>
                      <Badge className={getStatusBadgeColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                    </div>
                    <div><span className="text-gray-500">Payment:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Total:</span> <span className="font-bold">{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Shipping Address</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </div>
                    <div>{selectedOrder.shippingAddress.address}</div>
                    <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
                    <div>{selectedOrder.shippingAddress.district}</div>
                    {selectedOrder.shippingAddress.phone && (
                      <div className="text-gray-500">Phone: {selectedOrder.shippingAddress.phone}</div>
                    )}
                    {selectedOrder.shippingAddress.email && (
                      <div className="text-gray-500">Email: {selectedOrder.shippingAddress.email}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-700 text-sm uppercase tracking-wide mb-2">Customer Notes</h3>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Items — Desktop */}
              <div>
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Order Items</h3>
                <div className="hidden md:block rounded-xl overflow-hidden border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
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
                                  <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
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
                                <a href={`/products/${item.product.slug}`} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline">
                                  View Product
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{selectedOrder.currency} {Number(item.price).toLocaleString('en-LK')}</TableCell>
                          <TableCell>{selectedOrder.currency} {Number(item.total).toLocaleString('en-LK')}</TableCell>
                        </TableRow>
                      ))}

                      {/* Totals */}
                      {(() => {
                        const subtotal = selectedOrder.items.reduce((acc, i) => acc + Number(i.total), 0)
                        const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                        const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                        const shippingBaseRate = settings?.shippingBaseRate || 350
                        return (
                          <>
                            <TableRow className="bg-gray-50/60">
                              <TableCell colSpan={3} className="font-medium text-right text-gray-600">Subtotal:</TableCell>
                              <TableCell className="font-medium">{selectedOrder.currency} {subtotal.toLocaleString('en-LK')}</TableCell>
                            </TableRow>
                            {discount > 0 && (
                              <TableRow className="text-green-600 bg-green-50/40">
                                <TableCell colSpan={3} className="font-medium text-right">
                                  Discount ({selectedOrder.couponUsage?.coupon.code}):
                                </TableCell>
                                <TableCell>− {selectedOrder.currency} {discount.toLocaleString('en-LK')}</TableCell>
                              </TableRow>
                            )}
                            <TableRow className="bg-gray-50/60">
                              <TableCell colSpan={3} className="font-medium text-right text-gray-600">Shipping:</TableCell>
                              <TableCell>
                                {shipping === 0
                                  ? <span className="text-green-600 font-medium">FREE <span className="line-through text-gray-400 text-xs font-normal">{selectedOrder.currency} {shippingBaseRate}</span></span>
                                  : `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`}
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-indigo-50">
                              <TableCell colSpan={3} className="font-bold text-right text-base">Final Total:</TableCell>
                              <TableCell className="font-bold text-base text-indigo-700">{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</TableCell>
                            </TableRow>
                          </>
                        )
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Items — Mobile */}
                <div className="md:hidden space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 rounded-md bg-gray-200 overflow-hidden shrink-0">
                          {item.product.images?.[0]?.url && (
                            <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.product.name}
                            {(item.variantName || item.variant?.name) && (
                              <span className="ml-1 text-xs text-gray-500 font-normal">
                                ({item.variantName || item.variant?.name})
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mt-1">
                            <span>{item.quantity} × {selectedOrder.currency} {Number(item.price).toLocaleString('en-LK')}</span>
                            <span className="font-bold text-gray-900">{selectedOrder.currency} {Number(item.total).toLocaleString('en-LK')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mobile totals */}
                  {(() => {
                    const subtotal = selectedOrder.items.reduce((acc, i) => acc + Number(i.total), 0)
                    const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                    const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                    const shippingBaseRate = settings?.shippingBaseRate || 350
                    return (
                      <div className="border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{selectedOrder.currency} {subtotal.toLocaleString('en-LK')}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({selectedOrder.couponUsage?.coupon.code})</span>
                            <span>- {selectedOrder.currency} {discount.toLocaleString('en-LK')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span>
                            {shipping === 0
                              ? <><span className="line-through text-gray-400 mr-1">{selectedOrder.currency} {shippingBaseRate}</span><span className="text-green-600 font-medium">FREE</span></>
                              : `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-2 text-indigo-700">
                          <span>Total</span>
                          <span>{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
