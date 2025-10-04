import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: data.user.id }
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
