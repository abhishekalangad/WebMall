import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 10 requests per 15 minutes
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.auth)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts',
          message: `You have exceeded the login attempt limit. Please try again in ${rateLimitResult.retryAfter} seconds.`
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

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const data = await signIn(email, password)

    const response = NextResponse.json({
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'customer'
        },
        session: data.session
      }
    })

    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Invalid login credentials' },
      { status: 400 }
    )
  }
}
