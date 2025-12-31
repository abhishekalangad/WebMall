import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { isSupabaseConfigured } from '@/lib/auth'
import { getMockSiteSettings, getMockCategories } from '@/lib/mock-data'

export async function GET() {
    try {
        if (!isSupabaseConfigured()) {
            console.log('[Site Config] Using mock mode (Supabase not configured)')
            return NextResponse.json({
                settings: getMockSiteSettings(),
                banners: [],
                categories: getMockCategories()
            })
        }

        // Try to use Prisma, but fall back to mock if database is not available
        try {
            console.log('[Site Config] Attempting Prisma queries...')

            if (!prisma) {
                throw new Error('Prisma client is not initialized')
            }

            // Log available models for debugging
            const prismaModels = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
            console.log('[Site Config] Available Prisma models:', prismaModels)

            // 1. Fetch site settings (singleton)
            let settings = null
            const prismaAny = prisma as any
            if (prismaAny.siteSettings) {
                try {
                    settings = await prismaAny.siteSettings.findUnique({
                        where: { id: 'default' }
                    })

                    // Create default settings if they don't exist
                    if (!settings) {
                        console.log('[Site Config] Creating default settings')
                        settings = await prismaAny.siteSettings.create({
                            data: { id: 'default' }
                        })
                    }
                } catch (e: any) {
                    console.error('[Site Config] Error fetching siteSettings:', e.message)
                }
            } else {
                console.warn('[Site Config] siteSettings model not found in Prisma client object keys')
            }

            // 2. Fetch active hero banners
            let banners: any[] = []
            if (prismaAny.heroBanner) {
                try {
                    banners = await prismaAny.heroBanner.findMany({
                        where: { isActive: true },
                        orderBy: { position: 'asc' }
                    })
                } catch (e: any) {
                    console.error('[Site Config] Error fetching heroBanners:', e.message)
                }
            } else {
                console.warn('[Site Config] heroBanner model not found in Prisma client object keys')
            }

            // 3. Fetch categories
            let categories: any[] = []
            if (prismaAny.category) {
                try {
                    categories = await prismaAny.category.findMany({
                        orderBy: { name: 'asc' }
                    })
                } catch (e: any) {
                    console.error('[Site Config] Error fetching categories:', e.message)
                }
            } else {
                console.warn('[Site Config] category model not found in Prisma client object keys')
            }

            console.log('[Site Config] Prisma queries successful (or partially skipped)')
            return NextResponse.json({
                settings: settings || getMockSiteSettings(),
                banners: banners,
                categories: categories.length > 0 ? categories : getMockCategories()
            })
        } catch (prismaError: any) {
            console.error('[Site Config] Prisma error catch-all:', prismaError.message)
            console.log('[Site Config] Falling back to mock mode')

            // Fall back to mock data if Prisma fails
            return NextResponse.json({
                settings: getMockSiteSettings(),
                banners: [],
                categories: getMockCategories()
            })
        }
    } catch (error: any) {
        console.error('[Site Config] Unexpected server error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
