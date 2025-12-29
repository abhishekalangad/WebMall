import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = user.role === 'admin' ? {} : { userId: user.id }
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(orders)
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

    const body = await request.json()
    const { items, shippingAddress, notes, paymentMethod = 'cod' } = body

    // Calculate totals simple way; production should validate prices
    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const itemsWithPrices = items.map((i: any) => {
      const p = products.find(pr => pr.id === i.productId)
      if (!p) throw new Error('Invalid product')
      const price = p.price
      const total = price * i.quantity
      return { productId: i.productId, quantity: i.quantity, price, total }
    })
    const totalAmount = itemsWithPrices.reduce((s: number, i: any) => s + i.total, 0)

    const created = await prisma.order.create({
      data: {
        userId: user.id,
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
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
