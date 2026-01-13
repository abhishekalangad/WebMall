import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

// GET /api/wishlist - Fetch user's wishlist from database
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find or create wishlist for user
        let wishlist = await prisma.wishlist.findFirst({
            where: { user: { supabaseId: user.id } },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                currency: true,
                                images: {
                                    take: 1,
                                    orderBy: { position: 'asc' }
                                },
                                category: {
                                    select: { name: true }
                                }
                            }
                        },
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                attributes: true,
                                priceOverride: true,
                                image: true
                            }
                        }
                    }
                }
            }
        })

        if (!wishlist) {
            // 🔧 FIX: Ensure user exists in public.users before creating wishlist
            // This handles cases where Supabase auth user hasn't been synced yet
            const dbUser = await prisma.user.upsert({
                where: { supabaseId: user.id },
                create: {
                    supabaseId: user.id,
                    email: user.email,
                    name: user.name || user.email,
                    role: user.role || 'customer'
                },
                update: {}
            })

            wishlist = await prisma.wishlist.create({
                data: { userId: dbUser.id },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    price: true,
                                    currency: true,
                                    images: {
                                        take: 1,
                                        orderBy: { position: 'asc' }
                                    },
                                    category: {
                                        select: { name: true }
                                    }
                                }
                            },
                            variant: {
                                select: {
                                    id: true,
                                    sku: true,
                                    name: true,
                                    attributes: true,
                                    priceOverride: true,
                                    image: true
                                }
                            }
                        }
                    }
                }
            })
        }

        // Transform to WishlistItem format expected by frontend
        const wishlistItems = wishlist.items.map(item => {
            const variant = item.variant
            const variantName = variant ? variant.name : undefined
            const variantAttributes = variant ? (variant.attributes as Record<string, string>) : undefined
            const price = variant?.priceOverride ? Number(variant.priceOverride) : Number(item.product?.price || 0)
            const image = variant?.image || item.product?.images[0]?.url

            return {
                id: item.id,
                productId: item.productId!,
                variantId: item.variantId,
                name: item.product?.name || 'Unknown Product',
                variantName,
                variantAttributes,
                price,
                currency: item.product?.currency || 'LKR',
                image,
                slug: item.product?.slug || '',
                category: item.product?.category?.name || 'Uncategorized',
                addedAt: item.createdAt.toISOString()
            }
        })

        return NextResponse.json({ items: wishlistItems })
    } catch (error: any) {
        console.error('Error fetching wishlist:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { productId, variantId } = body

        // Find or create wishlist
        let wishlist = await prisma.wishlist.findFirst({
            where: { user: { supabaseId: user.id } }
        })

        if (!wishlist) {
            const dbUser = await prisma.user.upsert({
                where: { supabaseId: user.id },
                create: {
                    supabaseId: user.id,
                    email: user.email,
                    name: user.name || user.email,
                    role: user.role || 'customer'
                },
                update: {}
            })
            wishlist = await prisma.wishlist.create({
                data: { userId: dbUser.id }
            })
        }

        // Check if item already exists (considering variant)
        const existingItem = await prisma.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId: productId,
                variantId: variantId || null
            }
        })

        if (existingItem) {
            return NextResponse.json({
                error: 'Item already in wishlist'
            }, { status: 400 })
        }

        // Add item to wishlist
        await prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                productId: productId,
                variantId: variantId || null
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error adding to wishlist:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/wishlist - Remove item from wishlist or clear entire wishlist
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const variantId = searchParams.get('variantId')

        const wishlist = await prisma.wishlist.findFirst({
            where: { user: { supabaseId: user.id } }
        })

        if (!wishlist) {
            return NextResponse.json({ success: true })
        }

        if (productId) {
            // Remove specific item (considering variant)
            await prisma.wishlistItem.deleteMany({
                where: {
                    wishlistId: wishlist.id,
                    productId: productId,
                    variantId: variantId || null
                }
            })
        } else {
            // Clear entire wishlist
            await prisma.wishlistItem.deleteMany({
                where: { wishlistId: wishlist.id }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error removing from wishlist:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
