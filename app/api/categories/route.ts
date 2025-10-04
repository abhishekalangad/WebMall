import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { getMockCategories, addMockCategory } from '@/lib/mock-data'

function isSupabaseConfigured(): boolean {
  // Temporarily disable Supabase to use mock data only
  return false
  
  // Original check (uncomment when database is ready):
  // return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
  //          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co'))
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

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(getMockCategories())
  }

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser()
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