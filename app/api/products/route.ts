import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { getMockProducts, addMockProduct } from '@/lib/mock-data'

function isSupabaseConfigured(): boolean {
  // Temporarily disable Supabase to use mock data only
  return false
  
  // Original check (uncomment when database is ready):
  // return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
  //          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
}

async function getCurrentAuthUser() {
  if (!isSupabaseConfigured()) {
    // Mock auth user - assume admin for testing
    return { id: '1', email: 'admin@webmall.lk', role: 'admin' }
  }
  
  try {
    const response = await fetch('/api/auth/user')
    const result = await response.json()
    return result.user
  } catch {
    return null
  }
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(getMockProducts())
    }

    const products = await prisma.product.findMany({
      where: { status: 'active' },
      include: { images: true, variants: true, category: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, price, currency = 'LKR', categoryId, status = 'active', stock = 0, images = [], variants = [] } = body

    if (!isSupabaseConfigured()) {
      // Use mock data
      const mockCategory = { id: categoryId, name: 'Mock Category' }
      const newProduct = addMockProduct({
        name,
        slug,
        description,
        price,
        currency,
        categoryId,
        status,
        stock,
        category: mockCategory,
        images,
        variants
      })
      return NextResponse.json(newProduct, { status: 201 })
    }

    const created = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        currency,
        categoryId,
        status,
        stock,
        images: images.length ? { create: images.map((img: any) => ({ url: img.url, alt: img.alt ?? null, position: img.position ?? 0 })) } : undefined,
        variants: variants.length ? { create: variants.map((v: any) => ({ sku: v.sku, name: v.name, attributes: v.attributes ?? {}, priceOverride: v.priceOverride ?? null, stock: v.stock ?? 0 })) } : undefined,
      },
      include: { images: true, variants: true }
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}