'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Layers,
  ShoppingBag,
  Settings,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Tag,
  Mail,
  TrendingUp,
  DollarSign,
  RefreshCcw,
  Bell,
  Clock,
  CheckCircle2
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, loading, accessToken } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [stats, setStats] = useState([
    { title: 'Total Sales', value: 'LKR 0', change: '+0%', trend: 'up', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
    { title: 'Active Orders', value: '0', change: '+0', trend: 'up', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
    { title: 'Total Products', value: '0', change: '+0', trend: 'up', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100' },
    { title: 'Total Customers', value: '0', change: '+0%', trend: 'up', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
  ])

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/login?redirect=/admin')
      } else {
        setReady(true)
        fetchAllStats()
      }
    }
  }, [user, loading, router])

  const fetchAllStats = async () => {
    try {
      const token = await accessToken()
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)

        const s = data.stats
        setStats([
          {
            title: 'Total Sales',
            value: s.totalSales,
            change: s.salesChange || '+0%',
            trend: 'up',
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100'
          },
          {
            title: 'Active Orders',
            value: s.activeOrders?.toString() || '0',
            change: s.pendingOrders > 0 ? `${s.pendingOrders} pending` : 'No pending',
            trend: s.activeOrders > 0 ? 'up' : 'neutral',
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100'
          },
          {
            title: 'Total Products',
            value: s.totalProducts?.toString() || '0',
            change: `${s.activeProducts || 0} active`,
            trend: 'up',
            icon: Package,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            iconBg: 'bg-purple-100'
          },
          {
            title: 'Total Customers',
            value: s.totalUsers?.toString() || '0',
            change: s.newCustomers ? `+${s.newCustomers} new` : '0 new',
            trend: 'up',
            icon: Users,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            iconBg: 'bg-orange-100'
          },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllStats()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full"
          />
          <p className="text-gray-600 font-semibold text-lg">Loading Dashboard...</p>
        </motion.div>
      </div>
    )
  }

  // Get message stats from dashboard data
  const messageStats = dashboardData?.stats?.messageStats || { new: 0, read: 0, replied: 0, total: 0 }

  const navItems = [
    {
      title: 'Products',
      description: 'Manage inventory, prices, and stock',
      href: '/admin/products',
      icon: Package,
      count: dashboardData?.stats?.totalProducts?.toString() || stats[2].value,
      badge: 'Items',
      color: 'purple'
    },
    {
      title: 'Categories',
      description: 'Organize stores and collections',
      href: '/admin/categories',
      icon: Layers,
      count: dashboardData?.stats?.totalCategories?.toString() || '0',
      badge: 'Active',
      color: 'indigo'
    },
    {
      title: 'Orders',
      description: 'Process shipments and payouts',
      href: '/admin/orders',
      icon: ShoppingBag,
      count: dashboardData?.stats?.pendingOrders?.toString() || stats[1].value,
      badge: 'Pending',
      color: 'blue'
    },
    {
      title: 'Messages',
      description: 'View and respond to customer inquiries',
      href: '/admin/messages',
      icon: Mail,
      count: messageStats.new.toString(),
      badge: 'New',
      color: 'pink',
      highlight: messageStats.new > 0
    },
    {
      title: 'Customers',
      description: 'Manage user accounts and history',
      href: '/admin/users',
      icon: Users,
      count: dashboardData?.stats?.totalUsers?.toString() || stats[3].value,
      badge: 'Total',
      color: 'orange'
    },
    {
      title: 'Coupons',
      description: 'Active discount codes and promotions',
      href: '/admin/coupons',
      icon: Tag,
      count: dashboardData?.stats?.activeCoupons?.toString() || '1',
      badge: 'Active',
      color: 'green'
    },
    {
      title: 'Site Settings',
      description: 'Logo, branding, and configurations',
      href: '/admin/settings',
      icon: Settings,
      count: '—',
      badge: 'System',
      color: 'gray'
    },
    {
      title: 'Analytics',
      description: 'View detailed sales and traffic reports',
      href: '/admin/analytics',
      icon: BarChart3,
      count: '—',
      badge: 'Live',
      color: 'emerald'
    },
  ]

  const colorClasses = {
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', hover: 'group-hover:bg-purple-100', border: 'border-purple-200' },
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'group-hover:bg-indigo-100', border: 'border-indigo-200' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', hover: 'group-hover:bg-blue-100', border: 'border-blue-200' },
    pink: { text: 'text-pink-600', bg: 'bg-pink-50', hover: 'group-hover:bg-pink-100', border: 'border-pink-200' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50', hover: 'group-hover:bg-orange-100', border: 'border-orange-200' },
    green: { text: 'text-green-600', bg: 'bg-green-50', hover: 'group-hover:bg-green-100', border: 'border-green-200' },
    gray: { text: 'text-gray-600', bg: 'bg-gray-50', hover: 'group-hover:bg-gray-100', border: 'border-gray-200' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'group-hover:bg-emerald-100', border: 'border-emerald-200' },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-12">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-blue-200 to-emerald-200 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 mb-8 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
              >
                Admin Command Center
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mt-2 flex items-center gap-2"
              >
                <span>Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>.</span>
                <span className="hidden sm:inline">Here's what's happening today.</span>
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="flex items-center px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-all shadow-sm hover:shadow"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <Link href="/admin/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`p-6 border-none shadow-lg hover:shadow-xl transition-all ${stat.bg} relative overflow-hidden group`}>
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`p-3 rounded-xl ${stat.iconBg} shadow-sm`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </motion.div>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`flex items-center text-xs font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} bg-white/80 px-2.5 py-1 rounded-full shadow-sm`}
                    >
                      {stat.change}
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 ml-1" />
                      )}
                    </motion.span>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-2xl md:text-3xl font-bold text-gray-900"
                  >
                    {stat.value}
                  </motion.h3>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Management Modules</h2>
            {messageStats.new > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold"
              >
                <Bell className="w-4 h-4 animate-pulse" />
                {messageStats.new} new message{messageStats.new > 1 ? 's' : ''}
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {navItems.map((item, index) => {
            const colors = colorClasses[item.color as keyof typeof colorClasses]
            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Link href={item.href}>
                  <Card className={`group p-6 hover:shadow-2xl transition-all border-2 ${item.highlight ? 'border-pink-300 shadow-lg' : 'border-transparent'} cursor-pointer relative overflow-hidden bg-white`}>
                    {/* Animated background */}
                    <motion.div
                      className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Highlight pulse for new messages */}
                    {item.highlight && (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-pink-100 rounded-xl"
                      />
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`p-3 ${colors.bg} rounded-xl ${colors.hover} transition-all shadow-sm`}
                        >
                          <item.icon className={`w-6 h-6 ${colors.text} transition-colors`} />
                        </motion.div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.badge}</p>
                          <p className={`text-xl font-bold ${colors.text}`}>{item.count}</p>
                        </div>
                      </div>
                      <h3 className={`text-xl font-bold text-gray-900 ${colors.text} transition-colors mb-2`}>
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>

                      {item.highlight && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-center gap-2 text-pink-600 text-xs font-semibold"
                        >
                          <Clock className="w-3 h-3" />
                          Attention needed
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
