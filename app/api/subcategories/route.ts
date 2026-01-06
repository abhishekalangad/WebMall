import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth-server'

// GET all subcategories or filter by category
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')

        const subcategories = await prisma.subcategory.findMany({
            where: categoryId ? { categoryId } : undefined,
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(subcategories)
    } catch (error: any) {
        console.error('Error fetching subcategories:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch subcategories' },
            { status: 500 }
        )
    }
}

// POST create new subcategory
export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { name, slug, description, image, categoryId } = body

        if (!name || !slug || !categoryId) {
            return NextResponse.json(
                { error: 'Name, slug, and categoryId are required' },
                { status: 400 }
            )
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            )
        }

        // Check for duplicate slug within the same category
        const existing = await prisma.subcategory.findFirst({
            where: {
                categoryId,
                slug
            }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'A subcategory with this slug already exists in this category' },
                { status: 400 }
            )
        }

        const subcategory = await prisma.subcategory.create({
            data: {
                name,
                slug,
                description,
                image,
                categoryId
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

        return NextResponse.json(subcategory, { status: 201 })
    } catch (error: any) {
        console.error('Error creating subcategory:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create subcategory' },
            { status: 500 }
        )
    }
}
