import { NextRequest, NextResponse } from 'next/server'
import { mockSignIn } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const user = await mockSignIn(email, password)
    
    return NextResponse.json({ 
      data: { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      } 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
