import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'

export async function POST(request: NextRequest) {
    try {
        const { code, orderTotal } = await request.json()

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
        }

        if (!orderTotal || orderTotal <= 0) {
            return NextResponse.json({ error: 'Invalid order total' }, { status: 400 })
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code }
        })

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
        }

        // Validate coupon
        const now = new Date()
        const expiryDate = new Date(coupon.expiryDate)

        if (coupon.status !== 'active') {
            return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
        }

        if (expiryDate < now) {
            return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
        }

        if (coupon.timesUsed >= coupon.usageLimit) {
            return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
        }

        if (orderTotal < coupon.minimumOrder) {
            return NextResponse.json({
                error: `Minimum order of LKR ${coupon.minimumOrder.toLocaleString()} required for this coupon`
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
