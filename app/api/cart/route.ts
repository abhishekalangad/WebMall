import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

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

        // Find or create cart for user
        let cart = await prisma.cart.findFirst({
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
                                images: {
                                    take: 1,
                                    orderBy: { position: 'asc' }
                                }
                            }
                        },
                        variant: {
                            select: {
                                name: true,
                                attributes: true,
                                image: true,
                                images: true,
                                priceOverride: true
                            }
                        }
                    }
                }
            }
        })

        if (!cart) {
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
            cart = await prisma.cart.create({
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
                                    image: true
                                }
                            }
                        }
                    }
                }
            })
        }

        // Transform to CartItem format expected by frontend
        const cartItems = cart.items.map(item => {
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
                variantAttributes: item.variantAttributes as Record<string, string> || undefined
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

        // Find or create cart
        let cart = await prisma.cart.findFirst({
            where: { user: { supabaseId: user.id } },
            include: { items: true }
        })

        if (!cart) {
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

            cart = await prisma.cart.create({
                data: { userId: dbUser.id },
                include: { items: true }
            })
        }

        // Merge local cart items with server cart
        // For each local item, either update or create
        for (const item of items) {
            const existingItem = cart.items.find(i =>
                i.productId === item.productId &&
                (i.variantId || null) === (item.variantId || null)
            )

            if (existingItem) {
                // Update quantity (use maximum from local and server)
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: Math.max(existingItem.quantity, item.quantity),
                        variantName: item.variantName,
                        variantAttributes: item.variantAttributes
                    }
                })
            } else {
                // Create new item
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        variantName: item.variantName,
                        variantAttributes: item.variantAttributes,
                        quantity: item.quantity
                    }
                })
            }
        }

        // Fetch updated cart
        const updatedCart = await prisma.cart.findUnique({
            where: { userId: user.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                images: {
                                    take: 1,
                                    orderBy: { position: 'asc' }
                                }
                            }
                        },
                        variant: {
                            select: {
                                name: true,
                                attributes: true,
                                image: true,
                                images: true,
                                priceOverride: true
                            }
                        }
                    }
                }
            }
        })

        // Transform to CartItem format
        const cartItems = updatedCart!.items.map(item => {
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
                variantAttributes: item.variantAttributes as Record<string, string> || undefined
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

        const cart = await prisma.cart.findFirst({
            where: { user: { supabaseId: user.id } }
        })

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
        }

        if (action === 'remove') {
            // Remove item from cart
            await prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id,
                    productId: productId,
                    variantId: variantId || null
                }
            })
        } else if (action === 'add') {
            // Add or update item
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
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
                        cartId: cart.id,
                        productId: productId,
                        variantId: variantId,
                        variantName: variantName,
                        variantAttributes: variantAttributes,
                        quantity: quantity
                    }
                })
            }
        } else if (action === 'update') {
            // Update quantity
            await prisma.cartItem.updateMany({
                where: {
                    cartId: cart.id,
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

        const cart = await prisma.cart.findFirst({
            where: { user: { supabaseId: user.id } }
        })

        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error clearing cart:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
