import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { HomeView } from './HomeView'
import { Product, Category } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'WebMall - Sri Lankan Fashion & Accessories',
  description: 'Shop the latest in Sri Lankan fashion, jewelry, and accessories. Experience premium quality and fast delivery islandwide with WebMall.',
}

export default async function HomePage() {
  // Gracefully handle missing database connection during build
  if (!process.env.DATABASE_URL) {
    return (
      <HomeView
        featuredProducts={[]}
        initialCategories={[]}
      />
    )
  }

  // We need to use extended types because include adds relations
  // But for now we'll just use basic types to satisfy the compiler 
  // and let the component handle the extra fields (it expects any or extended types)
  // Fetch featured products and categories in parallel
  let featuredProducts: any[] = []
  let categories: Category[] = []

  try {
    // 1. Fetch Categories
    const categoriesPromise = prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    // 2. Fetch Featured Products (Top Rated) using Raw SQL for performance
    // This avoids fetching ALL products to sort them in JS
    const featuredPromise = prisma.$queryRaw`
      SELECT
    p.id,
      p.name,
      p.slug,
      p.price,
      p.currency,
      p.stock,
      p.status,
      p.created_at as "createdAt", --Map snake_case to camelCase
    AVG(r.rating):: numeric(3, 2) as "avgRating",
      COUNT(r.id):: int as "reviewCount",
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_id = p.id
          AND o.status != 'cancelled'
        ) as "soldCount",
      (
        SELECT json_build_object('url', pi.url, 'alt', pi.alt)
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.position ASC
          LIMIT 1
        ) as "primaryImage",
      (
        SELECT json_build_object('name', c.name)
          FROM categories c
          WHERE c.id = p.category_id
        ) as "category"
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY "soldCount" DESC, "avgRating" DESC NULLS LAST, "reviewCount" DESC
      LIMIT 8
      `

    const [fetchedCategories, rawFeatured] = await Promise.all([
      categoriesPromise,
      featuredPromise
    ]) as [Category[], any[]]

    categories = fetchedCategories

    // Format raw results to match Product interface expected by components
    featuredProducts = rawFeatured.map(p => ({
      ...p,
      price: Number(p.price),
      images: p.primaryImage ? [p.primaryImage] : [],
      category: p.category,
      avgRating: Number(p.avgRating || 0),
      reviewCount: Number(p.reviewCount || 0)
    }))

  } catch (error) {
    console.warn('Failed to fetch home page data:', error)
  }

  return (
    <HomeView
      featuredProducts={featuredProducts}
      initialCategories={categories}
    />
  )
}