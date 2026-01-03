import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuthToken } from '@/lib/auth'

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

        const prisma = new PrismaClient()
        try {
            // Use Raw SQL to bypass outdated Prisma Client schema cache
            const result: any[] = await prisma.$queryRaw`SELECT * FROM public.site_settings WHERE id = 'default' LIMIT 1`

            if (result.length === 0) {
                return NextResponse.json(DEFAULT_SITE_SETTINGS)
            }

            const row = result[0]
            // Map snake_case database columns back to camelCase for the frontend
            const settings = {
                id: row.id,
                storeName: row.store_name,
                tagline: row.tagline,
                description: row.description,
                logoUrl: row.logo_url,
                contactEmail: row.contact_email,
                contactPhone: row.contact_phone,
                contactAddress: row.contact_address,
                facebookUrl: row.facebook_url,
                instagramUrl: row.instagram_url,
                instagramUrl2: row.instagram_url_2,
                twitterUrl: row.twitter_url,
                shippingBaseRate: Number(row.shipping_base_rate),
                freeShippingThreshold: Number(row.free_shipping_threshold),
                headerNavigation: row.header_navigation,
                customerNavigation: row.customer_navigation,
                updatedAt: row.updated_at
            }
            return NextResponse.json(settings)
        } finally {
            await prisma.$disconnect()
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
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: user ? 'Admin access required' : 'Authentication failed',
                userRole: user?.role
            }, { status: 403 })
        }

        const data = await request.json()
        const prisma = new PrismaClient()

        try {
            console.log('[Admin Settings POST] Executing Raw Upsert...')

            // Manually map fields for Raw SQL
            // Ensure headerNavigation and customerNavigation are stringified JSON for the query parameter
            const headerNavJson = data.headerNavigation ? JSON.stringify(data.headerNavigation) : '[]'
            const customerNavJson = data.customerNavigation ? JSON.stringify(data.customerNavigation) : '[]'

            // We use parameterized query for safety
            await prisma.$executeRaw`
                INSERT INTO public.site_settings (
                    id, 
                    store_name, 
                    tagline, 
                    description, 
                    logo_url, 
                    contact_email, 
                    contact_phone, 
                    contact_address, 
                    facebook_url, 
                    instagram_url, 
                    instagram_url_2, 
                    twitter_url, 
                    shipping_base_rate, 
                    free_shipping_threshold, 
                    header_navigation,
                    customer_navigation,
                    updated_at
                ) VALUES (
                    'default',
                    ${data.storeName},
                    ${data.tagline},
                    ${data.description},
                    ${data.logoUrl},
                    ${data.contactEmail},
                    ${data.contactPhone},
                    ${data.contactAddress},
                    ${data.facebookUrl},
                    ${data.instagramUrl},
                    ${data.instagramUrl2},
                    ${data.twitterUrl},
                    ${Number(data.shippingBaseRate)},
                    ${Number(data.freeShippingThreshold)},
                    ${headerNavJson}::jsonb,
                    ${customerNavJson}::jsonb,
                    NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    store_name = EXCLUDED.store_name,
                    tagline = EXCLUDED.tagline,
                    description = EXCLUDED.description,
                    logo_url = EXCLUDED.logo_url,
                    contact_email = EXCLUDED.contact_email,
                    contact_phone = EXCLUDED.contact_phone,
                    contact_address = EXCLUDED.contact_address,
                    facebook_url = EXCLUDED.facebook_url,
                    instagram_url = EXCLUDED.instagram_url,
                    instagram_url_2 = EXCLUDED.instagram_url_2,
                    twitter_url = EXCLUDED.twitter_url,
                    shipping_base_rate = EXCLUDED.shipping_base_rate,
                    free_shipping_threshold = EXCLUDED.free_shipping_threshold,
                    header_navigation = EXCLUDED.header_navigation,
                    customer_navigation = EXCLUDED.customer_navigation,
                    updated_at = NOW();
            `

            console.log('[Admin Settings POST] Raw Upsert successful')

            // Return the input data as confirmation (since raw query doesn't return the row easily without RETURNING clause and parsing)
            return NextResponse.json(data)

        } catch (prismaError: any) {
            console.error('[Admin Settings POST] Raw SQL error:', prismaError.message)
            return NextResponse.json({ error: `Database Error: ${prismaError.message}` }, { status: 500 })
        } finally {
            await prisma.$disconnect()
        }
    } catch (error: any) {
        console.error('[Admin Settings POST] Unexpected error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
