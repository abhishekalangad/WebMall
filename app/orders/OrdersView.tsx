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

// Types for API data
interface OrderItem {
    id: string
    product: {
        id: string
        name: string
        slug?: string
        images?: Array<{ url: string }>
    }
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
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoadingOrders, setIsLoadingOrders] = useState(true)

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
                        Please Sign In
                    </h1>
                    <p className="text-gray-600 mb-8">
                        You need to be signed in to view your orders.
                    </p>
                    <Link href="/login">
                        <Button className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold">
                            Sign In
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-playfair font-bold text-gray-900">
                        My Orders
                    </h1>
                </div>

                {/* Filters */}
                <Card className="p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="search"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
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
                        <Card className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'You haven\'t placed any orders yet'
                                }
                            </p>
                            <Link href="/products">
                                <Button className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold">
                                    Start Shopping
                                </Button>
                            </Link>
                        </Card>
                    ) : (
                        filteredOrders.map((order) => (
                            <Card key={order.id} className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.orderNumber}
                                            </h3>
                                            <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                                                {statusLabels[order.status as keyof typeof statusLabels]}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span>Ordered on {new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <CreditCard className="h-4 w-4" />
                                                <span>Total: {order.currency} {order.totalAmount.toLocaleString('en-LK')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                                            <MapPin className="h-4 w-4 mt-0.5" />
                                            <span>
                                                {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-900">Items:</p>
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between text-sm text-gray-600">
                                                    <span>{item.product.name} x {item.quantity}</span>
                                                    <span>{order.currency} {item.total.toLocaleString('en-LK')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            View Details
                                        </Button>
                                        {order.status === 'delivered' && (
                                            <Button variant="outline" className="flex items-center gap-2">
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
            </div>
        </div>
    )
}
