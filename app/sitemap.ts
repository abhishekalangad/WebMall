import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = SITE_URL

    // Fetch all products
    const products = await prisma.product.findMany({
        where: { status: 'active' },
        select: { slug: true, updatedAt: true },
    })

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    // Fetch all categories
    const categories = await prisma.category.findMany({
        select: { slug: true, createdAt: true },
    })

    const categoryUrls = categories.map((category) => ({
        url: `${baseUrl}/products?category=${category.slug}`,
        lastModified: category.createdAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }))

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/categories`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
    ]

    return [...staticPages, ...productUrls, ...categoryUrls]
}
