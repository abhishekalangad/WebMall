import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId, userId, rating, comment } = body

        if (!productId || !userId || !rating) {
            return NextResponse.json(
                { error: 'Product ID, User ID and Rating are required' },
                { status: 400 }
            )
        }

        // Verify purchase
        const purchase = await prisma.order.findFirst({
            where: {
                userId: userId,
                items: {
                    some: {
                        productId: productId
                    }
                },
                // status: 'delivered', // Optionally strictly check for delivered
            }
        })

        if (!purchase) {
            // For now, allow open ratings if strict purchase check is failing for testing
            // But based on requirement "customer is bought one product they should be able to rate", we should enforce it.
            // If debugging is hard, we can comment this out.
            // return NextResponse.json(
            //    { error: 'You must purchase the product to rate it' },
            //    { status: 403 }
            // )
            // Re-enable strict check:
            return NextResponse.json(
                { error: 'You must purchase the product to rate it' },
                { status: 403 }
            )
        }

        // Check for existing review
        const existingReview = await prisma.review.findFirst({
            where: {
                userId,
                productId
            }
        })

        if (existingReview) {
            // Allow update? OR block. Let's allow update.
            const updated = await prisma.review.update({
                where: { id: existingReview.id },
                data: { rating, comment }
            })
            return NextResponse.json(updated)
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId,
                rating,
                comment
            }
        })

        return NextResponse.json(review)

    } catch (error) {
        console.error('Error submitting review:', error)
        return NextResponse.json(
            { error: 'Failed to submit review' },
            { status: 500 }
        )
    }
}
