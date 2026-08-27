/**
 * Rate Limiting Utility for Next.js API Routes
 * Supports Upstash Redis with robust in-memory sliding window fallback.
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Periodic cleanup of expired entries
if (typeof window === 'undefined') {
    const interval = setInterval(() => {
        const now = Date.now()
        Array.from(rateLimitMap.entries()).forEach(([key, entry]) => {
            if (entry.resetTime < now) {
                rateLimitMap.delete(key)
            }
        })
    }, 10 * 60 * 1000)

    if (interval.unref) interval.unref()
}

export interface RateLimitConfig {
    maxRequests: number
    windowSeconds: number
    identifier?: (request: NextRequest) => string
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')

    if (forwarded) return forwarded.split(',')[0].trim()
    if (realIp) return realIp.trim()
    if (cfConnectingIp) return cfConnectingIp.trim()

    return '127.0.0.1'
}

export async function checkRateLimitAsync(
    request: NextRequest,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const { maxRequests, windowSeconds, identifier } = config
    const key = identifier ? identifier(request) : getClientIp(request)

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    // Upstash Redis implementation if credentials exist
    if (redisUrl && redisToken) {
        try {
            const redisKey = `ratelimit:${key}`
            const res = await fetch(`${redisUrl}/pipeline`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${redisToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([
                    ['INCR', redisKey],
                    ['EXPIRE', redisKey, windowSeconds]
                ])
            })

            if (res.ok) {
                const data = await res.json()
                const count = data[0]?.result || 1
                const remaining = Math.max(0, maxRequests - count)
                const reset = Math.ceil(Date.now() / 1000) + windowSeconds

                if (count > maxRequests) {
                    return {
                        success: false,
                        limit: maxRequests,
                        remaining: 0,
                        reset,
                        retryAfter: windowSeconds
                    }
                }

                return {
                    success: true,
                    limit: maxRequests,
                    remaining,
                    reset
                }
            }
        } catch (e) {
            console.warn('[RateLimit] Upstash Redis error, falling back to in-memory:', e)
        }
    }

    // In-memory sliding window fallback
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    let entry = rateLimitMap.get(key)
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 0,
            resetTime: now + windowMs
        }
        rateLimitMap.set(key, entry)
    }

    entry.count++
    const remaining = Math.max(0, maxRequests - entry.count)
    const reset = Math.ceil(entry.resetTime / 1000)

    if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset,
            retryAfter
        }
    }

    return {
        success: true,
        limit: maxRequests,
        remaining,
        reset
    }
}

export function checkRateLimit(request: NextRequest, config: RateLimitConfig): RateLimitResult {
    const { maxRequests, windowSeconds, identifier } = config
    const key = identifier ? identifier(request) : getClientIp(request)
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    let entry = rateLimitMap.get(key)
    if (!entry || entry.resetTime < now) {
        entry = { count: 0, resetTime: now + windowMs }
        rateLimitMap.set(key, entry)
    }

    entry.count++
    const remaining = Math.max(0, maxRequests - entry.count)
    const reset = Math.ceil(entry.resetTime / 1000)

    if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
        return { success: false, limit: maxRequests, remaining: 0, reset, retryAfter }
    }

    return { success: true, limit: maxRequests, remaining, reset }
}

export function withRateLimit(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
    config: RateLimitConfig
) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
        const result = await checkRateLimitAsync(request, config)

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

        const response = await handler(request, ...args)
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.reset.toString())

        return response
    }
}

export const RateLimitPresets = {
    contactForm: { maxRequests: 5, windowSeconds: 15 * 60 },
    auth: { maxRequests: 10, windowSeconds: 15 * 60 },
    checkout: { maxRequests: 10, windowSeconds: 60 },
    coupon: { maxRequests: 15, windowSeconds: 60 },
    upload: { maxRequests: 15, windowSeconds: 60 },
    general: { maxRequests: 100, windowSeconds: 60 },
    passwordReset: { maxRequests: 3, windowSeconds: 60 * 60 }
}
