'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Facebook, Instagram, Twitter, Mail, Phone, MapPin,
  Send, ChevronRight, Sparkles,
  Shield, CheckCircle
} from 'lucide-react'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Footer() {
  const { settings, categories, loading } = useSiteConfig()
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubscribed(true)
    setEmail('')
    setIsSubmitting(false)

    setTimeout(() => setIsSubscribed(false), 5000)
  }

  const quickLinks = [
    { href: '/products', label: 'All Products' },
    { href: '/orders', label: 'Track Order' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ]

  const customerService = [
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns' },
    { href: '/payment', label: 'Payment Methods' },
    { href: '/faq', label: 'Help Center' },
  ]

  const socialLinks = [
    { url: settings?.facebookUrl, icon: Facebook, label: 'Facebook', color: 'hover:text-blue-400' },
    { url: settings?.instagramUrl, icon: Instagram, label: 'Instagram', color: 'hover:text-pink-400' },
    { url: settings?.twitterUrl, icon: Twitter, label: 'Twitter', color: 'hover:text-sky-400' },
  ].filter(link => link.url)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-96 h-96 bg-gray-700 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gray-600 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">

        {/* Newsletter Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="mb-10 md:mb-14"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 lg:p-10 border border-gray-700 shadow-2xl overflow-hidden relative"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/0 via-gray-700/20 to-gray-800/0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
              <div className="text-center md:text-left flex-1 w-full md:w-auto">
                <motion.div
                  className="flex items-center justify-center md:justify-start gap-2 mb-3"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkles className="h-5 w-5 text-gray-300 animate-pulse" />
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                    Join Our Exclusive Community
                  </h3>
                </motion.div>
                <p className="text-gray-400 text-xs md:text-sm lg:text-base max-w-md mx-auto md:mx-0 leading-relaxed">
                  Get early access to new collections, special offers, and insider news delivered straight to your inbox.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto md:min-w-[300px] lg:min-w-[380px]">
                <div className="flex flex-col xs:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-200 peer-focus:text-gray-300" />
                    <Input
                      type="email"
                      placeholder="Enter your email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting || isSubscribed}
                      className="peer pl-10 md:pl-11 pr-4 h-11 md:h-12 lg:h-14 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 rounded-xl md:rounded-2xl backdrop-blur-sm focus:bg-gray-700 focus:border-gray-500 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isSubscribed ? 'subscribed' : 'subscribe'}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full xs:w-auto"
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting || isSubscribed}
                        className={`w-full xs:w-auto h-11 md:h-12 lg:h-14 px-5 md:px-6 lg:px-8 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm lg:text-base transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 ${isSubscribed
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100'
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="h-4 w-4 mr-2 border-2 border-gray-900 border-t-transparent rounded-full"
                            />
                            Subscribing...
                          </>
                        ) : isSubscribed ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Subscribed!
                          </>
                        ) : (
                          <>
                            Subscribe
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 lg:flex lg:justify-between mb-10 md:mb-12"
        >

          {/* Brand Column */}
          <motion.div variants={itemVariants} className="lg:w-64 lg:flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-5 group">
              {loading ? (
                <div className="h-10 md:h-12 w-10 md:w-12 bg-gray-800 rounded animate-pulse" />
              ) : (
                <motion.img
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  src={settings?.logoUrl || '/logo-white.jpg'}
                  alt={settings?.storeName || 'WebMall'}
                  className="h-9 md:h-10 lg:h-12 w-auto object-contain"
                />
              )}
              <span className="text-xl md:text-2xl lg:text-3xl font-playfair font-bold text-white group-hover:text-gray-200 transition-colors">
                {loading ? '...' : (settings?.storeName || 'WebMall')}
              </span>
            </Link>

            {loading ? (
              <div className="space-y-2 mb-5">
                <div className="h-3 bg-gray-800 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-800 rounded w-4/5 animate-pulse" />
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-sm md:text-base mb-5 md:mb-6 leading-relaxed"
              >
                {settings?.description || 'Your premier destination for Sri Lankan fashion accessories. Discover unique jewelry, bags, and accessories that celebrate style and craftsmanship.'}
              </motion.p>
            )}

            {/* Social Links */}
            <div className="flex gap-2 md:gap-3">
              {socialLinks.map((social, idx) => (
                <motion.a
                  key={social.label}
                  href={social.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 md:p-3 bg-gray-800 rounded-lg md:rounded-xl border border-gray-700 text-gray-400 ${social.color} transition-all duration-300 hover:bg-gray-700 hover:border-gray-600 hover:shadow-lg`}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 md:h-5 md:w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Three Columns Container */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10 lg:flex lg:gap-16 xl:gap-20 2xl:gap-24">
            {/* Quick Links */}
            <motion.div variants={itemVariants}>
              <h3 className="font-bold text-base md:text-lg mb-4 md:mb-5">
                Quick Links
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {quickLinks.map((link) => (
                  <motion.li
                    key={link.href}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 text-sm md:text-base block"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                {categories.slice(0, 3).map((category) => (
                  <motion.li
                    key={category.id}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 text-sm md:text-base block"
                    >
                      {category.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Customer Service */}
            <motion.div variants={itemVariants}>
              <h3 className="font-bold text-base md:text-lg mb-4 md:mb-5">
                Customer Service
              </h3>
              <ul className="space-y-2 md:space-y-3">
                {customerService.map((link) => (
                  <motion.li
                    key={link.href}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 text-sm md:text-base block"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants}>
              <h3 className="font-bold text-base md:text-lg mb-4 md:mb-5">
                Get In Touch
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <motion.li whileHover={{ scale: 1.02 }} className="group">
                  <a
                    href={`mailto:${settings?.contactEmail || 'webmalll.ik@gmail.com'}`}
                    className="flex items-start gap-2 md:gap-3 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <motion.div
                      whileHover={{ rotate: 5 }}
                      className="p-1.5 md:p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-all duration-200 shrink-0"
                    >
                      <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-0.5 md:mb-1">Email</p>
                      <p className="text-xs md:text-sm lg:text-base break-all">{settings?.contactEmail || 'webmalll.ik@gmail.com'}</p>
                    </div>
                  </a>
                </motion.li>

                <motion.li whileHover={{ scale: 1.02 }} className="group">
                  <a
                    href={`tel:${settings?.contactPhone || '+94778973708'}`}
                    className="flex items-start gap-2 md:gap-3 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <motion.div
                      whileHover={{ rotate: 5 }}
                      className="p-1.5 md:p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-all duration-200 shrink-0"
                    >
                      <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-0.5 md:mb-1">Phone</p>
                      <p className="text-xs md:text-sm lg:text-base">{settings?.contactPhone || '+94 778973708'}</p>
                    </div>
                  </a>
                </motion.li>

                <motion.li whileHover={{ scale: 1.02 }} className="group">
                  <div className="flex items-start gap-2 md:gap-3 text-gray-400">
                    <div className="p-1.5 md:p-2 bg-gray-800 rounded-lg shrink-0">
                      <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-0.5 md:mb-1">Location</p>
                      <p className="text-xs md:text-sm lg:text-base">{settings?.contactAddress || 'Colombo, Sri Lanka'}</p>
                    </div>
                  </div>
                </motion.li>
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="border-t border-gray-800 pt-6 md:pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <motion.p
              whileHover={{ scale: 1.02 }}
              className="text-gray-400 text-xs md:text-sm order-2 md:order-1"
            >
              © {currentYear} {settings?.storeName || 'WebMall'}. All rights reserved.
            </motion.p>

            <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-6 order-1 md:order-2">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/cookies', label: 'Cookie Policy' },
              ].map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-xs md:text-sm transition-all duration-200 hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
