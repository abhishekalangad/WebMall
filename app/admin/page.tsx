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
  CheckCircle2,
  Boxes
} from 'lucide-react'

export default function AdminDashboardPage() {
  const { user, loading, accessToken } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [stats, setStats] = useState([
    { title: 'Total Sales', value: 'LKR 0', change: '+0%', trend: 'up', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { title: 'Active Orders', value: '0', change: '+0', trend: 'up', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    { title: 'Total Products', value: '0', change: '+0', trend: 'up', icon: Package, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-950/20', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
    { title: 'Total Customers', value: '0', change: '+0%', trend: 'up', icon: Users, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50/50 dark:bg-orange-950/20', iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
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
            trend: s.salesTrend || 'up',
            icon: DollarSign,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40'
          },
          {
            title: 'Active Orders',
            value: s.activeOrders?.toString() || '0',
            change: s.pendingOrders > 0 ? `${s.pendingOrders} pending` : 'No pending',
            trend: s.activeOrders > 0 ? 'up' : 'neutral',
            icon: ShoppingBag,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50/50 dark:bg-blue-950/20',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40'
          },
          {
            title: 'Total Products',
            value: s.totalProducts?.toString() || '0',
            change: `${s.activeProducts || 0} active`,
            trend: 'up',
            icon: Package,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50/50 dark:bg-purple-950/20',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40'
          },
          {
            title: 'Total Customers',
            value: s.totalUsers?.toString() || '0',
            change: s.newCustomers ? `+${s.newCustomers} new` : '0 new',
            trend: 'up',
            icon: Users,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50/50 dark:bg-orange-950/20',
            iconBg: 'bg-orange-100 dark:bg-orange-900/40'
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-border border-t-foreground rounded-full"
          />
          <p className="text-muted-foreground font-semibold text-lg">Loading Dashboard...</p>
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
    {
      title: 'Inventory',
      description: 'Track operational supplies like tape, boxes, business cards',
      href: '/admin/inventory',
      icon: Boxes,
      count: dashboardData?.stats?.lowStockCount?.toString() ?? '—',
      badge: 'Low Stock',
      color: 'teal'
    },
  ]

  const colorClasses = {
    purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', hover: 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50', border: 'border-purple-200 dark:border-purple-900' },
    indigo: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', hover: 'group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50', border: 'border-indigo-200 dark:border-indigo-900' },
    blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', hover: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50', border: 'border-blue-200 dark:border-blue-900' },
    pink: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30', hover: 'group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50', border: 'border-pink-200 dark:border-pink-900' },
    orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', hover: 'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50', border: 'border-orange-200 dark:border-orange-900' },
    green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', hover: 'group-hover:bg-green-100 dark:group-hover:bg-green-900/50', border: 'border-green-200 dark:border-green-900' },
    gray: { text: 'text-muted-foreground', bg: 'bg-muted/50', hover: 'group-hover:bg-muted', border: 'border-border' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', hover: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50', border: 'border-emerald-200 dark:border-emerald-900' },
    teal: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', hover: 'group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50', border: 'border-teal-200 dark:border-teal-900' },
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
    <div className="min-h-screen bg-background pb-12 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-10">
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
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full blur-3xl"
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
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/30 to-emerald-500/30 dark:from-blue-900/40 dark:to-emerald-900/40 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b border-border mb-8 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent"
              >
                Admin Command Center
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mt-2 flex items-center gap-2"
              >
                <span>Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>.</span>
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
                className="flex items-center px-4 py-2.5 bg-card border border-border hover:border-gray-400 text-foreground/80 font-medium rounded-xl transition-all shadow-sm hover:shadow"
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/api/admin/export/orders'}
                className="flex items-center px-4 py-2.5 bg-card border border-border hover:border-gray-400 text-foreground/80 font-medium rounded-xl transition-all shadow-sm hover:shadow"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Export Report
              </motion.button>
              <Link href="/admin/products">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-5 py-2.5 bg-foreground text-background font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
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
              <Card className={`p-6 border-none shadow-sm hover:shadow-xl transition-all ${stat.bg} relative overflow-hidden group`}>
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                      className={`flex items-center text-xs font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} bg-card/80 px-2.5 py-1 rounded-full shadow-sm`}
                    >
                      {stat.change}
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 ml-1" />
                      )}
                    </motion.span>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{stat.title}</p>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-2xl md:text-3xl font-bold text-foreground"
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Management Modules</h2>
            {messageStats.new > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400 rounded-full text-sm font-semibold"
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
                  <Card className={`group p-6 hover:shadow-2xl transition-all border-2 ${item.highlight ? 'border-pink-300 shadow-lg' : 'border-transparent'} cursor-pointer relative overflow-hidden bg-card`}>
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
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.badge}</p>
                          <p className={`text-xl font-bold ${colors.text}`}>{item.count}</p>
                        </div>
                      </div>
                      <h3 className={`text-xl font-bold text-foreground ${colors.text} transition-colors mb-2`}>
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>

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
