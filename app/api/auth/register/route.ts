import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 10 requests per 15 minutes
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.auth)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts',
          message: `You have exceeded the registration attempt limit. Please try again in ${rateLimitResult.retryAfter} seconds.`
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.retryAfter!.toString()
          }
        }
      )
    }

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const data = await signUp(email, password, name)

    const response = NextResponse.json({
      data: {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || name,
          role: data.user.user_metadata?.role || 'customer'
        } : null,
        session: data.session
      },
      message: 'Account created successfully! Please check your email to verify your account.'
    })

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    )
  }
}
