import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        // Require authentication for coupon usage
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'You must be logged in to use coupons' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
        }

        const { code, orderTotal } = await request.json()

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
        }

        if (!orderTotal || orderTotal <= 0) {
            return NextResponse.json({ error: 'Invalid order total' }, { status: 400 })
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        })

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
        }

        // Validate coupon status
        const now = new Date()
        const expiryDate = new Date(coupon.expiryDate)

        if (coupon.status !== 'active') {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
        }

        if (expiryDate < now) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
        }

        if (coupon.timesUsed >= coupon.usageLimit) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
        }

        // Get user's usage count for this coupon
        const userUsageCount = await prisma.couponUsage.count({
            where: {
                couponId: coupon.id,
                userEmail: user.email
            }
        })

        // Check per-user usage limits (email-based to prevent account deletion bypass)
        if (coupon.usageType === 'one_per_user') {
            if (userUsageCount > 0) {
                return NextResponse.json({
                    error: 'You have already used this coupon'
                }, { status: 400 })
            }
        } else if (userUsageCount >= coupon.maxUsesPerUser) {
            return NextResponse.json({
                error: `You have reached the maximum usage limit for this coupon`
            }, { status: 400 })
        }

        // Check minimum order requirement
        if (orderTotal < coupon.minimumOrder) {
            return NextResponse.json({
                error: `Minimum order of LKR ${coupon.minimumOrder.toLocaleString()} required`
            }, { status: 400 })
        }

        // Calculate discount
        let discountAmount = 0
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderTotal * coupon.discountValue) / 100
        } else {
            discountAmount = coupon.discountValue
        }

        // Ensure discount doesn't exceed order total
        discountAmount = Math.min(discountAmount, orderTotal)

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            discountAmount,
            finalTotal: orderTotal - discountAmount
        })
    } catch (error: any) {
        console.error('[Coupon Validate] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
