import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId, userId: bodyUserId, rating, comment } = body

        let targetUserId = bodyUserId

        // Optional: verify token if authorization header is present
        const authHeader = request.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            const authUser = await verifyAuthToken(token)
            if (authUser) {
                targetUserId = authUser.id
            }
        }

        if (!productId || !targetUserId || !rating) {
            return NextResponse.json(
                { error: 'Product ID, User ID and Rating are required' },
                { status: 400 }
            )
        }

        // Find user by either internal DB id OR Supabase auth ID
        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: targetUserId },
                    { supabaseId: targetUserId }
                ]
            }
        })

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User profile not found. Please log in again.' },
                { status: 404 }
            )
        }

        // Verify purchase: check if any order exists for this product
        const anyOrder = await prisma.order.findFirst({
            where: {
                userId: dbUser.id,
                items: {
                    some: {
                        productId: productId
                    }
                }
            }
        })

        if (!anyOrder) {
            return NextResponse.json(
                { error: 'You must have purchased this product to leave a review.' },
                { status: 403 }
            )
        }

        // Verify order is delivered
        const deliveredPurchase = await prisma.order.findFirst({
            where: {
                userId: dbUser.id,
                items: {
                    some: {
                        productId: productId
                    }
                },
                status: {
                    in: ['delivered', 'Delivered', 'DELIVERED', 'completed', 'Completed', 'COMPLETED']
                }
            }
        })

        if (!deliveredPurchase) {
            return NextResponse.json(
                { error: 'You can only leave a review after your order status is set to delivered.' },
                { status: 403 }
            )
        }

        // Check for existing review by this user for this product
        const existingReview = await prisma.review.findFirst({
            where: {
                userId: dbUser.id,
                productId
            }
        })

        if (existingReview) {
            const updated = await prisma.review.update({
                where: { id: existingReview.id },
                data: { rating, comment },
                include: {
                    user: {
                        select: { name: true, profileImage: true }
                    }
                }
            })
            return NextResponse.json(updated)
        }

        const review = await prisma.review.create({
            data: {
                productId,
                userId: dbUser.id,
                rating,
                comment
            },
            include: {
                user: {
                    select: { name: true, profileImage: true }
                }
            }
        })

        return NextResponse.json(review)

    } catch (error: any) {
        console.error('Error submitting review:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to submit review' },
            { status: 500 }
        )
    }
}

