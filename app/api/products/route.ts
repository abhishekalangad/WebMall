import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'
import { getMockProducts, addMockProduct } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    // Check if admin is requesting to show all products
    const authHeader = request.headers.get('Authorization')
    let isAdmin = false

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const user = await verifyAuthToken(token)
      if (user?.role === 'admin') {
        isAdmin = true
      }
    }

    const where = isAdmin ? {} : { status: 'active' }

    if (!isSupabaseConfigured()) {
      const products = getMockProducts()
      const filtered = isAdmin ? products : products.filter(p => p.status === 'active')
      return NextResponse.json(filtered)
    }

    const products = await prisma.product.findMany({
      where,
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
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

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, price, currency = 'LKR', categoryId, status = 'active', stock = 0, images = [], variants = [] } = body

    if (!isSupabaseConfigured()) {
      const created = addMockProduct({
        name,
        slug,
        description,
        price,
        currency,
        categoryId,
        status: status as 'active' | 'inactive',
        stock,
        images: images.map((img: any) => ({ url: img.url, alt: img.alt, position: img.position ?? 0 })),
        variants: variants.map((v: any) => ({ id: Math.random().toString(), sku: v.sku, name: v.name, stock: v.stock })),
        category: { id: categoryId, name: 'Category' } // Simplified
      })
      return NextResponse.json(created, { status: 201 })
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        currency,
        categoryId,
        status,
        stock,
        images: images.length ? { create: images.map((img: any) => ({ url: img.url, alt: img.alt ?? null, position: img.position ?? 0 })) } : undefined,
        variants: variants.length ? { create: variants.map((v: any) => ({ sku: v.sku, name: v.name, attributes: v.attributes ?? {}, priceOverride: v.priceOverride ?? null, stock: v.stock ?? 0 })) } : undefined,
      },
      include: { images: true, variants: true }
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
