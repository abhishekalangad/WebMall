import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'
import { z } from 'zod'

// Validation schema
const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Admin sees all orders, users see only their orders
    const where = user.role === 'admin' ? {} : { userId: user.id }

    // Get total count for pagination metadata
    const totalCount = await prisma.order.count({ where })

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

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
    const itemsWithPrices = items.map((i: any) => {
      const p = products.find(pr => pr.id === i.productId)
      if (!p) throw new Error('Invalid product')
      const price = Number(p.price)
      const total = price * i.quantity
      return { productId: i.productId, quantity: i.quantity, price, total }
    })

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
      // Create the order
      const order = await tx.order.create({
        data: {
          userId: dbUser.id,
          orderNumber: `ORD-${Date.now()}`,
          status: 'pending',
          totalAmount,
          currency: 'LKR',
          paymentMethod,
          shippingAddress,
          notes: notes ?? null,
          items: { create: itemsWithPrices }
        },
        include: { items: true }
      })

      // Update stock for each product
      // Update stock for each product with atomic check
      for (const item of itemsWithPrices) {
        // Use updateMany because it allows "where" with non-unique fields (though id is unique)
        // enabling the stock >= quantity check. Standard update() only allows unique where.
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity } // Atomic check: stock must be >= quantity
          },
          data: { stock: { decrement: item.quantity } }
        })

        if (result.count === 0) {
          throw new Error(`Insufficient stock for product ID ${item.productId} during processing`)
        }
      }

      return order
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
