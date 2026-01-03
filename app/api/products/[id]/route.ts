import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log('[Product GET] Fetching product:', id)

    // Check if it's a UUID (for ID lookup) or slug (for slug lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const product = isUuid
      ? await prisma.product.findUnique({
        where: { id },
        include: { images: true, variants: true, category: true }
      })
      : await prisma.product.findUnique({
        where: { slug: id },
        include: { images: true, variants: true, category: true }
      })

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    console.log('[Product GET] Found product:', product.name)
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('[Product GET] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, price, currency, categoryId, status, stock } = body

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name, slug, description, price, currency, categoryId, status, stock,
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[Product PUT] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Product DELETE] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
