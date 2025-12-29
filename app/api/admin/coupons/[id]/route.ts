import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/auth'
import { updateMockCoupon, deleteMockCoupon, getMockCoupons } from '@/lib/mock-data'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params
        const data = await request.json()

        // Validate discount value if provided
        if (data.discountType === 'percentage' && data.discountValue && (data.discountValue < 0 || data.discountValue > 100)) {
            return NextResponse.json({ error: 'Percentage discount must be between 0 and 100' }, { status: 400 })
        }

        if (data.discountValue && data.discountValue <= 0) {
            return NextResponse.json({ error: 'Discount value must be positive' }, { status: 400 })
        }

        // Check if code is being changed and if it already exists
        if (data.code) {
            const existingCoupons = getMockCoupons()
            const duplicate = existingCoupons.find(c => c.id !== id && c.code.toUpperCase() === data.code.toUpperCase())
            if (duplicate) {
                return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
            }
            data.code = data.code.toUpperCase()
        }

        const updatedCoupon = updateMockCoupon(id, data)

        if (!updatedCoupon) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
        }

        return NextResponse.json(updatedCoupon)
    } catch (error: any) {
        console.error('[Admin Coupon PUT] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params
        const deleted = deleteMockCoupon(id)

        if (!deleted) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin Coupon DELETE] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
