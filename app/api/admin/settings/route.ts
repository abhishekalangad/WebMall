import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'
import { getMockSiteSettings, updateMockSiteSettings } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        console.log('[Admin Settings GET] Token:', token?.substring(0, 20) + '...')

        const user = await verifyAuthToken(token)
        console.log('[Admin Settings GET] User:', user ? `${user.email} (${user.role})` : 'null')

        if (!user || user.role !== 'admin') {
            console.log('[Admin Settings GET] Access denied')
            return NextResponse.json({
                error: user ? 'Admin access required' : 'Authentication failed',
                userRole: user?.role
            }, { status: 403 })
        }

        if (!isSupabaseConfigured()) {
            console.log('[Admin Settings GET] Using mock mode (Supabase not configured)')
            return NextResponse.json(getMockSiteSettings())
        }

        // Try to use Prisma, but fall back to mock if database is not available
        try {
            console.log('[Admin Settings GET] Attempting Prisma query...')
            const settings = await prisma.siteSettings.findUnique({
                where: { id: 'default' }
            })
            console.log('[Admin Settings GET] Prisma query successful')
            return NextResponse.json(settings || {})
        } catch (prismaError: any) {
            console.error('[Admin Settings GET] Prisma error:', prismaError.message)
            console.log('[Admin Settings GET] Falling back to mock mode')
            return NextResponse.json(getMockSiteSettings())
        }

    } catch (error: any) {
        console.error('[Admin Settings GET] Unexpected error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        console.log('[Admin Settings POST] Token:', token?.substring(0, 20) + '...')

        const user = await verifyAuthToken(token)
        console.log('[Admin Settings POST] User:', user ? `${user.email} (${user.role})` : 'null')

        if (!user || user.role !== 'admin') {
            console.log('[Admin Settings POST] Access denied')
            return NextResponse.json({
                error: user ? 'Admin access required' : 'Authentication failed',
                userRole: user?.role
            }, { status: 403 })
        }

        const data = await request.json()
        console.log('[Admin Settings POST] Received data:', Object.keys(data))

        if (!isSupabaseConfigured()) {
            console.log('[Admin Settings POST] Using mock mode (Supabase not configured)')
            const updated = updateMockSiteSettings(data)
            return NextResponse.json(updated)
        }

        // Try to use Prisma, but fall back to mock if database is not available
        try {
            // We only ever have one settings record
            // Remove fields that should not be manually updated
            const { id, updatedAt, ...sanitizedData } = data

            console.log('[Admin Settings POST] Attempting Prisma upsert...')
            const settings = await prisma.siteSettings.upsert({
                where: { id: 'default' },
                update: sanitizedData,
                create: {
                    id: 'default',
                    ...sanitizedData
                }
            })

            console.log('[Admin Settings POST] Prisma upsert successful')
            return NextResponse.json(settings)
        } catch (prismaError: any) {
            console.error('[Admin Settings POST] Prisma error:', prismaError.message)
            console.log('[Admin Settings POST] Falling back to mock mode')

            // Fall back to mock mode if Prisma fails
            const updated = updateMockSiteSettings(data)
            return NextResponse.json(updated)
        }
    } catch (error: any) {
        console.error('[Admin Settings POST] Unexpected error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
