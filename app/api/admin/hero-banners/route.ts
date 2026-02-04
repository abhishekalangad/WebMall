import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const banners = await prisma.heroBanner.findMany({
            orderBy: { position: 'asc' }
        })

        return NextResponse.json(banners)
    } catch (error: any) {
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
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const data = await request.json()
        const { title, subtitle, imageUrl, ctaText, ctaLink, position, isActive, showBadge, showTopRated } = data

        const banner = await prisma.heroBanner.create({
            data: {
                title,
                subtitle,
                imageUrl,
                ctaText: ctaText || 'Shop Now',
                ctaLink: ctaLink || '/products',
                position: position || 0,
                isActive: isActive !== undefined ? isActive : true,
                showBadge: showBadge !== undefined ? showBadge : true,
                showTopRated: showTopRated !== undefined ? showTopRated : true
            }
        })

        return NextResponse.json(banner)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
