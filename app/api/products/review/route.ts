import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'
import { reviewSchema } from '@/lib/validations'
import { apiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Unauthorized - Login required to post a review', 401)
        }

        const token = authHeader.split(' ')[1]
        const authUser = await verifyAuthToken(token)

        if (!authUser) {
            return apiError('Unauthorized - Invalid or expired token', 401)
        }

        const body = await request.json()
        const parseResult = reviewSchema.safeParse(body)

        if (!parseResult.success) {
            return apiError('Validation failed', 400, parseResult.error.format())
        }

        const { productId, rating, comment } = parseResult.data

        // Find user record strictly bound to authenticated Supabase user
        const dbUser = await prisma.user.findUnique({
            where: { supabaseId: authUser.id }
        })

        if (!dbUser) {
            return apiError('User profile not found. Please log in again.', 404)
        }

        // Verify purchase: check if any order exists for this product
        const anyOrder = await prisma.order.findFirst({
            where: {
                userId: dbUser.id,
                items: {
                    some: { productId }
                }
            }
        })

        if (!anyOrder) {
            return apiError('You must have purchased this product to leave a review.', 403)
        }

        // Verify order is delivered
        const deliveredPurchase = await prisma.order.findFirst({
            where: {
                userId: dbUser.id,
                items: {
                    some: { productId }
                },
                status: {
                    in: ['delivered', 'Delivered', 'DELIVERED', 'completed', 'Completed', 'COMPLETED']
                }
            }
        })

        if (!deliveredPurchase) {
            return apiError('You can only leave a review after your order status is set to delivered.', 403)
        }

        // Upsert review for this user and product
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

        return NextResponse.json(review, { status: 201 })
    } catch (error: any) {
        return apiError(error.message || 'Failed to submit review', 500)
    }
}
