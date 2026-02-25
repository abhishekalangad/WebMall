import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'
import { z } from 'zod'

// Validation schema
const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(8, 'Phone number is too short'),
    address: z.string().min(5, 'Address is too short'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    district: z.string().min(1, 'District is required'),
  }),
  paymentMethod: z.enum(['cod', 'cash', 'card']).default('cod'),
  notes: z.string().optional().nullable(),
  discountAmount: z.number().optional().default(0),
  couponCode: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pagination parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limitParam = searchParams.get('limit')
    // Admins can see all orders when no limit is specified
    const fetchAll = user.role === 'admin' && (!limitParam || limitParam === 'all')
    const limit = fetchAll ? undefined : Math.min(500, Math.max(1, parseInt(limitParam || '20')))
    const skip = fetchAll ? undefined : (page - 1) * (limit as number)

    // Admin sees all orders, users see only their orders
    let where: any = {}
    if (user.role !== 'admin') {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true }
      })

      if (!dbUser) {
        return NextResponse.json({ orders: [], pagination: { page, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } })
      }

      where = { userId: dbUser.id }
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.order.count({ where })

    // Fetch orders (all for admin, paginated for others)
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { position: 'asc' }
                }
              }
            },
            variant: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        couponUsage: {
          include: {
            coupon: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate pagination metadata
    const effectiveLimit = limit ?? totalCount
    const totalPages = effectiveLimit > 0 ? Math.ceil(totalCount / effectiveLimit) : 1
    const hasNextPage = fetchAll ? false : page < totalPages
    const hasPrevPage = fetchAll ? false : page > 1

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, {
      headers: {
        'X-Total-Count': totalCount.toString(),
        'X-Page': page.toString(),
        'X-Total-Pages': totalPages.toString(),
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Require email verification before placing orders
    if (!user.email_verified) {
      return NextResponse.json({
        error: 'Please verify your email before placing orders. Check your inbox for the verification link.'
      }, { status: 403 })
    }

    const json = await request.json()
    const parseResult = orderSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: parseResult.error.format()
      }, { status: 400 })
    }

    const { items, shippingAddress, notes, paymentMethod, discountAmount, couponCode } = parseResult.data

    // Fetch site settings for shipping logic
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } })
    const freeShippingThreshold = settings?.freeShippingThreshold || 5000
    const shippingBaseRate = settings?.shippingBaseRate || 350

    // Calculate totals simple way; production should validate prices
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

    // Validate stock availability for all items before processing
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`)
      }
    }

    // Validate stock and calculate items with prices
    const itemsWithPrices = await Promise.all(items.map(async (i: any) => {
      const p = products.find(pr => pr.id === i.productId)
      if (!p) throw new Error('Invalid product')

      let price = Number(p.price)
      let variantName = null

      // Handle variant logic if variantId is present
      if (i.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: i.variantId }
        })

        if (!variant) throw new Error(`Variant ${i.variantId} not found`)

        // Check variant stock
        if (variant.stock < i.quantity) {
          throw new Error(`Insufficient stock for variant "${variant.name}". Available: ${variant.stock}`)
        }

        // Use variant price override if available
        if (variant.priceOverride) {
          price = Number(variant.priceOverride)
        }

        variantName = variant.name
      }

      const total = price * i.quantity
      return {
        productId: i.productId,
        variantId: i.variantId,
        variantName: variantName,
        quantity: i.quantity,
        price,
        productName: p.name,
        total
      }
    }))

    // Calculate subtotal
    const subtotal = itemsWithPrices.reduce((s: number, i: any) => s + i.total, 0)

    // Apply shipping logic
    const isFreeShipping = subtotal >= freeShippingThreshold
    const shippingCost = isFreeShipping ? 0 : shippingBaseRate

    // Final total amount
    const totalAmount = subtotal - (discountAmount || 0) + shippingCost

    // 🔧 FIX: Ensure user exists in public.users before creating order
    // This handles cases where Supabase auth user hasn't been synced yet
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      create: {
        supabaseId: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.role || 'customer'
      },
      update: {} // No update needed, just ensure exists
    })

    // Create order and update stock in a transaction for data consistency
    const created = await prisma.$transaction(async (tx) => {
      // Generate sequential Order ID: ORD-YY-MM-XXXXXX
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const prefix = `ORD-${year}-${month}`

      // Find the last order with this prefix to increment sequence
      // Locking isn't strictly enforced here but unique constraint handles race conditions
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true }
      })

      let sequence = 1
      if (lastOrder && lastOrder.orderNumber) {
        const parts = lastOrder.orderNumber.split('-')
        const lastSeq = parseInt(parts[parts.length - 1])
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1
        }
      }

      const newOrderNumber = `${prefix}-${sequence.toString().padStart(6, '0')}`

      // Create the order
      const order = await tx.order.create({
        data: {
          userId: dbUser.id,
          orderNumber: newOrderNumber,
          status: 'pending',
          totalAmount,
          currency: 'LKR',
          paymentMethod,
          shippingAddress,
          notes: notes ?? null,
          items: {
            create: itemsWithPrices.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              variantName: item.variantName,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      })

      // Record coupon usage if a coupon was applied
      if (couponCode && discountAmount && discountAmount > 0) {
        // Find the coupon
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() }
        })

        if (coupon) {
          // Create usage record with email tracking to prevent account deletion bypass
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: dbUser.id,
              userEmail: user.email,
              orderId: order.id,
              discountAmount: discountAmount
            }
          })

          // Increment coupon usage count atomically
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { timesUsed: { increment: 1 } }
          })
        }
      }

      // Update stock for each product/variant with atomic check
      for (const item of itemsWithPrices) {
        if (item.variantId) {
          // Decrement variant stock
          const variantResult = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stock: { gte: item.quantity }
            },
            data: { stock: { decrement: item.quantity } }
          })

          if (variantResult.count === 0) {
            throw new Error(`Insufficient stock for ${item.productName} (${item.variantName})`)
          }

          // Optionally decrement main product stock if you track aggregate stock there
          // For now, assuming variants track their own stock and main product stock is just a cache or aggregate
          // But to be safe, if product has stock, decrement it too? 
          // Usually if variants exist, product.stock is sum of variants. 
          // I will decrement product stock as well to keep them in sync if that's the logic.
          // Based on schema, Product has stock and Variant has stock. 
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })
        } else {
          // Standard product stock decrement
          const result = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity }
            },
            data: { stock: { decrement: item.quantity } }
          })

          if (result.count === 0) {
            throw new Error(`Insufficient stock for ${item.productName}`)
          }
        }
      }

      return order
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
