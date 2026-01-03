'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 flex flex-col items-center justify-center px-4 text-center overflow-auto">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <Search className="h-12 w-12 text-pink-500" />
            </div>
            <h1 className="text-7xl sm:text-8xl font-playfair font-black text-gray-900 mb-4">
                404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                Page Not Found
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/">
                    <Button className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                        <Home className="mr-2 h-5 w-5" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
