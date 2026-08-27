import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return apiError('Unauthorized', 401)

    // Pagination parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limitParam = searchParams.get('limit')
    const fetchAll = user.role === 'admin' && (!limitParam || limitParam === 'all')
    const limit = fetchAll ? undefined : Math.min(500, Math.max(1, parseInt(limitParam || '20')))
    const skip = fetchAll ? undefined : (page - 1) * (limit as number)

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

    const totalCount = await prisma.order.count({ where })

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
    })
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch orders', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return apiError('Unauthorized', 401)

    // Require email verification before placing orders
    if (!user.email_verified) {
      return apiError('Please verify your email before placing orders.', 403)
    }

    const json = await request.json()
    const parseResult = createOrderSchema.safeParse(json)

    if (!parseResult.success) {
      return apiError('Validation failed', 400, parseResult.error.format())
    }

    const { items, shippingAddress, notes, paymentMethod, couponCode } = parseResult.data

    // 🔒 IDEMPOTENCY: Check Idempotency-Key header to prevent duplicate checkout requests
    const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('x-idempotency-key')
    if (idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey },
        include: { items: true }
      })
      if (existingOrder) {
        return NextResponse.json({
          order: existingOrder,
          message: 'Order already placed',
          idempotent: true
        })
      }
    }

    // Fetch site settings for shipping calculation
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } })
    const freeShippingThreshold = settings?.freeShippingThreshold || 5000
    const shippingBaseRate = settings?.shippingBaseRate || 350

    // Upsert database user to ensure record exists
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

    // Execute order creation in transaction with retry handling
    let attempts = 0
    const maxAttempts = 3
    let createdOrder = null

    while (attempts < maxAttempts) {
      attempts++
      try {
        createdOrder = await prisma.$transaction(async (tx) => {
          // 1. Retrieve products and variants to calculate authoritative server-side prices & verify stock
          const productIds = items.map((i) => i.productId)
          const products = await tx.product.findMany({ where: { id: { in: productIds } } })

          const itemsWithPrices: {
            productId: string
            variantId: string | null
            variantName: string | null
            quantity: number
            price: number
            productName: string
            total: number
          }[] = []

          for (const item of items) {
            const product = products.find(p => p.id === item.productId)
            if (!product || product.status === 'deleted') {
              throw new Error(`Product "${product?.name || 'Item'}" is unavailable.`)
            }

            let price = Number(product.price)
            let variantName: string | null = null

            if (item.variantId) {
              const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId }
              })

              if (!variant) throw new Error(`Selected variant not found.`)
              if (variant.stock < item.quantity) {
                throw new Error(`Insufficient stock for variant "${variant.name}". Available: ${variant.stock}`)
              }

              if (variant.priceOverride) {
                price = Number(variant.priceOverride)
              }
              variantName = variant.name
            } else {
              if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}`)
              }
            }

            const itemTotal = price * item.quantity
            itemsWithPrices.push({
              productId: item.productId,
              variantId: item.variantId || null,
              variantName,
              quantity: item.quantity,
              price,
              productName: product.name,
              total: itemTotal
            })
          }

          // 2. Server-side subtotal calculation
          const subtotal = itemsWithPrices.reduce((sum, item) => sum + item.total, 0)

          // 3. Coupon validation & discount calculation inside transaction
          let discountAmount = 0
          let verifiedCoupon: any = null

          if (couponCode) {
            const codeUpper = couponCode.trim().toUpperCase()
            verifiedCoupon = await tx.coupon.findUnique({
              where: { code: codeUpper }
            })

            if (!verifiedCoupon || verifiedCoupon.status !== 'active') {
              throw new Error('Invalid or inactive coupon code.')
            }

            if (verifiedCoupon.expiryDate && new Date(verifiedCoupon.expiryDate) < new Date()) {
              throw new Error('Coupon has expired.')
            }

            if (subtotal < verifiedCoupon.minimumOrder) {
              throw new Error(`Minimum order of LKR ${verifiedCoupon.minimumOrder} required for this coupon.`)
            }

            if (verifiedCoupon.timesUsed >= verifiedCoupon.usageLimit) {
              throw new Error('Coupon usage limit reached.')
            }

            // Check per-user limit
            const userUsageCount = await tx.couponUsage.count({
              where: {
                couponId: verifiedCoupon.id,
                OR: [
                  { userId: dbUser.id },
                  { userEmail: user.email }
                ]
              }
            })

            if (verifiedCoupon.usageType === 'one_per_user' && userUsageCount >= 1) {
              throw new Error('You have already used this coupon.')
            }

            if (userUsageCount >= verifiedCoupon.maxUsesPerUser) {
              throw new Error(`Maximum per-user usage (${verifiedCoupon.maxUsesPerUser}) reached for this coupon.`)
            }

            // Calculate discount server-side
            if (verifiedCoupon.discountType === 'percentage') {
              discountAmount = Math.min(subtotal, (subtotal * verifiedCoupon.discountValue) / 100)
            } else {
              discountAmount = Math.min(subtotal, verifiedCoupon.discountValue)
            }
          }

          // 4. Shipping cost server-side
          const isFreeShipping = subtotal >= freeShippingThreshold
          const shippingCost = isFreeShipping ? 0 : shippingBaseRate

          const finalTotalAmount = Math.max(0, Math.floor(subtotal - discountAmount + shippingCost))

          // 5. Generate collision-resistant order number: ORD-YY-MM-XXXXXX
          const now = new Date()
          const year = now.getFullYear().toString().slice(-2)
          const month = (now.getMonth() + 1).toString().padStart(2, '0')
          const prefix = `ORD-${year}-${month}`

          const lastOrder = await tx.order.findFirst({
            where: { orderNumber: { startsWith: prefix } },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true }
          })

          let sequence = 1
          if (lastOrder?.orderNumber) {
            const parts = lastOrder.orderNumber.split('-')
            const lastSeq = parseInt(parts[parts.length - 1])
            if (!isNaN(lastSeq)) {
              sequence = lastSeq + 1
            }
          }

          // Add random jitter to sequence if retrying
          if (attempts > 1) {
            sequence += Math.floor(Math.random() * 10) + 1
          }

          const orderNumber = `${prefix}-${sequence.toString().padStart(6, '0')}`

          // 6. Create order
          const order = await tx.order.create({
            data: {
              userId: dbUser.id,
              orderNumber,
              status: 'pending',
              totalAmount: finalTotalAmount,
              currency: 'LKR',
              paymentMethod,
              shippingAddress,
              notes: notes ?? null,
              idempotencyKey: idempotencyKey || undefined,
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

          // 7. Atomic coupon usage recording & increment
          if (verifiedCoupon && discountAmount > 0) {
            await tx.couponUsage.create({
              data: {
                couponId: verifiedCoupon.id,
                userId: dbUser.id,
                userEmail: user.email,
                orderId: order.id,
                discountAmount
              }
            })

            const couponUpdate = await tx.coupon.updateMany({
              where: {
                id: verifiedCoupon.id,
                timesUsed: { lt: verifiedCoupon.usageLimit }
              },
              data: { timesUsed: { increment: 1 } }
            })

            if (couponUpdate.count === 0) {
              throw new Error('Coupon usage limit reached during concurrent check.')
            }
          }

          // 8. Atomic inventory updates
          for (const item of itemsWithPrices) {
            if (item.variantId) {
              const variantResult = await tx.productVariant.updateMany({
                where: {
                  id: item.variantId,
                  stock: { gte: item.quantity }
                },
                data: { stock: { decrement: item.quantity } }
              })

              if (variantResult.count === 0) {
                throw new Error(`Insufficient stock for variant of "${item.productName}".`)
              }

              // Keep aggregate product stock consistent
              await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: { gte: item.quantity }
                },
                data: { stock: { decrement: item.quantity } }
              })
            } else {
              const productResult = await tx.product.updateMany({
                where: {
                  id: item.productId,
                  stock: { gte: item.quantity }
                },
                data: { stock: { decrement: item.quantity } }
              })

              if (productResult.count === 0) {
                throw new Error(`Insufficient stock for "${item.productName}".`)
              }
            }
          }

          return order
        }, {
          maxWait: 10000,
          timeout: 30000
        })

        break // Success, exit retry loop
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err
      }
    }

    return NextResponse.json(createdOrder, { status: 201 })
  } catch (error: any) {
    return apiError(error.message || 'Failed to place order', 400)
  }
}
