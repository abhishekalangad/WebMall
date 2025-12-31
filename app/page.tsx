import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { HomeView } from './HomeView'

export const revalidate = 3600 // revalidate at most every hour

export const metadata: Metadata = {
  title: 'WebMall - Sri Lankan Fashion & Accessories',
  description: 'Shop the latest in Sri Lankan fashion, jewelry, and accessories. Experience premium quality and fast delivery islandwide with WebMall.',
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
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

  return (
    <HomeView
      initialProducts={products}
      initialCategories={categories}
    />
  )
}