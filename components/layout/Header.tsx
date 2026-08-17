'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag, User, Menu, X, ChevronDown, LogOut, Settings, Package, Heart, Search, Mail, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

function HeaderContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('')
  const { user, signOut, loading, accessToken } = useAuth()
  const { items } = useCart()
  const itemCount = items.length
  const { totalItems: wishlistItems } = useWishlist()
  const { settings, categories, loading: configLoading } = useSiteConfig()

  const [unreadMessages, setUnreadMessages] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Sync category dropdown with URL query param on mount/navigation
  useEffect(() => {
    const categoryParam = searchParams.get('category')?.toLowerCase().replace(/-/g, ' ')
    if (categoryParam) {
      const matchingCat = categories.find((cat: any) => cat.name.toLowerCase() === categoryParam)
      if (matchingCat) {
        setSelectedSearchCategory(matchingCat.name)
      } else {
        setSelectedSearchCategory(categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1))
      }
    } else {
      setSelectedSearchCategory('')
    }
  }, [searchParams, categories])

  // Fetch unread messages count
  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          if (user?.role === 'admin') {
            const token = await accessToken()
            if (token) {
              const res = await fetch('/api/contact?status=new', {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (res.ok) {
                const data = await res.json()
                setUnreadMessages(data.stats?.new || 0)
              }
            }
          } else {
            const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
            if (session?.access_token) {
              const res = await fetch('/api/user/messages', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              })
              if (res.ok) {
                const data = await res.json()
                setUnreadMessages(data.unreadCount || 0)
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      }
      fetchUnread()
      const interval = setInterval(fetchUnread, 30000)
      return () => clearInterval(interval)
    } else {
      setUnreadMessages(0)
    }
  }, [user, accessToken])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const queryParams = new URLSearchParams()
    if (searchQuery.trim()) {
      queryParams.set('search', searchQuery.trim())
    }
    if (selectedSearchCategory) {
      queryParams.set('category', selectedSearchCategory.toLowerCase().replace(/ /g, '-'))
    }
    router.push(`/products?${queryParams.toString()}`)
  }

  const isActive = (path: string) => pathname === path

  // Determine if navigation and search should be shown
  const shouldShowNavigation = () => {
    // Hide on auth pages
    if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/auth/')) return false

    // Hide on 404 pages (Next.js uses various patterns for this)
    if (pathname === '/404' || pathname === '/not-found') return false

    // Show on admin pages for admin users (they should see their custom admin navigation)
    if (pathname.startsWith('/admin') && user?.role === 'admin') return true

    // Hide on admin pages for non-admin users
    if (pathname.startsWith('/admin')) return false

    // Hide on checkout flow
    if (pathname.includes('/checkout')) return false

    // Show on all other pages
    return true
  }

  const DEFAULT_CUSTOMER_TABS = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ]

  const DEFAULT_ADMIN_TABS = [
    { label: 'Categories', path: '/admin/categories' },
    { label: 'Products', path: '/admin/products' },
    { label: 'Orders', path: '/admin/orders' },
    { label: 'Messages', path: '/admin/messages' },
    { label: 'Settings', path: '/admin/settings' }
  ]

  // Determine which navigation to show based on user role
  // If settings exist and have items, use them. Otherwise, use defaults.
  const navItems = user?.role === 'admin'
    ? (settings?.headerNavigation && Array.isArray(settings.headerNavigation) && settings.headerNavigation.length > 0
      ? settings.headerNavigation
      : DEFAULT_ADMIN_TABS)
    : (settings?.customerNavigation && Array.isArray(settings.customerNavigation) && settings.customerNavigation.length > 0
      ? settings.customerNavigation
      : DEFAULT_CUSTOMER_TABS)

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-50 font-sans" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Top Row (Logo, Search, and Action Icons) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left Side: Logo & Store Name */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src={settings?.logoUrl || '/logo-no-bg.png'}
                alt={settings?.storeName || 'WebMall'}
                width={120}
                height={48}
                priority
                className="h-9 sm:h-12 md:h-14 w-auto object-contain dark:brightness-200"
              />
              <span className="text-xl sm:text-2xl font-playfair font-bold text-gray-900 dark:text-white truncate">
                {configLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded"></div>
                ) : (
                  settings?.storeName || 'WebMall'
                )}
              </span>
            </Link>
          </div>

          {/* Center Side: Advanced Search Bar */}
          {shouldShowNavigation() && (
            <div className="hidden md:flex flex-1 items-center px-6 lg:px-12 max-w-2xl">
              <form onSubmit={handleSearch} className="w-full flex items-center bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 pl-4 pr-0 py-[3px] h-11 transition-all focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:ring-2 focus-within:ring-pink-100 dark:focus-within:ring-pink-900">
                {/* Categories Dropdown */}
                <div className="relative flex items-center bg-transparent shrink-0">
                  <select
                    value={selectedSearchCategory}
                    aria-label="Select Category"
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedSearchCategory(val)
                      const queryParams = new URLSearchParams()
                      if (searchQuery.trim()) {
                        queryParams.set('search', searchQuery.trim())
                      }
                      if (val) {
                        queryParams.set('category', val.toLowerCase().replace(/ /g, '-'))
                      }
                      router.push(`/products?${queryParams.toString()}`)
                    }}
                    className="appearance-none bg-transparent pl-2 pr-8 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer font-sans font-medium border-none focus:ring-0 select-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Vertical Divider */}
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-2 shrink-0" />

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search for products, practitioners, videos..."
                  aria-label="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none border-none focus:ring-0 font-sans"
                />

                {/* Search Submit Button */}
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="flex items-center justify-center h-[38px] w-[38px] rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white transition-colors shrink-0 shadow-sm translate-x-[1px]"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Right Side: Actions Grouped */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">

            {/* Track Order outline button */}
            <Link href="/orders" aria-label="Track Order" className="hidden lg:flex">
              <Button
                variant="outline"
                className="flex items-center space-x-2 h-10 px-4 rounded-full border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Track Order</span>
              </Button>
            </Link>

            {user && (
              <Link href="/wishlist" aria-label="Wishlist" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Heart className="h-6 w-6" />
                {wishlistItems > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white font-bold">
                    {wishlistItems}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <Link href="/cart" aria-label="Shopping Cart" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ShoppingBag className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#ec4899] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  aria-label="Account Menu"
                  className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1.5 transition-all"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-border bg-background shadow-sm relative">
                    {user?.role === 'admin' ? (
                      <div className="w-full h-full bg-background flex items-center justify-center">
                        <Image
                          src="/logo-no-bg.png"
                          alt="WebMall"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain scale-90 dark:brightness-200"
                        />
                      </div>
                    ) : user?.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user?.name || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </Button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border py-3 z-[9999]">
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>

                    <div className="py-2">
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>My Profile</span>
                      </Link>
                      <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                        <Package className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href={user?.role === 'admin' ? "/admin/messages" : "/profile/messages"}
                        className="flex items-center justify-between px-4 py-2 text-sm text-foreground/80 hover:bg-muted"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                          <span>{user?.role === 'admin' ? 'Customer Messages' : 'My Messages'}</span>
                        </div>
                        {unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>
                      <Link href="/cart" className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                        <ShoppingBag className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>My Cart</span>
                      </Link>
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-foreground/80 hover:bg-muted" onClick={() => setIsUserMenuOpen(false)}>
                          <User className="h-4 w-4 mr-3 text-muted-foreground" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-2">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false)
                          await signOut()
                          window.location.href = '/'
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" aria-label="Sign In" className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <User className="h-6 w-6" />
              </Link>
            )}

            <button
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row (Navigation menu & Login Button) */}
      {shouldShowNavigation() && !configLoading && (
        <div className="hidden lg:block border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              {/* Navigation Links */}
              <nav className="flex items-center space-x-8">
                {navItems.map((link: any, index: number) => {
                  const active = isActive(link.path)
                  return (
                    <Link
                      key={index}
                      href={link.path || '#'}
                      className={`relative py-3.5 text-[15px] font-medium transition-colors hover:text-[#be185d] dark:hover:text-pink-400 ${active ? 'text-[#be185d] dark:text-pink-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}
                    >
                      {link.label}
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#be185d] dark:bg-pink-400 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Login / Register Button */}
              {!user && (
                <div>
                  <Link href="/login" aria-label="Login or Register account">
                    <Button className="h-9 px-6 rounded-full bg-[#be185d] hover:bg-[#9d174d] text-white font-semibold text-[13px] transition-all shadow-sm">
                      Login / Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t py-4 bg-white dark:bg-gray-900 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 mb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 focus:border-transparent text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </form>
          </div>

          <div className="flex flex-col space-y-1">
            {navItems.map((link: any, index: number) => (
              <Link
                key={index}
                href={link.path || '#'}
                className={`block px-4 py-3 text-base font-medium transition-all rounded-lg mx-2 ${isActive(link.path) ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link href="/orders" className={`block px-4 py-3 text-base font-medium transition-all rounded-lg mx-2 ${isActive('/orders') ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setIsMobileMenuOpen(false)}>
                My Orders
              </Link>
            )}
            {user && (
              <Link
                href={user?.role === 'admin' ? "/admin/messages" : "/profile/messages"}
                className={`block px-4 py-3 text-base font-medium transition-all rounded-lg mx-2 ${isActive(user?.role === 'admin' ? '/admin/messages' : '/profile/messages') ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user?.role === 'admin' ? 'Customer Messages' : 'My Messages'}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`block px-4 py-3 text-base font-medium transition-all rounded-lg mx-2 ${isActive('/admin') ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-500 dark:text-pink-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            {!user && (
              <Link href="/login" className="block px-4 py-3 mx-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  )
}

export function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b" />}>
      <HeaderContent />
    </Suspense>
  )
}

