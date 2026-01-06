/**
 * Rate Limiting Utility for Next.js API Routes
 * Prevents abuse and spam by limiting requests per IP address
 * 
 * Note: This uses in-memory storage which works for development and small-scale deployments.
 * For production at scale, consider using Redis or Upstash Rate Limit.
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory storage (resets on server restart)
// For production, use Redis or Upstash
const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now()
    // Convert Map entries to array for ES5 compatibility
    Array.from(rateLimitMap.entries()).forEach(([key, entry]) => {
        if (entry.resetTime < now) {
            rateLimitMap.delete(key)
        }
    })
}, 10 * 60 * 1000)

export interface RateLimitConfig {
    /**
     * Maximum number of requests allowed in the time window
     */
    maxRequests: number

    /**
     * Time window in seconds
     */
    windowSeconds: number

    /**
     * Custom identifier (defaults to IP address)
     */
    identifier?: (request: NextRequest) => string
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
    // Try various headers that might contain the real IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim()
    }

    if (realIp) {
        return realIp
    }

    if (cfConnectingIp) {
        return cfConnectingIp
    }

    // Fallback to a generic identifier
    return 'unknown'
}

/**
 * Check if a request should be rate limited
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig
): RateLimitResult {
    const { maxRequests, windowSeconds, identifier } = config

    // Get identifier (IP address or custom)
    const key = identifier ? identifier(request) : getClientIp(request)

    const now = Date.now()
    const windowMs = windowSeconds * 1000

    // Get or create rate limit entry
    let entry = rateLimitMap.get(key)

    if (!entry || entry.resetTime < now) {
        // Create new entry or reset expired one
        entry = {
            count: 0,
            resetTime: now + windowMs
        }
        rateLimitMap.set(key, entry)
    }

    // Increment count
    entry.count++

    const remaining = Math.max(0, maxRequests - entry.count)
    const reset = Math.ceil(entry.resetTime / 1000)

    if (entry.count > maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

        return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset,
            retryAfter
        }
    }

    // Within rate limit
    return {
        success: true,
        limit: maxRequests,
        remaining,
        reset
    }
}

/**
 * Apply rate limiting to an API route handler
 * Returns 429 Too Many Requests if limit exceeded
 * 
 * @param handler - API route handler function
 * @param config - Rate limit configuration
 */
export function withRateLimit(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
    config: RateLimitConfig
) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
        const result = checkRateLimit(request, config)

        if (!result.success) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': result.limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': result.reset.toString(),
                        'Retry-After': result.retryAfter!.toString()
                    }
                }
            )
        }

        // Add rate limit headers to successful response
        const response = await handler(request, ...args)

        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.reset.toString())

        return response
    }
}

/**
 * Preset configurations for common use cases
 */
export const RateLimitPresets = {
    /**
     * Strict limit for contact forms and sensitive endpoints
     * 5 requests per 15 minutes
     */
    contactForm: {
        maxRequests: 5,
        windowSeconds: 15 * 60
    },

    /**
     * Moderate limit for authentication endpoints
     * 10 requests per 15 minutes
     */
    auth: {
        maxRequests: 10,
        windowSeconds: 15 * 60
    },

    /**
     * Lenient limit for general API endpoints
     * 100 requests per minute
     */
    general: {
        maxRequests: 100,
        windowSeconds: 60
    },

    /**
     * Very strict limit for password reset
     * 3 requests per hour
     */
    passwordReset: {
        maxRequests: 3,
        windowSeconds: 60 * 60
    }
}
