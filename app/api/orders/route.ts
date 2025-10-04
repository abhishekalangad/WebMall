import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { getMockOrders } from '@/lib/mock-data'

function isSupabaseConfigured(): boolean {
  // Temporarily disable Supabase to use mock data only
  return false
  
  // Original check (uncomment when database is ready):
  // return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
  //          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
}

async function getCurrentAuthUser() {
  if (!isSupabaseConfigured()) {
    return { id: '1', email: 'admin@webmall.lk', role: 'admin' }
  }
  
  try {
    let response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/user`)
    const result = await response.json()
    return result.user
  } catch {
    return null
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(getMockOrders())
  }

  // Customer: list own orders; Admin: list all
  const user = await getCurrentAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const where = user.role === 'admin' ? {} : { userId: user.id }
  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Mock orders created automatically for demo' }, { status: 400 })
  }

  try {
    const user = await getCurrentAuthUser()
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