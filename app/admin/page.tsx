'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Package,
  Layers,
  ShoppingBag,
  Settings,
  Users,
  BarChart3,
  ArrowUpRight,
  Plus,
  Tag
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, loading, accessToken } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState([
    { title: 'Total Sales', value: 'LKR 0', change: '+0%', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Orders', value: '0', change: '+0', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Products', value: '0', change: '+0', icon: Package, color: 'text-pink-600', bg: 'bg-pink-100' },
    { title: 'New Customers', value: '0', change: '+0%', icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ])

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/login?redirect=/admin')
      } else {
        setReady(true)
        fetchStats()
      }
    }
  }, [user, loading, router])

  const fetchStats = async () => {
    try {
      const token = await accessToken()
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const s = data.stats
        setStats([
          { title: 'Total Sales', value: s.totalSales, change: '+0%', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Active Orders', value: s.activeOrders.toString(), change: '+0', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-100' },
          { title: 'Total Products', value: s.totalProducts.toString(), change: `+${s.activeProducts} active`, icon: Package, color: 'text-pink-600', bg: 'bg-pink-100' },
          { title: 'Total Customers', value: s.totalUsers.toString(), change: '+0%', icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    {
      title: 'Products',
      description: 'Manage inventory, prices, and stock',
      href: '/admin/products',
      icon: Package,
      count: 'Items'
    },
    {
      title: 'Categories',
      description: 'Organize stores and collections',
      href: '/admin/categories',
      icon: Layers,
      count: 'Active'
    },
    {
      title: 'Orders',
      description: 'Process shipments and payouts',
      href: '/admin/orders',
      icon: ShoppingBag,
      count: 'Pending'
    },
    {
      title: 'Customers',
      description: 'Manage user accounts and history',
      href: '/admin/users',
      icon: Users,
      count: 'Total'
    },
    {
      title: 'Coupons',
      description: 'Manage discount codes and promotions',
      href: '/admin/coupons',
      icon: Tag,
      count: 'Active'
    },
    {
      title: 'Site Settings',
      description: 'Logo, branding, and configurations',
      href: '/admin/settings',
      icon: Settings,
      count: 'System'
    },
    {
      title: 'Analytics',
      description: 'View detailed sales and traffic reports',
      href: '/admin/analytics',
      icon: BarChart3,
      count: 'Live'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/admin/products">
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold rounded-lg transition-all shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6 hover:shadow-md transition-all border-none shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  {stat.change}
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </Card>
          ))}
        </div>

        {/* Navigation Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="group p-6 hover:shadow-xl transition-all border-none shadow-sm cursor-pointer relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-pink-50 transition-colors">
                      <item.icon className="w-6 h-6 text-gray-600 group-hover:text-pink-600 transition-colors" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.count}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}



