import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Fetch products with their reviews
        const products = await prisma.product.findMany({
            where: { status: 'active' },
            include: {
                reviews: {
                    select: { rating: true }
                },
                images: {
                    orderBy: { position: 'asc' },
                    take: 1
                },
                category: true
            }
        })

        // Calculate average rating and sort
        const productsWithRating = products.map(p => {
            const totalRating = p.reviews.reduce((sum, r) => sum + r.rating, 0)
            const count = p.reviews.length
            const avg = count > 0 ? totalRating / count : 0
            return { ...p, price: Number(p.price), averageRating: avg, reviewCount: count }
        })

        // Sort by average rating (descENDING), then by review count, then by creation date
        productsWithRating.sort((a, b) => {
            if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
            if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        // Take top 8
        const featured = productsWithRating.slice(0, 8)

        return NextResponse.json(featured)
    } catch (error) {
        console.error('Error fetching featured products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch featured products' },
            { status: 500 }
        )
    }
}
