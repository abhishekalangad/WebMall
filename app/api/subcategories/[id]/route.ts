import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth-server'

// GET single subcategory
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const subcategory = await prisma.subcategory.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        })

        if (!subcategory) {
            return NextResponse.json(
                { error: 'Subcategory not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(subcategory)
    } catch (error: any) {
        console.error('Error fetching subcategory:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch subcategory' },
            { status: 500 }
        )
    }
}

// PUT update subcategory
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { name, slug, description, image, categoryId } = body

        // Check for duplicate slug within the same category (excluding current subcategory)
        if (slug && categoryId) {
            const existing = await prisma.subcategory.findFirst({
                where: {
                    categoryId,
                    slug,
                    NOT: {
                        id
                    }
                }
            })

            if (existing) {
                return NextResponse.json(
                    { error: 'A subcategory with this slug already exists in this category' },
                    { status: 400 }
                )
            }
        }

        const subcategory = await prisma.subcategory.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(slug !== undefined && { slug }),
                ...(description !== undefined && { description }),
                ...(image !== undefined && { image }),
                ...(categoryId !== undefined && { categoryId })
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        })

        return NextResponse.json(subcategory)
    } catch (error: any) {
        console.error('Error updating subcategory:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update subcategory' },
            { status: 500 }
        )
    }
}

// DELETE subcategory
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Check if subcategory has products
        const subcategory = await prisma.subcategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        })

        if (!subcategory) {
            return NextResponse.json(
                { error: 'Subcategory not found' },
                { status: 404 }
            )
        }

        if (subcategory._count.products > 0) {
            return NextResponse.json(
                { error: `Cannot delete subcategory with ${subcategory._count.products} products` },
                { status: 400 }
            )
        }

        await prisma.subcategory.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Subcategory deleted successfully'
        })
    } catch (error: any) {
        console.error('Error deleting subcategory:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete subcategory' },
            { status: 500 }
        )
    }
}
