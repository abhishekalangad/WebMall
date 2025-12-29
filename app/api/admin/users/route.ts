import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'

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

        if (!isSupabaseConfigured()) {
            return NextResponse.json([
                { id: '1', email: 'admin@webmall.com', name: 'Admin User', role: 'admin', createdAt: new Date().toISOString(), _count: { orders: 0 } },
                { id: '2', email: 'customer@webmall.com', name: 'Customer User', role: 'customer', createdAt: new Date().toISOString(), _count: { orders: 2 } }
            ])
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { orders: true }
                }
            }
        })

        return NextResponse.json(users)
    } catch (error: any) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
