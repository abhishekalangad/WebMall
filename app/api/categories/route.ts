import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken, isSupabaseConfigured } from '@/lib/auth'
import { getMockCategories, addMockCategory } from '@/lib/mock-data'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getMockCategories())
    }
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, image } = body

    if (!isSupabaseConfigured()) {
      const created = addMockCategory({ name, slug, description, image })
      return NextResponse.json(created, { status: 201 })
    }

    const created = await prisma.category.create({ data: { name, slug, description, image } })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
