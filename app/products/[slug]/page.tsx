import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductDetailView } from './ProductDetailView'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/constants'

export const revalidate = 3600 // revalidate at most every hour

export async function generateStaticParams() {
  // Gracefully handle missing database connection during build
  // This allows the build to pass on Vercel even if the database is not accessible during the build step
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not defined, skipping static generation for products.')
    return []
  }

  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      select: { slug: true },
      take: 100 // Pre-render the first 100 products
    })

    return products.map((product) => ({
      slug: product.slug,
    }))
  } catch (error) {
    console.warn('Failed to fetch products for static generation:', error)
    return []
  }
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: {
      category: true,
      images: {
        orderBy: { position: 'asc' },
        take: 1
      }
    }
  })

  if (!product) return { title: 'Product Not Found' }

  return {
    title: `${product.name} - Buy Online`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: `${product.name} | WebMall`,
      description: product.description.substring(0, 160),
      url: `${SITE_URL}/products/${product.slug}`,
      siteName: 'WebMall',
      images: [
        {
          url: product.images[0]?.url || '/og-image.png',
          width: 800,
          height: 600,
        },
      ],
      locale: 'en_LK',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: [product.images[0]?.url || '/og-image.png'],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  // Fetch product with reviews to calculate rating
  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: {
      category: true,
      images: {
        orderBy: { position: 'asc' }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Calculate rating stats
  const reviewCount = product.reviews.length
  const averageRating = reviewCount > 0
    ? product.reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviewCount
    : 0

  // Serialize Decimal to number for product price if needed (already likely handled by Prisma/JSON but specific fields might need check)
  // And construct the prop object
  const productWithRating = {
    ...product,
    price: Number(product.price),
    averageRating,
    reviewCount,
    reviews: product.reviews.map(r => ({
      ...r,
      user: r.user ? r.user : { name: 'Anonymous' } // Handle potential missing user relation
    }))
  }

  return <ProductDetailView product={productWithRating} />
}
