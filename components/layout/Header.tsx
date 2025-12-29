'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, User, Menu, X, ChevronDown, LogOut, Settings, Package, Heart, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'


export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, signOut, loading, refreshUser } = useAuth()
  const { totalItems } = useCart()
  const { totalItems: wishlistItems } = useWishlist()
  const { settings, categories, loading: configLoading } = useSiteConfig()

  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }



  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src={settings?.logoUrl || '/logo-no-bg.png'}
              alt={settings?.storeName || 'WebMall'}
              className="h-12 w-auto object-contain"
            />
            <span className="text-3xl font-playfair font-bold text-gray-900">
              {configLoading ? '...' : (settings?.storeName || 'WebMall')}
            </span>
          </Link>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-16">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}


            {/* User-specific navigation - only show when logged in */}
            {user && (
              <>
                <Link
                  href="/cart"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Cart
                </Link>
                <Link
                  href="/wishlist"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Wishlist
                </Link>
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Orders
                </Link>
              </>
            )}
          </nav>


          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist - only show when logged in */}
            {user && (
              <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900">
                <Heart className="h-6 w-6" />
                {wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistItems}
                  </span>
                )}
              </Link>
            )}

            {/* Cart - only show when logged in */}
            {user && (
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingBag className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}


            {/* User Account */}
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-300 to-yellow-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-gray-700 font-medium">{user.name || 'Account'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-3 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-yellow-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/cart"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Cart</span>
                        {totalItems > 0 && (
                          <span className="ml-auto bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {totalItems}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 mr-3 text-gray-400" />
                        <span>My Wishlist</span>
                        {wishlistItems > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {wishlistItems}
                          </span>
                        )}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3 text-gray-400" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false)
                          await signOut()
                          window.location.href = '/'
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button
                    className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            {/* Mobile Search */}
            <div className="px-4 mb-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            <div className="flex flex-col space-y-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}


              {/* User-specific mobile navigation */}
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/cart"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Cart
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Wishlist
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false)
                      await signOut()
                      window.location.href = '/'
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:text-red-800 font-medium"
                  >
                    Sign Out
                  </button>
                </>
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