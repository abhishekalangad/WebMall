'use client'

import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

export function Footer() {
  const { settings, categories, loading } = useSiteConfig()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={settings?.logoUrl || '/logo-white.jpg'}
                alt={settings?.storeName || 'WebMall'}
                className="h-10 w-auto object-contain"
              />
              <span className="text-2xl font-playfair font-bold">
                {loading ? '...' : (settings?.storeName || 'WebMall')}
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              {settings?.description || 'Your premier destination for Sri Lankan fashion accessories. Discover unique jewelry, bags, and accessories that celebrate style and craftsmanship.'}
            </p>
            <div className="flex space-x-4">
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-300 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-300 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-300 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <Link href={`/products?category=${category.slug}`} className="hover:text-white transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>


          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{settings?.contactEmail || 'webmalll.ik@gmail.com'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{settings?.contactPhone || '+94 778973708'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{settings?.contactAddress || 'Colombo, Sri Lanka'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} {settings?.storeName || 'WebMall'}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/shipping" className="text-gray-400 hover:text-white text-sm transition-colors">
                Shipping Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
