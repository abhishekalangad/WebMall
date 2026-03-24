'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
    BarChart3,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Users,
    DollarSign,
    ArrowLeft,
    Calendar,
    PieChart as PieChartIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function AnalyticsClient() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-muted/50 flex items-center justify-center">Loading Analytics...</div>}>
            <AnalyticsContent />
        </Suspense>
    )
}

function AnalyticsContent() {
    const { accessToken } = useAuth()
    const [rangeType, setRangeType] = useState('preset')
    const [timeRange, setTimeRange] = useState('Last 30 Days')
    const [customMonth, setCustomMonth] = useState('March')
    const [customYear, setCustomYear] = useState('2026')
    const [isLoading, setIsLoading] = useState(true)

    const [metrics, setMetrics] = useState({
        grossRevenue: 0,
        totalOrders: 0,
        uniqueVisitors: 0,
        avgOrderValue: 0,
        growth: { revenue: 0, orders: 0, customers: 0, avgOrderValue: 0 }
    })

    const [topProducts, setTopProducts] = useState<Array<{ name: string, sales: number, revenue: string, stock: number }>>([])
    const [salesData, setSalesData] = useState<Array<{ day: string, amount: number }>>([])
    const [salesByCategory, setSalesByCategory] = useState<Array<{ name: string, value: number }>>([])
    const [ordersByStatus, setOrdersByStatus] = useState<Array<{ name: string, value: number }>>([])

    // Colors for charts
    const COLORS = ['#f472b6', '#60a5fa', '#a78bfa', '#fcd34d', '#34d399', '#f87171']

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true)
            try {
                const token = await accessToken()
                const headers: HeadersInit = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(`/api/admin/sales-report?range=${encodeURIComponent(timeRange)}`, { headers })
                if (!res.ok) throw new Error('Failed to fetch analytics')
                
                const data = await res.json()
                setMetrics(data.metrics || { grossRevenue: 0, totalOrders: 0, uniqueVisitors: 0, avgOrderValue: 0, growth: { revenue: 0, orders: 0, customers: 0, avgOrderValue: 0 } })
                setTopProducts(data.topProducts || [])
                setSalesData(data.salesData || [])
                setSalesByCategory(data.salesByCategory || [])
                setOrdersByStatus(data.ordersByStatus || [])
            } catch (error) {
                console.error("Error fetching sales analytics:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAnalytics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange])

    const { monthList, yearList } = useMemo(() => {
        const _monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const d = new Date();
        const _yearList = [];
        for (let i = 0; i < 5; i++) {
            _yearList.push((d.getFullYear() - i).toString());
        }
        return { monthList: _monthList, yearList: _yearList };
    }, [])

    const maxSales = Math.max(...salesData.map(d => d.amount), 1)

    // Calculate totals for progress bars
    const totalStatusValue = ordersByStatus.reduce((sum, item) => sum + item.value, 0)
    const maxCategoryValue = Math.max(...salesByCategory.map(c => c.value), 1)

    const renderGrowth = (value?: number) => {
        if (value === undefined || value === 0) return <span className="flex items-center text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">0%</span>
        if (value > 0) return <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+{value}% <TrendingUp className="w-3 h-3 ml-1" /></span>
        return <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{value}% <ArrowDownRight className="w-3 h-3 ml-1" /></span>
    }

    return (
        <div className="min-h-screen bg-muted/50 pb-12">
            <div className="bg-card border-b mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="p-2 h-auto text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-foreground">Sales & Performance</h1>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <p className="text-muted-foreground">Track your store's growth and customer behavior.</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground/80 shrink-0">Filter By:</span>
                            <select
                                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                value={rangeType}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    setRangeType(newType);
                                    if (newType === 'preset') setTimeRange('Last 30 Days');
                                    else if (newType === 'month') setTimeRange(`${customMonth} ${customYear}`);
                                    else if (newType === 'year') setTimeRange(customYear);
                                }}
                            >
                                <option value="preset">Preset Range</option>
                                <option value="month">Month & Year</option>
                                <option value="year">Specific Year</option>
                            </select>

                            {rangeType === 'preset' && (
                                <select
                                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                >
                                    <option>Today</option>
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Year to Date</option>
                                </select>
                            )}

                            {rangeType === 'month' && (
                                <div className="flex gap-2">
                                    <select
                                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                        value={customMonth}
                                        onChange={(e) => {
                                            const m = e.target.value;
                                            setCustomMonth(m);
                                            setTimeRange(`${m} ${customYear}`);
                                        }}
                                    >
                                        {monthList.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select
                                        className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                        value={customYear}
                                        onChange={(e) => {
                                            const y = e.target.value;
                                            setCustomYear(y);
                                            setTimeRange(`${customMonth} ${y}`);
                                        }}
                                    >
                                        {yearList.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            )}

                            {rangeType === 'year' && (
                                <select
                                    className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                    value={customYear}
                                    onChange={(e) => {
                                        const y = e.target.value;
                                        setCustomYear(y);
                                        setTimeRange(y);
                                    }}
                                >
                                    {yearList.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
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
                            {renderGrowth(metrics.growth?.revenue)}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80">Gross Revenue</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {isLoading ? '...' : `LKR ${metrics.grossRevenue.toLocaleString()}`}
                        </h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            {renderGrowth(metrics.growth?.orders)}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80">Total Orders</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {isLoading ? '...' : metrics.totalOrders}
                        </h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            {renderGrowth(metrics.growth?.customers)}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80">Unique Customers</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {isLoading ? '...' : metrics.uniqueVisitors}
                        </h3>
                    </Card>

                    <Card className="p-6 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            {renderGrowth(metrics.growth?.avgOrderValue)}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/80">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">
                            {isLoading ? '...' : `LKR ${Math.round(metrics.avgOrderValue).toLocaleString()}`}
                        </h3>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Sales Chart */}
                    <Card className="lg:col-span-2 p-4 md:p-8 border-none shadow-sm min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <h3 className="text-xl font-bold text-foreground">Revenue Trends</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Period</span>
                            </div>
                        </div>

                        <div className="h-64 mt-4 w-full">
                            {isLoading ? (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/80 font-semibold">Loading chart...</div>
                            ) : salesData.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/80 font-semibold">No data available for this range</div>
                            ) : (
                                <div className="w-full h-full flex items-end justify-between space-x-1 sm:space-x-4 overflow-x-auto pb-6 scrollbar-hide pt-10">
                                    {salesData.map((data, idx) => (
                                        <div key={`${data.day}-${idx}`} className="flex-1 flex flex-col items-center group min-w-[30px] h-full justify-end">
                                            <div
                                                className="w-full bg-pink-100 rounded-t-lg group-hover:bg-pink-400 transition-all duration-300 relative min-h-[4px]"
                                                style={{ height: `${(data.amount / maxSales) * 100}%` }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                                    LKR {data.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground/80 mt-4 uppercase tracking-tighter truncate w-full text-center" title={data.day}>{data.day}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Orders by Status */}
                    <Card className="p-4 md:p-8 border-none shadow-sm flex flex-col min-w-0">
                        <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-muted-foreground/80" />
                            Orders by Status
                        </h3>
                        <div className="flex-1 w-full pl-2">
                            {isLoading ? (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/80 font-semibold mt-10">Loading data...</div>
                            ) : ordersByStatus.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/80 font-semibold mt-10">No orders found</div>
                            ) : (
                                <div className="space-y-5 mt-4">
                                    {ordersByStatus.map((status, idx) => (
                                        <div key={status.name} className="w-full">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-sm font-bold text-foreground/80">{status.name}</span>
                                                <span className="text-sm font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{status.value}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-3">
                                                <div 
                                                    className="h-3 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${Math.max((status.value / (totalStatusValue || 1)) * 100, 2)}%`,
                                                        backgroundColor: COLORS[idx % COLORS.length] 
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sales by Category */}
                    <Card className="lg:col-span-2 p-4 md:p-8 border-none shadow-sm min-w-0">
                        <h3 className="text-xl font-bold text-foreground mb-6">Sales by Category</h3>
                        <div className="flex-1 mt-6">
                            {isLoading ? (
                                <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground/80 font-semibold">Loading categories...</div>
                            ) : salesByCategory.length === 0 ? (
                                <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground/80 font-semibold">No categories found</div>
                            ) : (
                                <div className="space-y-6">
                                    {salesByCategory.map((category, idx) => (
                                        <div key={category.name} className="w-full">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-foreground/80">{category.name}</span>
                                                <span className="text-sm font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-md">
                                                    LKR {category.value.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-4">
                                                <div 
                                                    className="h-4 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${Math.max((category.value / maxCategoryValue) * 100, 2)}%`,
                                                        backgroundColor: COLORS[idx % COLORS.length]
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Top Products */}
                    <Card className="p-4 md:p-8 border-none shadow-sm">
                        <h3 className="text-xl font-bold text-foreground mb-6">Top Selling Products</h3>
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="text-muted-foreground/80">Loading top products...</div>
                            ) : topProducts.length === 0 ? (
                                <div className="text-muted-foreground/80 text-sm">No sales data available.</div>
                            ) : topProducts.map((product, idx) => (
                                <div key={`${product.name}-${idx}`} className="flex items-start justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-foreground leading-tight truncate">{product.name}</h4>
                                        <p className="text-xs text-muted-foreground/80 font-semibold mt-1">
                                            {product.sales} sold • {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-foreground whitespace-nowrap bg-muted/50 px-2 sm:px-3 py-1.5 rounded-lg shrink-0">{product.revenue}</p>
                                </div>
                            ))}
                        </div>
                        <Link href="/admin/inventory" className="block w-full">
                            <Button variant="ghost" className="w-full mt-8 text-pink-600 font-bold text-sm border-t border-gray-50 pt-6 h-auto hover:bg-pink-50 hover:text-pink-700 transition-all rounded-b-xl">
                                View Full Product Inventory
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    )
}
