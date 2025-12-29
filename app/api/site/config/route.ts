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

            // 1. Fetch site settings (singleton)
            let settings = await prisma.siteSettings.findUnique({
                where: { id: 'default' }
            })

            // Create default settings if they don't exist
            if (!settings) {
                settings = await prisma.siteSettings.create({
                    data: { id: 'default' }
                })
            }

            // 2. Fetch active hero banners
            const banners = await prisma.heroBanner.findMany({
                where: { isActive: true },
                orderBy: { position: 'asc' }
            })

            // 3. Fetch categories
            const categories = await prisma.category.findMany({
                orderBy: { name: 'asc' }
            })

            console.log('[Site Config] Prisma queries successful')
            return NextResponse.json({
                settings,
                banners,
                categories
            })
        } catch (prismaError: any) {
            console.error('[Site Config] Prisma error:', prismaError.message)
            console.log('[Site Config] Falling back to mock mode')

            // Fall back to mock data if Prisma fails
            return NextResponse.json({
                settings: getMockSiteSettings(),
                banners: [],
                categories: getMockCategories()
            })
        }
    } catch (error: any) {
        console.error('[Site Config] Unexpected error:', error)
        return NextResponse.json({ error: 'Failed to fetch site configuration' }, { status: 500 })
    }
}
