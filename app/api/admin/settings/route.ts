import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'

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

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: user ? 'Admin access required' : 'Authentication failed',
                userRole: user?.role
            }, { status: 403 })
        }

        const settings = await prisma.siteSettings.findUnique({
            where: { id: 'default' }
        })

        if (!settings) {
            return NextResponse.json(DEFAULT_SITE_SETTINGS)
        }

        return NextResponse.json({
            ...settings,
            headerNavigation: settings.headerNavigation ?? [],
            customerNavigation: settings.customerNavigation ?? []
        })

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
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: user ? 'Admin access required' : 'Authentication failed',
                userRole: user?.role
            }, { status: 403 })
        }

        const data = await request.json()

        try {
            console.log('[Admin Settings POST] Executing Upsert...')

            // Ensure JSON fields are passed correctly (Prisma expects simple objects/arrays for Json types, not stringified)
            // But we must clean them from undefined
            const { id, ...updateData } = data

            // Clean up navigation fields if they are strings (some legacy behavior might do this)
            // though standard fetch sends them as objects. 
            // Prisma will handle them as Json Inputs.

            const settings = await prisma.siteSettings.upsert({
                where: { id: 'default' },
                update: {
                    storeName: data.storeName,
                    tagline: data.tagline,
                    description: data.description,
                    logoUrl: data.logoUrl,
                    contactEmail: data.contactEmail,
                    contactPhone: data.contactPhone,
                    contactAddress: data.contactAddress,
                    facebookUrl: data.facebookUrl,
                    instagramUrl: data.instagramUrl,
                    instagramUrl2: data.instagramUrl2,
                    twitterUrl: data.twitterUrl,
                    shippingBaseRate: Number(data.shippingBaseRate),
                    freeShippingThreshold: Number(data.freeShippingThreshold),
                    headerNavigation: data.headerNavigation ?? [],
                    customerNavigation: data.customerNavigation ?? [],
                },
                create: {
                    id: 'default',
                    storeName: data.storeName,
                    tagline: data.tagline,
                    description: data.description,
                    logoUrl: data.logoUrl,
                    contactEmail: data.contactEmail,
                    contactPhone: data.contactPhone,
                    contactAddress: data.contactAddress,
                    facebookUrl: data.facebookUrl,
                    instagramUrl: data.instagramUrl,
                    instagramUrl2: data.instagramUrl2,
                    twitterUrl: data.twitterUrl,
                    shippingBaseRate: Number(data.shippingBaseRate),
                    freeShippingThreshold: Number(data.freeShippingThreshold),
                    headerNavigation: data.headerNavigation ?? [],
                    customerNavigation: data.customerNavigation ?? [],
                }
            })

            console.log('[Admin Settings POST] Upsert successful')
            return NextResponse.json(settings)

        } catch (prismaError: any) {
            console.error('[Admin Settings POST] Prisma error:', prismaError.message)
            return NextResponse.json({ error: `Database Error: ${prismaError.message}` }, { status: 500 })
        }
    } catch (error: any) {
        console.error('[Admin Settings POST] Unexpected error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
