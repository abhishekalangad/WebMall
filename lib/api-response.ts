import { NextResponse } from 'next/server'

export interface ApiResponseOptions {
  status?: number
  headers?: Record<string, string>
}

export function apiSuccess<T>(data: T, message?: string, options: ApiResponseOptions = {}) {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data })
    },
    {
      status: options.status || 200,
      headers: options.headers
    }
  )
}

export function apiError(message: string, status: number = 400, details?: any) {
  // Sanitize internal error details for 500 server errors in production
  const isProd = process.env.NODE_ENV === 'production'
  const safeMessage = status >= 500 && isProd
    ? 'An internal server error occurred. Please try again later.'
    : message

  return NextResponse.json(
    {
      success: false,
      error: safeMessage,
      ...(details && !isProd ? { details } : {})
    },
    { status }
  )
}
