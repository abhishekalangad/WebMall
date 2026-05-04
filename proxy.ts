import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for CSRF Protection and Security Headers
 * Runs before requests reach API routes
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const method = request.method

    // Only apply CSRF protection to API routes with state-changing methods
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Get request origin and referer
        const requestOrigin = request.headers.get('origin')
        const referer = request.headers.get('referer')
        const host = request.headers.get('host')

        // Build list of allowed origins
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
            host ? `https://${host}` : null,
            host ? `http://${host}` : null,
            'http://localhost:3000',
            'http://localhost:3001',
        ].filter(Boolean) as string[]

        let isValidOrigin = false

        // Validate origin header
        if (requestOrigin) {
            isValidOrigin = allowedOrigins.some(allowed => {
                try {
                    const allowedUrl = new URL(allowed)
                    const originUrl = new URL(requestOrigin)
                    return allowedUrl.origin === originUrl.origin
                } catch {
                    return false
                }
            })
        }
        // Validate referer header as fallback
        else if (referer) {
            isValidOrigin = allowedOrigins.some(allowed => {
                try {
                    const allowedUrl = new URL(allowed)
                    const refererUrl = new URL(referer)
                    return refererUrl.origin === allowedUrl.origin
                } catch {
                    return false
                }
            })
        }
        // Allow if authenticated via Bearer token (API clients)
        else {
            const authHeader = request.headers.get('authorization')
            isValidOrigin = !!authHeader?.startsWith('Bearer ')
        }

        // Block request if origin validation fails
        if (!isValidOrigin) {
            console.warn(`CSRF protection blocked request: ${method} ${pathname}`, {
                origin: requestOrigin,
                referer,
                hasAuth: !!request.headers.get('authorization')
            })

            return NextResponse.json(
                {
                    error: 'CSRF validation failed',
                    message: 'This request appears to be from an unauthorized source'
                },
                {
                    status: 403,
                    headers: {
                        'X-CSRF-Protection': 'active',
                        'X-Frame-Options': 'DENY',
                        'X-Content-Type-Options': 'nosniff',
                    }
                }
            )
        }
    }

    // For all responses, add security headers
    const response = NextResponse.next()

    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    )

    return response
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
