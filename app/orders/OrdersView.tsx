'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Search, Filter, Eye, Calendar, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

// Types for API data
interface OrderItem {
    id: string
    product: {
        id: string
        name: string
        slug?: string
        price?: number
        images?: Array<{ url: string }>
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

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
}

export function OrdersView() {
    const { user, loading: authLoading, accessToken } = useAuth()
    const { settings } = useSiteConfig()
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoadingOrders, setIsLoadingOrders] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    // Fetch orders from API
    useEffect(() => {
        if (user && !authLoading) {
            fetchOrders()
        } else if (!authLoading) {
            setIsLoadingOrders(false)
        }
    }, [user, authLoading])

    const fetchOrders = async () => {
        try {
            setIsLoadingOrders(true)
            const token = await accessToken()
            if (!token) {
                console.error('No access token available')
                setIsLoadingOrders(false)
                return
            }

            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setOrders(data.orders || [])
                setFilteredOrders(data.orders || [])
            } else {
                console.error('Failed to fetch orders:', response.statusText)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setIsLoadingOrders(false)
        }
    }

    // Filter orders based on search and status
    useEffect(() => {
        let filtered = orders

        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.items.some(item =>
                    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        setFilteredOrders(filtered)
    }, [searchQuery, statusFilter, orders])

    if (authLoading || isLoadingOrders) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading orders...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center bg-card border-border shadow-lg shadow-black/5 dark:shadow-white/5">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-3xl font-playfair font-bold text-foreground mb-4">
                        Please Sign In
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        You need to be signed in to view your orders.
                    </p>
                    <Link href="/login">
                        <Button className="w-full bg-foreground text-background font-semibold hover:bg-muted-foreground">
                            Sign In
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-playfair font-bold text-foreground">
                        My Orders
                    </h1>
                </div>

                {/* Filters */}
                <Card className="p-6 mb-8 bg-card border-border shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border-border bg-background focus:ring-primary w-full"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-48 bg-background border-border">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="all">All Orders</SelectItem>
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

                {/* Orders List */}
                <div className="space-y-6">
                    {filteredOrders.length === 0 ? (
                        <Card className="p-12 text-center bg-card border-border shadow-sm">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No orders found</h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'You haven\'t placed any orders yet'
                                }
                            </p>
                            <Link href="/products">
                                <Button className="bg-foreground text-background font-semibold hover:bg-muted-foreground transition-colors px-8">
                                    Start Shopping
                                </Button>
                            </Link>
                        </Card>
                    ) : (
                        filteredOrders.map((order) => (
                            <Card key={order.id} className="p-6 bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-4 mb-4">
                                            <h3 className="text-lg font-semibold text-foreground truncate">
                                                Order #{order.orderNumber}
                                            </h3>
                                            <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                                                {statusLabels[order.status as keyof typeof statusLabels]}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Ordered on {new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-foreground">
                                                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="font-medium truncate">Total: {order.currency} {order.totalAmount.toLocaleString('en-LK')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span className="truncate text-wrap line-clamp-2">
                                                {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4 lg:mb-0">
                                            <p className="text-sm font-medium text-foreground">Items:</p>
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between text-sm text-muted-foreground gap-4">
                                                    <span className="truncate">{item.product.name} <span className="text-foreground">x {item.quantity}</span></span>
                                                    <span className="shrink-0">{order.currency} {item.total.toLocaleString('en-LK')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border lg:border-t-0 lg:pt-0 shrink-0">
                                        <Button
                                            variant="outline"
                                            className="flex items-center gap-2 justify-center border-border hover:bg-muted"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Details
                                        </Button>
                                        {order.status === 'delivered' && (
                                            <Button variant="outline" className="flex items-center gap-2 justify-center border-border hover:bg-muted">
                                                <Package className="h-4 w-4" />
                                                Reorder
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Order Detail Modal Overlay */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card border border-border rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold font-playfair mb-1 text-foreground">Order Details</h2>
                                        <p className="text-muted-foreground text-sm">#{selectedOrder.orderNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Order Status & Info */}
                                    <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Date Placed</div>
                                            <div className="font-medium text-foreground">
                                                {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Status</div>
                                            <Badge className={statusColors[selectedOrder.status as keyof typeof statusColors]}>
                                                {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm text-muted-foreground">Payment Method</div>
                                            <div className="font-medium capitalize text-foreground">{selectedOrder.paymentMethod}</div>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div>
                                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                                            <MapPin className="h-4 w-4" />
                                            Shipping Information
                                        </h3>
                                        <div className="border border-border bg-card rounded-xl p-4 text-sm space-y-1.5 shadow-sm">
                                            <div className="font-bold text-foreground">
                                                {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                                            </div>
                                            <div className="text-muted-foreground">{selectedOrder.shippingAddress.address}</div>
                                            <div className="text-muted-foreground">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
                                            <div className="text-muted-foreground">{selectedOrder.shippingAddress.district}</div>
                                            {selectedOrder.shippingAddress.phone && (
                                                <div className="text-muted-foreground mt-2 pt-2 border-t border-border flex items-center gap-2">
                                                    <span className="font-medium text-foreground">Phone:</span> {selectedOrder.shippingAddress.phone}
                                                </div>
                                            )}
                                            {selectedOrder.shippingAddress.email && (
                                                <div className="text-muted-foreground flex items-center gap-2">
                                                    <span className="font-medium text-foreground">Email:</span> {selectedOrder.shippingAddress.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div>
                                        <h3 className="font-semibold mb-4 text-foreground border-b border-border pb-2">Items Ordered</h3>
                                        <div className="space-y-4">
                                            {selectedOrder.items.map((item) => (
                                                <div key={item.id} className="flex gap-4 items-start py-3 px-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="h-20 w-20 bg-muted/50 rounded-lg overflow-hidden shrink-0 border border-border">
                                                        {item.product.images?.[0]?.url ? (
                                                            <img
                                                                src={item.product.images[0].url}
                                                                alt={item.product.name}
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder.png'; // Fallback
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground/50">
                                                                <Package className="h-8 w-8" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="font-medium text-foreground truncate text-base">
                                                                {item.product.name}
                                                                {(item.variantName || item.variant?.name) && (
                                                                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                                                                        ({item.variantName || item.variant?.name})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.product.slug && (
                                                                <Link
                                                                    href={`/products/${item.product.slug}`}
                                                                    className="text-xs text-primary hover:text-primary/80 hover:underline mt-1 inline-flex items-center gap-1 font-semibold"
                                                                    target="_blank"
                                                                >
                                                                    View Product <ArrowLeft className="h-3 w-3 rotate-180" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <span className="font-semibold text-foreground">{item.quantity}</span><span className="text-xs">✕</span>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-medium">{selectedOrder.currency} {Number(item.price).toLocaleString('en-LK')}</span>
                                                                    {item.product.price && Number(item.price) < Number(item.product.price) && (
                                                                        <span className="text-xs text-muted-foreground/60 line-through">
                                                                            {selectedOrder.currency} {Number(item.product.price).toLocaleString('en-LK')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {item.product.price && Number(item.price) < Number(item.product.price) && (
                                                                <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                    Save {selectedOrder.currency} {(Number(item.product.price) - Number(item.price)).toLocaleString('en-LK')}
                                                                </span>
                                                            )}
                                                            <div className="font-bold text-foreground mt-1 text-base">
                                                                {selectedOrder.currency} {Number(item.total).toLocaleString('en-LK')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-muted/30 rounded-xl p-6 space-y-3 text-sm border border-border shadow-sm">
                                        <h3 className="font-bold mb-4 text-foreground uppercase tracking-wider text-xs">Payment Summary</h3>

                                        <div className="flex justify-between text-muted-foreground font-medium">
                                            <span>Subtotal</span>
                                            <span className="text-foreground">
                                                {selectedOrder.currency} {selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0).toLocaleString('en-LK')}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-muted-foreground font-medium">
                                            <span>Processing & Delivery Charges</span>
                                            <span className="flex gap-2">
                                                {(() => {
                                                    const subtotal = selectedOrder.items.reduce((acc, item) => acc + Number(item.total), 0)
                                                    const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                                                    const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                                                    const shippingBaseRate = settings?.shippingBaseRate || 350

                                                    if (shipping === 0) {
                                                        return (
                                                            <>
                                                                <span className="line-through text-muted-foreground/60">
                                                                    {selectedOrder.currency} {shippingBaseRate.toLocaleString('en-LK')}
                                                                </span>
                                                                <span className="text-emerald-500 font-bold tracking-wider uppercase">FREE</span>
                                                            </>
                                                        )
                                                    }
                                                    return <span className="text-foreground">{selectedOrder.currency} {shipping.toLocaleString('en-LK')}</span>
                                                })()}
                                            </span>
                                        </div>

                                        {selectedOrder.couponUsage && (
                                            <div className="flex justify-between text-emerald-500 font-medium">
                                                <span>Discount Applied <span className="px-1.5 py-0.5 bg-emerald-500/10 rounded-md text-[10px] ml-1 border border-emerald-500/20">{selectedOrder.couponUsage.coupon.code}</span></span>
                                                <span className="font-bold">- {selectedOrder.currency} {Number(selectedOrder.couponUsage.discountAmount).toLocaleString('en-LK')}</span>
                                            </div>
                                        )}

                                        <div className="border-t border-border pt-4 mt-4 flex justify-between items-center bg-card -mx-6 -mb-6 p-6 rounded-b-xl border-x-0 border-b-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                                            <span className="font-black text-lg text-foreground uppercase tracking-wide">Final Price</span>
                                            <span className="font-black text-2xl text-foreground bg-foreground/5 py-1 px-3 rounded-lg border border-border">
                                                {selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <Button onClick={() => setSelectedOrder(null)} variant="outline" className="rounded-xl border-border px-8 shadow-sm">Close</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
