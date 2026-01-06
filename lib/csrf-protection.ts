import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF Protection Middleware
 * Validates origin and referer headers for state-changing requests
 * to prevent Cross-Site Request Forgery attacks
 */

export function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
    // Only check for state-changing methods
    const method = request.method
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return { valid: true }
    }

    // Get the origin from the request
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // Get allowed origins from environment or use current host
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        host ? `https://${host}` : null,
        host ? `http://${host}` : null,
        'http://localhost:3000',
        'http://localhost:3001',
    ].filter(Boolean) as string[]

    // Check origin header (preferred for CORS requests)
    if (origin) {
        const isAllowed = allowedOrigins.some(allowed => {
            try {
                const allowedUrl = new URL(allowed)
                const originUrl = new URL(origin)
                return allowedUrl.origin === originUrl.origin
            } catch {
                return false
            }
        })

        if (!isAllowed) {
            return {
                valid: false,
                error: 'Invalid origin - CSRF protection'
            }
        }
    }
    // Check referer header as fallback (for same-origin requests)
    else if (referer) {
        const isAllowed = allowedOrigins.some(allowed => {
            try {
                const allowedUrl = new URL(allowed)
                const refererUrl = new URL(referer)
                return refererUrl.origin === allowedUrl.origin
            } catch {
                return false
            }
        })

        if (!isAllowed) {
            return {
                valid: false,
                error: 'Invalid referer - CSRF protection'
            }
        }
    }
    // If neither origin nor referer is present for state-changing request
    // This is suspicious for browser requests, but allow for API clients
    else {
        // Check if there's an Authorization header (API client)
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return {
                valid: false,
                error: 'Missing origin and referer headers - CSRF protection'
            }
        }
        // Allow if it's an authenticated API request
    }

    return { valid: true }
}

/**
 * Apply CSRF protection to an API route handler
 * Returns error response if validation fails, otherwise calls the handler
 */
export function withCSRFProtection(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
        const validation = validateOrigin(request)

        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: validation.error || 'CSRF validation failed',
                    message: 'This request appears to be from an unauthorized source'
                },
                {
                    status: 403,
                    headers: {
                        'X-CSRF-Protection': 'active'
                    }
                }
            )
        }

        return handler(request, ...args)
    }
}

/**
 * Set secure cookie options with SameSite protection
 */
export function getSecureCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const, // Prevents CSRF attacks
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    }
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY')

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // Enable browser XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block')

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Content Security Policy (basic)
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    )

    return response
}
