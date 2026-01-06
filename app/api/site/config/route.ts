import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_SITE_SETTINGS = {
    id: 'default',
    storeName: 'WebMall',
    tagline: 'Sri Lankan Fashion Accessories',
    description: 'Your premier destination for Sri Lankan fashion accessories.',
    logoUrl: '/logo-no-bg.png',
    contactEmail: 'webmalll.ik@gmail.com',
    contactPhone: '+94 778973708',
    contactAddress: 'Colombo, Sri Lanka',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    shippingBaseRate: 500,
    freeShippingThreshold: 10000,
    headerNavigation: [],
    customerNavigation: []
}

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Bracelets', slug: 'bracelets' },
    { id: '2', name: 'Necklaces', slug: 'necklaces' },
    { id: '3', name: 'Rings', slug: 'rings' }
]

export async function GET() {
    try {
        // Try to use Prisma, but fall back to defaults if database is not available
        try {
            console.log('[Site Config] Attempting Prisma queries...')

            if (!prisma) {
                throw new Error('Prisma client is not initialized')
            }

            // 1. Fetch site settings (singleton)
            let settings = null

            // Now using typed Prisma client
            try {
                settings = await prisma.siteSettings.findUnique({
                    where: { id: 'default' }
                })

                // Create default settings if they don't exist
                if (!settings) {
                    console.log('[Site Config] Creating default settings')
                    settings = await prisma.siteSettings.create({
                        data: {
                            id: 'default',
                            storeName: 'WebMall'
                        }
                    })
                }
            } catch (e: any) {
                console.error('[Site Config] Error fetching siteSettings:', e.message)
            }

            // 2. Fetch active hero banners
            let banners: any[] = []
            try {
                banners = await prisma.heroBanner.findMany({
                    where: { isActive: true },
                    orderBy: { position: 'asc' }
                })
            } catch (e: any) {
                console.error('[Site Config] Error fetching heroBanners:', e.message)
            }

            // 3. Fetch categories
            let categories: any[] = []
            try {
                categories = await prisma.category.findMany({
                    orderBy: { name: 'asc' }
                })
            } catch (e: any) {
                console.error('[Site Config] Error fetching categories:', e.message)
            }

            return NextResponse.json({
                settings: settings ? {
                    ...settings,
                    // If DB has null, use empty array. If DB has data, use it.
                    headerNavigation: settings.headerNavigation ?? [],
                    customerNavigation: settings.customerNavigation ?? []
                } : DEFAULT_SITE_SETTINGS,
                banners: banners,
                categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400',
                },
            })
        } catch (prismaError: any) {
            console.error('[Site Config] Prisma error catch-all:', prismaError.message)
            return NextResponse.json({
                settings: DEFAULT_SITE_SETTINGS,
                banners: [],
                categories: DEFAULT_CATEGORIES
            })
        }
    } catch (error: any) {
        console.error('[Site Config] Unexpected server error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
