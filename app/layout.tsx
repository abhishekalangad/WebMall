import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SiteConfigProvider } from '@/contexts/SiteConfigContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: 'WebMall - Sri Lankan Fashion Accessories',
  description: 'Discover beautiful jewelry, bags, and accessories from Sri Lanka. Shop unique fashion pieces with fast delivery.',
  keywords: 'sri lanka, fashion, accessories, jewelry, bags, phone covers, earrings, bangles',
  icons: {
    icon: '/logo-no-bg.png',
    shortcut: '/logo-no-bg.png',
    apple: '/logo-no-bg.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <SiteConfigProvider>
              <CartProvider>
                <WishlistProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <Toaster />
                  <Analytics />
                </WishlistProvider>
              </CartProvider>
            </SiteConfigProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
