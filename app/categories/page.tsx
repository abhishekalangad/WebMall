import { Metadata } from 'next'

export const revalidate = 3600 // revalidate at most every hour
import { prisma } from '@/lib/prisma'
import { CategoriesView } from './CategoriesView'

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Explore our diverse collection of Sri Lankan fashion accessories by category. Find the perfect jewelry, bags, and more.',
  openGraph: {
    title: 'Browse Categories | WebMall',
    description: 'Explore our diverse collection of Sri Lankan fashion accessories by category.',
  }
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  })

  return <CategoriesView categories={categories} />
}
