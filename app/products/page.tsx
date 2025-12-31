import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductsView } from './ProductsView'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export const revalidate = 3600 // revalidate at most every hour

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const category = params.category as string
  const search = params.search as string

  let title = 'Our Collection'
  let description = 'Browse our full collection of Sri Lankan fashion accessories.'

  if (category) {
    const formattedCategory = category.charAt(0) ? category.charAt(0).toUpperCase() + category.slice(1) : category
    title = `${formattedCategory} Collection`
    description = `Explore the latest ${category} from our Sri Lankan fashion boutique.`
  } else if (search) {
    title = `Search results for "${search}"`
    description = `View all search results for ${search} at WebMall.`
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} | WebMall`,
      description,
    }
  }
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'active' },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  const categoryNames = ['All', ...categories.map((c: any) => c.name)]

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-400 mb-4" />
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsView
        initialProducts={products}
        initialCategories={categoryNames}
      />
    </Suspense>
  )
}
