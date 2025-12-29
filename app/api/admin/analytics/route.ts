import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'
import { getMockProducts, getMockCategories } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!isSupabaseConfigured()) {
            const products = getMockProducts()
            const categories = getMockCategories()
            return NextResponse.json({
                stats: {
                    totalProducts: products.length,
                    activeProducts: products.filter(p => p.status === 'active').length,
                    totalCategories: categories.length,
                    totalUsers: 2, // Mock users count
                    totalSales: "LKR 43,000",
                    activeOrders: 1
                }
            })
        }

        // Fetch actual counts
        const [totalProducts, activeProducts, totalCategories, totalUsers] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.category.count(),
            prisma.user.count({ where: { role: 'customer' } })
        ])

        // For sales and orders, we'll return some baseline data if tables are empty
        // In a real app, you'd aggregate Order table data
        const totalSales = "LKR 0" // Placeholder until Order aggregation implemented
        const activeOrders = 0 // Placeholder until Order aggregation implemented

        return NextResponse.json({
            stats: {
                totalProducts,
                activeProducts,
                totalCategories,
                totalUsers,
                totalSales,
                activeOrders
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
