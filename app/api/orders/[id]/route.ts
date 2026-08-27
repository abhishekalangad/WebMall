import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'
import { isValidStatusTransition } from '@/lib/order-state'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return apiError('Unauthorized', 401)

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, role: true }
    })

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        couponUsage: {
          include: { coupon: true }
        }
      }
    })

    if (!order) return apiError('Order not found', 404)

    // IDOR Check: Ensure user owns the order or is admin
    if (user.role !== 'admin' && order.userId !== dbUser?.id) {
      return apiError('Forbidden', 403)
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch order', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user || user.role !== 'admin') {
      return apiError('Forbidden - Admin access required', 403)
    }

    const body = await request.json()
    const { status: newStatus } = body

    if (!newStatus) return apiError('Status is required', 400)

    // Execute state transition & optional stock restoration in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!existingOrder) throw new Error('Order not found')

      if (existingOrder.status === newStatus) {
        return existingOrder
      }

      if (!isValidStatusTransition(existingOrder.status, newStatus)) {
        throw new Error(`Invalid status transition from "${existingOrder.status}" to "${newStatus}"`)
      }

      // If transitioning to cancelled or refunded, restore item inventory
      if ((newStatus === 'cancelled' || newStatus === 'refunded') &&
          existingOrder.status !== 'cancelled' && existingOrder.status !== 'refunded') {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } }
            })
          }
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            })
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: newStatus },
        include: { items: true }
      })
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    return apiError(error.message || 'Failed to update order status', 400)
  }
}
