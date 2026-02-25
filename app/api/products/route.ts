import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const limitParam = searchParams.get('limit')
    // Admins can request all products by passing limit=all or being an admin without specifying a limit
    const fetchAll = isAdmin && (!limitParam || limitParam === 'all')
    const limit = fetchAll ? undefined : Math.min(500, Math.max(1, parseInt(limitParam || '20')))
    const skip = fetchAll ? undefined : (page - 1) * (limit as number)

    // Admins can see all products (including drafts), non-admins only see active products
    const where = isAdmin ? { status: { not: 'deleted' } } : { status: 'active' }

    // Get total count for pagination metadata
    const totalCount = await prisma.product.count({ where })
    const activeCount = await prisma.product.count({ where: isAdmin ? { status: 'active' } : { status: 'active' } })
    const lowStockCount = await prisma.product.count({ where: { ...where, stock: { lt: 5 } } })

    // Fetch products (all for admin, paginated for others)
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: { images: true, variants: true, category: true, subcategory: true },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate pagination metadata
    const effectiveLimit = limit ?? totalCount
    const totalPages = effectiveLimit > 0 ? Math.ceil(totalCount / effectiveLimit) : 1
    const hasNextPage = fetchAll ? false : page < totalPages
    const hasPrevPage = fetchAll ? false : page > 1

    if (products.length === 0) {
      return NextResponse.json({
        products: [],
        pagination: {
          page,
          limit,
          totalCount,
          activeCount,
          lowStockCount,
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
        activeCount,
        lowStockCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
    const {
      name,
      description,
      price,
      currency = 'LKR',
      categoryId,
      subcategoryId,
      status = 'active',
      stock = 0,
      images = [],
      variants = []
    } = body

    // Auto-generate a unique slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let counter = 1
    while (await prisma.product.findFirst({ where: { slug } })) {
      counter++
      slug = `${baseSlug}-${counter}`
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        currency,
        categoryId,
        subcategoryId: subcategoryId || null,
        status,
        stock,
        images: images.length ? { create: images.map((img: any) => ({ url: img.url, alt: img.alt ?? null, position: img.position ?? 0 })) } : undefined,
        variants: variants.length ? { create: variants.map((v: any) => ({ sku: v.sku, name: v.name, attributes: v.attributes ?? {}, priceOverride: v.priceOverride ?? null, stock: v.stock ?? 0, image: v.image, images: v.images || [] })) } : undefined,
      },
      include: { images: true, variants: true, category: true, subcategory: true }
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('[Products POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
