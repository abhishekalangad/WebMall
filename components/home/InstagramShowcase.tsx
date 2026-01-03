'use client'

import React from 'react'
import { Instagram, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface InstagramShowcaseProps {
    instagramUrl1?: string
    instagramUrl2?: string
}

export function InstagramShowcase({ instagramUrl1, instagramUrl2 }: InstagramShowcaseProps) {
    if (!instagramUrl1 && !instagramUrl2) return null

    return (
        <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-2xl text-white mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
                        <Instagram className="h-8 w-8" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
                        Follow Us on Instagram
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stay updated with our latest collections, behind-the-scenes content, and exclusive offers. Join our growing community!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
                    {/* Account 1 */}
                    {instagramUrl1 && (
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center text-center h-full border border-gray-100">
                                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-100 to-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Instagram className="h-10 w-10 text-pink-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Main Store</h3>
                                <p className="text-gray-500 mb-6">Shop the main collection and daily updates.</p>
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold h-12 rounded-xl group-hover:shadow-lg transition-all" asChild>
                                    <a href={instagramUrl1} target="_blank" rel="noopener noreferrer">
                                        Following <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Account 2 */}
                    {instagramUrl2 && (
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center text-center h-full border border-gray-100">
                                <div className="w-20 h-20 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Instagram className="h-10 w-10 text-purple-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Exclusive Drops</h3>
                                <p className="text-gray-500 mb-6">Limited editions and special releases.</p>
                                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold h-12 rounded-xl group-hover:shadow-lg transition-all" asChild>
                                    <a href={instagramUrl2} target="_blank" rel="noopener noreferrer">
                                        Follow Backup <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
