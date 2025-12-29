import { NextRequest, NextResponse } from 'next/server'
import { mockSignUp } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Use mock authentication for development
    const user = await mockSignUp(email, password, name)
    
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
