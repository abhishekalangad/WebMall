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
            customerNavigation: settings.customerNavigation ?? [],
            aboutGalleryImages: (settings as any).aboutGalleryImages ?? []
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

            // 1. Fetch CURRENT settings to compare images
            const currentSettings = await prisma.siteSettings.findUnique({
                where: { id: 'default' },
                select: { aboutGalleryImages: true } as any
            })

            const oldImages: string[] = ((currentSettings as any)?.aboutGalleryImages as string[]) || []
            const newImages: string[] = (data.aboutGalleryImages as string[]) || []

            // 2. Identify images to delete (present in old but not in new)
            const imagesToDelete: string[] = oldImages.filter((img: string) => !newImages.includes(img))

            if (imagesToDelete.length > 0) {
                console.log('[Admin Settings POST] Deleting removed images from Supabase:', imagesToDelete)

                // We need to import supabaseAdmin or create a client here. 
                // Since this is server-side, we should use a service role if possible, 
                // but standard client might work if RLS allows or we use the right keys.
                // Assuming we can use the same pattern as in other routes.
                const { createClient } = require('@supabase/supabase-js')
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                // Use Service Role Key for deletion if available to bypass RLS, or Anon if user is authorized context
                // For safety/simplicity in this context let's try with the verified user context or just public deletion if policy allows.
                // NOTE: Best practice is using Service Role for admin actions.
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                })

                // Extract file paths from URLs
                // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[filename]
                // We need just [filename] or [folder/filename]

                const pathsToDelete = imagesToDelete.map((url: string) => {
                    try {
                        // Split by bucket name 'about-photos'
                        const parts = url.split('about-photos/')
                        if (parts.length > 1) return parts[1]
                        return null
                    } catch (e) {
                        return null
                    }
                }).filter(Boolean) as string[]

                if (pathsToDelete.length > 0) {
                    const { error: deleteError } = await supabaseAdmin
                        .storage
                        .from('about-photos')
                        .remove(pathsToDelete)

                    if (deleteError) {
                        console.error('[Admin Settings POST] Failed to delete images from storage:', deleteError)
                    } else {
                        console.log('[Admin Settings POST] Successfully deleted images from storage')
                    }
                }
            }

            // Ensure JSON fields are passed correctly (Prisma expects simple objects/arrays for Json types, not stringified)
            const { id, ...updateData } = data

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
                    aboutGalleryImages: data.aboutGalleryImages ?? [],
                } as any,
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
                    aboutGalleryImages: data.aboutGalleryImages ?? [],
                } as any
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
