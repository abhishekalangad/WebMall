'use client'

import { useState } from 'react'
import {
    BarChart3,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Users,
    DollarSign,
    ArrowLeft,
    Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function AdminAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('Last 30 Days')

    const topProducts = [
        { name: 'Pearl & Gold Earrings', sales: 124, revenue: 'LKR 434,000', stock: 12 },
        { name: 'Leather Crossbody Bag', sales: 86, revenue: 'LKR 765,400', stock: 5 },
        { name: 'Crystal Bracelet Set', sales: 52, revenue: 'LKR 145,600', stock: 28 },
        { name: 'Silk Phone Cover', sales: 48, revenue: 'LKR 57,600', stock: 42 },
    ]

    const salesData = [
        { day: 'Mon', amount: 45000 },
        { day: 'Tue', amount: 52000 },
        { day: 'Wed', amount: 38000 },
        { day: 'Thu', amount: 65000 },
        { day: 'Fri', amount: 48000 },
        { day: 'Sat', amount: 82000 },
        { day: 'Sun', amount: 74000 },
    ]

    const maxSales = Math.max(...salesData.map(d => d.amount))

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="p-2 h-auto text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Sales & Performance</h1>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <p className="text-gray-500">Track your store's growth and customer behavior.</p>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-400">Time Range:</span>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option>Today</option>
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>Year to Date</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                +14% <TrendingUp className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400">Gross Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">LKR 1,406,600</h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                +8% <TrendingUp className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400">Total Orders</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">342</h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                -2% <ArrowDownRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400">Unique Visitors</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">12,450</h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                +5% <TrendingUp className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">LKR 4,112</h3>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sales Chart Placeholder */}
                    <Card className="lg:col-span-2 p-8 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Revenue Trends</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Period</span>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between space-x-4">
                            {salesData.map((data) => (
                                <div key={data.day} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className="w-full bg-pink-100 rounded-t-lg group-hover:bg-pink-300 transition-all duration-300 relative"
                                        style={{ height: `${(data.amount / maxSales) * 100}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            LKR {data.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-tighter">{data.day}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Top Products */}
                    <Card className="p-8 border-none shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h3>
                        <div className="space-y-6">
                            {topProducts.map((product) => (
                                <div key={product.name} className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{product.name}</h4>
                                        <p className="text-xs text-gray-400 font-semibold mt-1">{product.sales} sales • {product.stock} in stock</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap ml-4">{product.revenue}</p>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-8 text-pink-600 font-bold text-sm border-t border-gray-50 pt-6 h-auto">
                            View Detailed Inventory Report
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
