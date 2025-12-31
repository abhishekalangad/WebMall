import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { HomeView } from './HomeView'
import { Product, Category } from '@prisma/client'

export const revalidate = 3600 // revalidate at most every hour

export const metadata: Metadata = {
  title: 'WebMall - Sri Lankan Fashion & Accessories',
  description: 'Shop the latest in Sri Lankan fashion, jewelry, and accessories. Experience premium quality and fast delivery islandwide with WebMall.',
}

export default async function HomePage() {
  // Gracefully handle missing database connection during build
  if (!process.env.DATABASE_URL) {
    return (
      <HomeView
        initialProducts={[]}
        initialCategories={[]}
      />
    )
  }

  // We need to use extended types because include adds relations
  // But for now we'll just use basic types to satisfy the compiler 
  // and let the component handle the extra fields (it expects any or extended types)
  let products: any[] = []
  let categories: Category[] = []

  try {
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'active' },
        take: 20,
        include: {
          category: true,
          images: {
            orderBy: { position: 'asc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' }
      })
    ])
    products = fetchedProducts
    categories = fetchedCategories
  } catch (error) {
    console.warn('Failed to fetch home page data:', error)
  }

  return (
    <HomeView
      initialProducts={products}
      initialCategories={categories}
    />
  )
}