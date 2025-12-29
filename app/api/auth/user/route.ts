import { NextRequest, NextResponse } from 'next/server'
import { mockGetCurrentUser } from '@/lib/mock-auth'

export async function GET(request: NextRequest) {
  try {
    // Use mock authentication for development
    const user = mockGetCurrentUser()

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
