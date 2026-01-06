import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params

        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                code,
                discountType,
                discountValue,
                expiryDate: new Date(expiryDate),
                usageLimit,
                minimumOrder,
                status
            }
        })

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('Error updating coupon:', error)
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        await prisma.coupon.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting coupon:', error)
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }
}
