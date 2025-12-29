import { NextRequest, NextResponse } from 'next/server'
import { mockSignOut } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    // Use mock authentication for development
    mockSignOut()
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
