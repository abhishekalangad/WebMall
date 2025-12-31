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

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            const products = getMockProducts()
            const categories = getMockCategories()

            // Mock message stats
            const mockMessageStats = {
                new: 0,
                read: 0,
                replied: 0,
                total: 0
            }

            return NextResponse.json({
                stats: {
                    totalProducts: products.length,
                    activeProducts: products.filter(p => p.status === 'active').length,
                    totalCategories: categories.length,
                    activeCategories: categories.length,
                    totalUsers: 2, // Mock users count
                    newCustomers: 0,
                    totalSales: "LKR 43,250",
                    salesChange: "+12.5%",
                    totalOrders: 8,
                    activeOrders: 2,
                    pendingOrders: 1,
                    completedOrders: 5,
                    totalCoupons: 5,
                    activeCoupons: 3,
                    messageStats: mockMessageStats
                },
                recentActivity: [],
                topProducts: products.slice(0, 5)
            })
        }

        // Fetch actual counts from database
        const [
            totalProducts,
            activeProducts,
            totalCategories,
            totalUsers,
            totalOrders,
            pendingOrders,
            completedOrders,
        ] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'active' } }),
            prisma.category.count(),
            // Get all users - customers or users without explicit admin role
            prisma.user.count({
                where: {
                    NOT: {
                        role: 'admin'
                    }
                }
            }),
            prisma.order ? prisma.order.count() : Promise.resolve(0),
            prisma.order ? prisma.order.count({ where: { status: 'pending' } }) : Promise.resolve(0),
            prisma.order ? prisma.order.count({ where: { status: 'completed' } }) : Promise.resolve(0),
        ])

        // Get coupon counts (with expiry checking)
        const now = new Date()
        let totalCoupons = 0
        let activeCoupons = 0

        try {
            // @ts-ignore - coupon model might not exist yet
            if (prisma.coupon) {
                // @ts-ignore
                totalCoupons = await prisma.coupon.count()
                // @ts-ignore
                activeCoupons = await prisma.coupon.count({
                    where: {
                        isActive: true,
                        expiryDate: {
                            gte: now  // Only count coupons that haven't expired
                        }
                    }
                })
            }
        } catch (error) {
            console.log('Coupon model not available yet')
            // Fallback to 0 if coupon model doesn't exist
            totalCoupons = 0
            activeCoupons = 0
        }

        // Calculate sales (if orders exist)
        let totalSalesAmount = 0
        if (prisma.order) {
            const salesData = await prisma.order.aggregate({
                _sum: {
                    totalAmount: true
                },
                where: {
                    status: { not: 'cancelled' }
                }
            }).catch(() => ({ _sum: { totalAmount: 0 } }))

            totalSalesAmount = salesData?._sum?.totalAmount || 0
        }

        const totalSales = `LKR ${totalSalesAmount.toLocaleString()}`
        const activeOrders = totalOrders - completedOrders



        // Fetch message stats from contact API
        let messageStats = { new: 0, read: 0, replied: 0, total: 0 }
        try {
            const messagesResponse = await fetch(`${request.nextUrl.origin}/api/contact`)
            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json()
                messageStats = messagesData.stats || messageStats
            }
        } catch (error) {
            console.error('Error fetching message stats:', error)
        }

        // Get recent products
        const topProducts = await prisma.product.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stock: true
            }
        })

        return NextResponse.json({
            stats: {
                totalProducts,
                activeProducts,
                totalCategories,
                totalUsers,
                newCustomers: 0, // Calculate from user.createdAt if needed
                totalSales,
                salesChange: "+12.5%", // Calculate from previous period if needed
                totalOrders,
                activeOrders,
                pendingOrders,
                completedOrders,
                totalCoupons,
                activeCoupons,
                messageStats
            },
            topProducts
        })
    } catch (error: any) {
        console.error('Admin analytics error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
