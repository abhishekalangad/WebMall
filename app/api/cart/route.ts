import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

// Helper to get or create dbUser and all cart IDs linked to user (handles both Supabase Auth UUID & DB User UUID)
async function getOrCreateUserCarts(supabaseId: string, email: string, name?: string, role?: string) {
    const dbUser = await prisma.user.upsert({
        where: { supabaseId },
        create: {
            supabaseId,
            email,
            name: name || email,
            role: role || 'customer'
        },
        update: {}
    })

    // Find all carts linked to dbUser.id or supabaseId
    let userCarts = await prisma.cart.findMany({
        where: {
            OR: [
                { userId: dbUser.id },
                { userId: supabaseId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    })

    let mainCart = userCarts[0]

    if (!mainCart) {
        mainCart = await prisma.cart.create({
            data: { userId: dbUser.id }
        })
        userCarts = [mainCart]
    }

    const cartIds = userCarts.map(c => c.id)
    return { dbUser, mainCart, cartIds }
}

// GET /api/cart - Fetch user's cart from database
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

        const { cartIds } = await getOrCreateUserCarts(user.id, user.email, user.name, user.role)

        // Query all cart items belonging to any cart associated with the user
        const rawItems = await prisma.cartItem.findMany({
            where: {
                cartId: { in: cartIds }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        stock: true,
                        images: {
                            take: 1,
                            orderBy: { position: 'asc' }
                        }
                    }
                },
                variant: {
                    select: {
                        id: true,
                        name: true,
                        attributes: true,
                        image: true,
                        images: true,
                        priceOverride: true,
                        stock: true
                    }
                }
            }
        })

        // Transform to CartItem format expected by frontend
        const cartItems = rawItems.map(item => {
            const productPrice = Number(item.product?.price || 0)
            const variantPrice = item.variant?.priceOverride ? Number(item.variant.priceOverride) : null
            const finalPrice = variantPrice !== null ? variantPrice : productPrice

            return {
                id: item.id,
                productId: item.productId!,
                variantId: item.variantId || undefined,
                name: item.product?.name || 'Unknown Product',
                price: finalPrice,
                originalPrice: productPrice > finalPrice ? productPrice : undefined,
                quantity: item.quantity,
                image: (item.variant?.images && item.variant.images.length > 0)
                    ? item.variant.images[0]
                    : (item.variant?.image || item.product?.images[0]?.url),
                slug: item.product?.slug || '',
                variantName: item.variantName || undefined,
                variantAttributes: item.variantAttributes as Record<string, string> || undefined,
                maxStock: item.variant ? item.variant.stock : item.product?.stock
            }
        })

        return NextResponse.json({ items: cartItems })
    } catch (error: any) {
        console.error('Error fetching cart:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/cart - Sync cart to database (merge local with server)
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
        const { items } = body

        const { mainCart, cartIds } = await getOrCreateUserCarts(user.id, user.email, user.name, user.role)

        const existingItems = await prisma.cartItem.findMany({
            where: { cartId: { in: cartIds } }
        })

        // Merge local cart items with server cart
        for (const item of items) {
            const existingItem = existingItems.find(i =>
                i.productId === item.productId &&
                (i.variantId || null) === (item.variantId || null)
            )

            if (existingItem) {
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: Math.max(existingItem.quantity, item.quantity),
                        variantName: item.variantName,
                        variantAttributes: item.variantAttributes
                    }
                })
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: mainCart.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        variantName: item.variantName,
                        variantAttributes: item.variantAttributes,
                        quantity: item.quantity
                    }
                })
            }
        }

        // Fetch updated cart items
        const rawItems = await prisma.cartItem.findMany({
            where: { cartId: { in: cartIds } },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        stock: true,
                        images: {
                            take: 1,
                            orderBy: { position: 'asc' }
                        }
                    }
                },
                variant: {
                    select: {
                        id: true,
                        name: true,
                        attributes: true,
                        image: true,
                        images: true,
                        priceOverride: true,
                        stock: true
                    }
                }
            }
        })

        const cartItems = rawItems.map(item => {
            const productPrice = Number(item.product?.price || 0)
            const variantPrice = item.variant?.priceOverride ? Number(item.variant.priceOverride) : null
            const finalPrice = variantPrice !== null ? variantPrice : productPrice

            return {
                id: item.id,
                productId: item.productId!,
                variantId: item.variantId || undefined,
                name: item.product?.name || 'Unknown Product',
                price: finalPrice,
                originalPrice: productPrice > finalPrice ? productPrice : undefined,
                quantity: item.quantity,
                image: (item.variant?.images && item.variant.images.length > 0)
                    ? item.variant.images[0]
                    : (item.variant?.image || item.product?.images[0]?.url),
                slug: item.product?.slug || '',
                variantName: item.variantName || undefined,
                variantAttributes: item.variantAttributes as Record<string, string> || undefined,
                maxStock: item.variant ? item.variant.stock : item.product?.stock
            }
        })

        return NextResponse.json({ items: cartItems })
    } catch (error: any) {
        console.error('Error syncing cart:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
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
        const { productId, quantity, action, variantId, variantName, variantAttributes } = body

        const { mainCart, cartIds } = await getOrCreateUserCarts(user.id, user.email, user.name, user.role)

        if (action === 'remove') {
            await prisma.cartItem.deleteMany({
                where: {
                    cartId: { in: cartIds },
                    productId: productId,
                    variantId: variantId || null
                }
            })
        } else if (action === 'add') {
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: { in: cartIds },
                    productId: productId,
                    variantId: variantId || null
                }
            })

            if (existingItem) {
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: quantity,
                        variantName: variantName,
                        variantAttributes: variantAttributes
                    }
                })
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: mainCart.id,
                        productId: productId,
                        variantId: variantId,
                        variantName: variantName,
                        variantAttributes: variantAttributes,
                        quantity: quantity
                    }
                })
            }
        } else if (action === 'update') {
            await prisma.cartItem.updateMany({
                where: {
                    cartId: { in: cartIds },
                    productId: productId,
                    variantId: variantId || null
                },
                data: {
                    quantity: quantity,
                    variantName: variantName,
                    variantAttributes: variantAttributes
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating cart:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/cart - Clear entire cart
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

        const { cartIds } = await getOrCreateUserCarts(user.id, user.email, user.name, user.role)

        await prisma.cartItem.deleteMany({
            where: { cartId: { in: cartIds } }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error clearing cart:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
