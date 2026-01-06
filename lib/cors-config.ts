/**
 * CORS Configuration for Next.js API Routes
 * Defines which origins can make requests to the API
 */

export const corsConfig = {
    // Allowed origins
    allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        'http://localhost:3000',
        'http://localhost:3001',
    ].filter(Boolean) as string[],

    // Allowed HTTP methods
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],

    // Exposed headers
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],

    // Credentials
    credentials: true,

    // Preflight cache (in seconds)
    maxAge: 86400, // 24 hours
}

/**
 * Apply CORS headers to a response
 */
export function setCorsHeaders(
    headers: Headers,
    origin: string | null
): Headers {
    // Check if origin is allowed
    const isAllowed = origin && corsConfig.allowedOrigins.some(allowed => {
        try {
            const allowedUrl = new URL(allowed)
            const originUrl = new URL(origin)
            return allowedUrl.origin === originUrl.origin
        } catch {
            return false
        }
    })

    if (isAllowed) {
        headers.set('Access-Control-Allow-Origin', origin)
        headers.set('Access-Control-Allow-Credentials', 'true')
    }

    headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '))
    headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
    headers.set('Access-Control-Max-Age', String(corsConfig.maxAge))

    return headers
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightOptions(origin: string | null) {
    const headers = new Headers()
    setCorsHeaders(headers, origin)

    return new Response(null, {
        status: 204,
        headers
    })
}
