'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag, User, Menu, X, ChevronDown, LogOut, Settings, Package, Heart, Search, Mail } from 'lucide-react'
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
  const { user, signOut, loading } = useAuth()
  const { totalItems } = useCart()
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

  // Fetch unread messages count
  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          if (user.role === 'admin') {
            const res = await fetch('/api/contact?status=new')
            if (res.ok) {
              const data = await res.json()
              setUnreadMessages(data.stats?.new || 0)
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
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const isActive = (path: string) => pathname === path

  // Determine if navigation and search should be shown
  const shouldShowNavigation = () => {
    // Hide on auth pages
    if (pathname.includes('/login') || pathname.includes('/register')) return false

    // Hide on 404 pages (Next.js uses various patterns for this)
    if (pathname === '/404' || pathname === '/not-found') return false

    // Hide on admin pages (they have their own navigation)
    if (pathname.startsWith('/admin') && pathname !== '/admin') return false

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
  const navItems = user?.role === 'admin'
    ? (settings?.headerNavigation && Array.isArray(settings.headerNavigation)
      ? settings.headerNavigation
      : DEFAULT_ADMIN_TABS)
    : (settings?.customerNavigation && Array.isArray(settings.customerNavigation)
      ? settings.customerNavigation
      : DEFAULT_CUSTOMER_TABS)

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Left Side: Logo & Navigation Group */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={settings?.logoUrl || '/logo-no-bg.png'}
                alt={settings?.storeName || 'WebMall'}
                className="h-10 sm:h-14 md:h-16 w-auto object-contain"
              />
              <span className="text-xl sm:text-2xl md:text-3xl font-playfair font-bold text-gray-900 truncate">
                {configLoading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  settings?.storeName || 'WebMall'
                )}
              </span>
            </Link>

            {/* Desktop Navigation Grouped with Logo */}
            {shouldShowNavigation() && (
              <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 ml-6 xl:ml-12">
                {navItems.map((link: any, index: number) => (
                  <Link
                    key={index}
                    href={link.path || '#'}
                    className={`font-cursive text-lg xl:text-2xl whitespace-nowrap hover:text-pink-600 transition-colors ${isActive(link.path) ? 'text-pink-600' : 'text-gray-600'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>


          {/* Center: Search Bar (Fills remaining space without moving other items) */}
          {shouldShowNavigation() && (
            <div className="hidden md:flex flex-1 items-center justify-center px-4 lg:px-8 xl:px-12">
              <div className="w-full max-w-[380px] lg:max-w-[480px]">
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 lg:pl-11 pr-3 lg:pr-4 h-10 lg:h-11 w-48 lg:w-64 group-hover:w-full group-focus-within:w-full border-none rounded-full bg-gray-100/80 focus:bg-white focus:ring-0 focus:outline-none transition-all duration-500 font-cursive text-base lg:text-xl"
                  />
                </form>
              </div>
            </div>
          )}

          {/* Right Side: Actions Grouped */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0">
            {user && (
              <Link href="/wishlist" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                {wishlistItems > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center border-2 border-white font-bold">
                    {wishlistItems}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <Link href="/cart" className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-pink-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center border-2 border-white font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <div className="w-6 h-6 border-2 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-100 rounded-full p-1.5 sm:p-2 transition-all"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm relative">
                    {user.role === 'admin' ? (
                      // Admin: Show WebMall transparent logo
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <img
                          src="/logo-no-bg.png"
                          alt="WebMall"
                          className="w-full h-full object-contain scale-90"
                        />
                      </div>
                    ) : user.profileImage ? (
                      // Customer: Show profile image if available
                      <img src={user.profileImage} alt={user.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      // Customer: Show initials if no profile image
                      <div className="w-full h-full bg-gradient-to-br from-pink-300 to-yellow-300 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-[9999]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <div className="py-2">
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <Package className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href={user.role === 'admin' ? "/admin/messages" : "/profile/messages"}
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-3 text-gray-400" />
                          <span>{user.role === 'admin' ? 'Customer Messages' : 'My Messages'}</span>
                        </div>
                        {unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>
                      <Link href="/cart" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <ShoppingBag className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Cart</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                          <User className="h-4 w-4 mr-3 text-gray-400" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false)
                          await signOut()
                          window.location.href = '/'
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex gap-2">
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t py-4 bg-white shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 mb-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent text-base"
                  />
                </div>
              </form>
            </div>

            <div className="flex flex-col space-y-1">
              {navItems.map((link: any, index: number) => (
                <Link
                  key={index}
                  href={link.path || '#'}
                  className={`block px-4 py-3 font-cursive text-xl sm:text-2xl transition-all rounded-lg mx-2 ${isActive(link.path) ? 'bg-pink-50 text-pink-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link href="/orders" className={`block px-4 py-3 font-cursive text-xl sm:text-2xl transition-all rounded-lg mx-2 ${isActive('/orders') ? 'bg-pink-50 text-pink-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  My Orders
                </Link>
              )}
              {user && (
                <Link
                  href={user.role === 'admin' ? "/admin/messages" : "/profile/messages"}
                  className={`block px-4 py-3 font-cursive text-xl sm:text-2xl transition-all rounded-lg mx-2 ${isActive(user.role === 'admin' ? '/admin/messages' : '/profile/messages') ? 'bg-pink-50 text-pink-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user.role === 'admin' ? 'Customer Messages' : 'My Messages'}
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`block px-4 py-3 font-cursive text-xl sm:text-2xl transition-all rounded-lg mx-2 ${isActive('/admin') ? 'bg-pink-50 text-pink-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {!user && (
                <Link href="/login" className="block px-4 py-3 mx-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-bold">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

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
