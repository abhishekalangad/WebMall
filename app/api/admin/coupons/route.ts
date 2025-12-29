import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'
import { getMockCoupons, addMockCoupon } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        // For now, always use mock data (can add Prisma later)
        const coupons = getMockCoupons()
        return NextResponse.json(coupons)
    } catch (error: any) {
        console.error('[Admin Coupons GET] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        const data = await request.json()

        // Validate required fields
        if (!data.code || !data.discountType || !data.discountValue || !data.expiryDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate discount value
        if (data.discountType === 'percentage' && (data.discountValue < 0 || data.discountValue > 100)) {
            return NextResponse.json({ error: 'Percentage discount must be between 0 and 100' }, { status: 400 })
        }

        if (data.discountValue <= 0) {
            return NextResponse.json({ error: 'Discount value must be positive' }, { status: 400 })
        }

        // Check if coupon code already exists
        const existingCoupons = getMockCoupons()
        if (existingCoupons.find(c => c.code.toUpperCase() === data.code.toUpperCase())) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
        }

        const newCoupon = addMockCoupon({
            code: data.code.toUpperCase(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            expiryDate: data.expiryDate,
            usageLimit: data.usageLimit || 999999,
            minimumOrder: data.minimumOrder || 0,
            status: data.status || 'active'
        })

        return NextResponse.json(newCoupon, { status: 201 })
    } catch (error: any) {
        console.error('[Admin Coupons POST] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
