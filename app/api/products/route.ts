import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth-server'

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

    // Pagination parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Admins can see all products, non-admins only see active products (not deleted)
    const where = isAdmin ? {} : { status: { not: 'deleted' } }

    // Get total count for pagination metadata
    const totalCount = await prisma.product.count({ where })

    // Fetch paginated products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    if (products.length === 0) {
      return NextResponse.json({
        products: [],
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      })
    }

    // Get ratings for paginated products
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

    return NextResponse.json({
      products: productsWithRatings,
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Total-Count': totalCount.toString(),
        'X-Page': page.toString(),
        'X-Total-Pages': totalPages.toString(),
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
