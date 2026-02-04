import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete in order
        const products = await prisma.product.deleteMany({})
        const categories = await prisma.category.deleteMany({})

        return NextResponse.json({
            success: true,
            message: 'Database cleared successfully',
            deleted: { products: products.count, categories: categories.count }
        })
    } catch (error: any) {
        console.error('[Clear DB] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
