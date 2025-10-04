import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { getMockProducts, updateMockProduct, deleteMockProduct } from '@/lib/mock-data'

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
}

async function getCurrentAuthUser() {
  if (!isSupabaseConfigured()) {
    return { id: '1', email: 'admin@webmall.lk', role: 'admin' }
  }
  
  try {
    let response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/user`)
    const result = await response.json()
    return result.user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isSupabaseConfigured()) {
      // Mock data lookup
      const products = getMockProducts()
      const product = products.find(p => p.id === params.id || p.slug === params.id)
      
      if (!product) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      
      return NextResponse.json(product)
    }

    // Check if it's a UUID (for ID lookup) or slug (for slug lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)
    
    const product = isUuid 
      ? await prisma.product.findUnique({
          where: { id: params.id },
          include: { images: true, variants: true, category: true }
        })
      : await prisma.product.findUnique({
          where: { slug: params.id },
          include: { images: true, variants: true, category: true }
        })

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, price, currency, categoryId, status, stock, images, variants } = body

    if (!isSupabaseConfigured()) {
      const updated = updateMockProduct(params.id, {
        name, slug, description, price, currency, categoryId, status, stock, images, variants
      })
      if (!updated) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json(updated)
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name, slug, description, price, currency, categoryId, status, stock,
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSupabaseConfigured()) {
      const success = deleteMockProduct(params.id)
      if (!success) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}