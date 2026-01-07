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

    // Determine if we should center (only one account)
    const hasOneAccount = (instagramUrl1 && !instagramUrl2) || (!instagramUrl1 && instagramUrl2)

    return (
        <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden relative">
            {/* Animated Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header with animated icon */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-2xl text-white mb-6 shadow-2xl animate-[wiggle_1s_ease-in-out_infinite] hover:scale-110 transition-transform cursor-pointer">
                        <Instagram className="h-10 w-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4 hover:text-pink-600 transition-colors">
                        Follow Us on Instagram
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stay updated with our latest collections, behind-the-scenes content, and exclusive offers. Join our growing community!
                    </p>
                </div>

                {/* Cards Container - Center if only one account */}
                <div className={`grid gap-8 md:gap-12 ${hasOneAccount ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'}`}>
                    {/* Account 1 */}
                    {instagramUrl1 && (
                        <div className="group relative transform hover:scale-105 transition-all duration-300">
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-100 transition duration-500 animate-gradient-x"></div>
                            <div className="relative bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center h-full border border-gray-100 group-hover:border-pink-300 transition-all">
                                <div className="w-24 h-24 bg-gradient-to-tr from-yellow-100 to-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                                    <Instagram className="h-12 w-12 text-pink-600 group-hover:text-pink-700 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">Main Store</h3>
                                <p className="text-gray-500 mb-6 group-hover:text-gray-700 transition-colors">Shop the main collection and daily updates.</p>
                                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 group-hover:scale-105" asChild>
                                    <a href={instagramUrl1} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                        Follow Us <ExternalLink className="ml-2 h-4 w-4 animate-bounce" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Account 2 */}
                    {instagramUrl2 && (
                        <div className="group relative transform hover:scale-105 transition-all duration-300">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-100 transition duration-500 animate-gradient-x" style={{ animationDelay: '0.5s' }}></div>
                            <div className="relative bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center h-full border border-gray-100 group-hover:border-purple-300 transition-all">
                                <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                                    <Instagram className="h-12 w-12 text-purple-600 group-hover:text-purple-700 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Exclusive Drops</h3>
                                <p className="text-gray-500 mb-6 group-hover:text-gray-700 transition-colors">Limited editions and special releases.</p>
                                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 group-hover:scale-105" asChild>
                                    <a href={instagramUrl2} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                        Follow Us <ExternalLink className="ml-2 h-4 w-4 animate-bounce" />
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
