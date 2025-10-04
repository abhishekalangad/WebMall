import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

async function getCurrentAuthUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { supabaseId: session.user.id } })
  return user
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentAuthUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { status } = body
    const updated = await prisma.order.update({ where: { id: params.id }, data: { status } })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

