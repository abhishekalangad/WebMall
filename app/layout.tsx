import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display, Dancing_Script, Great_Vibes } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Suspense } from 'react'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VerificationOverlay } from '@/components/auth/VerificationOverlay'
import { SiteConfigProvider } from '@/contexts/SiteConfigContext'
import { SITE_URL } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-cursive',
  display: 'swap',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-brand-cursive',
  display: 'swap',
})

// Note: The sitemap function is typically defined in a sitemap.ts file at the root of the app directory.
// Placing it here might not be the intended Next.js pattern for sitemaps.
// This implementation is a placeholder based on the provided snippet.
// A full sitemap implementation would require returning an array of sitemap entries.
// For example:
// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   const baseUrl = SITE_URL;
//   return [
//     {
//       url: baseUrl,
//       lastModified: new Date(),
//       changeFrequency: 'yearly',
//       priority: 1,
//     },
//     // ... other pages
//   ];
// }

export const metadata: Metadata = {
  title: {
    default: 'WebMall - Sri Lankan Fashion Accessories',
    template: '%s | WebMall'
  },
  description: 'Discover beautiful jewelry, bags, and accessories from Sri Lanka. Shop unique fashion pieces with fast delivery across the island.',
  keywords: ['sri lanka', 'fashion', 'accessories', 'jewelry', 'bags', 'phone covers', 'earrings', 'bangles', 'online shopping sri lanka'],
  authors: [{ name: 'WebMall Team' }],
  creator: 'WebMall',
  publisher: 'WebMall',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WebMall - Sri Lankan Fashion Accessories',
    description: 'Discover beautiful jewelry, bags, and accessories from Sri Lanka.',
    url: SITE_URL,
    siteName: 'WebMall',
    images: [
      {
        url: '/og-image.png', // User should provide this or I can generate a placeholder mention
        width: 1200,
        height: 630,
        alt: 'WebMall - Sri Lankan Fashion',
      },
    ],
    locale: 'en_LK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebMall - Sri Lankan Fashion Accessories',
    description: 'Discover beautiful jewelry, bags, and accessories from Sri Lanka.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo-no-bg.png',
    shortcut: '/logo-no-bg.png',
    apple: '/logo-no-bg.png',
  },
}

import { ScrollbarHandler } from '@/components/layout/ScrollbarHandler'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dancingScript.variable} ${greatVibes.variable}`}>
      <body className={inter.className} suppressHydrationWarning>
        <ScrollbarHandler />
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
                  <Suspense fallback={null}>
                    <VerificationOverlay />
                  </Suspense>
                  <Toaster />
                </WishlistProvider>
              </CartProvider>
            </SiteConfigProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
