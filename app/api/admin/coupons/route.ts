import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('Error fetching coupons:', error)
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { code, discountType, discountValue, expiryDate, usageLimit, minimumOrder, status } = body

        // Validate unique code
        const existing = await prisma.coupon.findUnique({
            where: { code }
        })
        if (existing) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                discountType,
                discountValue,
                expiryDate: new Date(expiryDate),
                usageLimit: usageLimit || 100,
                minimumOrder: minimumOrder || 0,
                status: status || 'active'
            }
        })

        return NextResponse.json(coupon)
    } catch (error: any) {
        console.error('Error creating coupon:', error)
        return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 })
    }
}
