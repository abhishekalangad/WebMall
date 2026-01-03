import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth'

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

    const products = await prisma.product.findMany({
      where,
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: 'desc' }
    })

    if (products.length === 0) {
      return NextResponse.json([])
    }

    // Get ratings for all products
    const productIds = products.map(p => p.id)
    const ratings: any[] = await prisma.$queryRaw`
      SELECT 
        product_id,
        AVG(rating)::numeric(3,2) as avg_rating,
        COUNT(*)::int as review_count
      FROM public.reviews
      WHERE product_id = ANY(${productIds}::uuid[])
      GROUP BY product_id
    `

    // Merge ratings with products
    const productsWithRatings = products.map(product => {
      const rating = ratings.find(r => r.product_id === product.id)
      return {
        ...product,
        avgRating: rating ? parseFloat(rating.avg_rating) : 0,
        reviewCount: rating ? rating.review_count : 0
      }
    })

    return NextResponse.json(productsWithRatings, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error: any) {
    console.error('[Products GET] Error:', error)
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
    console.error('[Products POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
