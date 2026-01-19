import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { sanitizeString, sanitizeEmail, sanitizeTextArea } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting: 5 requests per 15 minutes
        const rateLimitResult = await checkRateLimit(request, RateLimitPresets.contactForm)

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `You have exceeded the contact form submission limit. Please try again in ${rateLimitResult.retryAfter} seconds.`
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

        const body = await request.json()
        const { name, email, subject, message, userId } = body

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        // Sanitize inputs to prevent XSS
        const sanitizedName = sanitizeString(name, 100)
        const sanitizedEmail = sanitizeEmail(email)
        const sanitizedSubject = sanitizeString(subject, 200)
        const sanitizedMessage = sanitizeTextArea(message, 5000)

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(sanitizedEmail)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate sanitized data is not empty
        if (!sanitizedName || !sanitizedEmail || !sanitizedSubject || !sanitizedMessage) {
            return NextResponse.json(
                { error: 'Invalid input data' },
                { status: 400 }
            )
        }

        // Create new message
        // Build message data without userId initially
        const messageData: any = {
            name: sanitizedName,
            email: sanitizedEmail,
            subject: sanitizedSubject,
            message: sanitizedMessage,
            status: 'new'
        }

        // Only connect user if userId is provided AND valid
        // This prevents foreign key constraint errors
        if (userId && typeof userId === 'string' && userId.length > 0) {
            try {
                // Verify user exists before connecting
                const userExists = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true }
                })

                if (userExists) {
                    messageData.user = { connect: { id: userId } }
                }
            } catch (error) {
                // If user doesn't exist, just skip the connection
                console.log('User not found, message will be created without user link')
            }
        }

        const newMessage = await prisma.message.create({
            data: messageData
        })

        const response = NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.',
            messageId: newMessage.id
        })

        // Add rate limit headers to successful response
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

        return response
    } catch (error: any) {
        console.error('Error submitting contact form:', error)
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
        })
        return NextResponse.json(
            {
                error: 'Failed to send message. Please try again later.',
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid token' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Build filter
        let where: any = {}
        if (status && status !== 'all') {
            where.status = status
        }

        // Fetch messages with pagination
        const [messages, totalCount] = await Promise.all([
            prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.message.count({ where })
        ])

        // Map Prisma model to ContactMessage interface
        const mappedMessages = messages.map(msg => ({
            id: msg.id,
            name: msg.name,
            email: msg.email,
            subject: msg.subject || 'No Subject',
            message: msg.message,
            status: msg.status as 'new' | 'read' | 'replied',
            reply: msg.adminReply || undefined,
            repliedAt: msg.replyAt?.toISOString(),
            createdAt: msg.createdAt.toISOString(),
            updatedAt: msg.updatedAt.toISOString(),
        }))

        // Calculate stats using the 'status' field for accuracy
        const [total, newCount, readCount, repliedCount] = await Promise.all([
            prisma.message.count(),
            prisma.message.count({ where: { status: 'new' } }),
            prisma.message.count({ where: { status: 'read' } }),
            prisma.message.count({ where: { status: 'replied' } })
        ])

        return NextResponse.json({
            messages: mappedMessages,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: page * limit < totalCount
            },
            stats: {
                new: newCount,
                read: readCount,
                replied: repliedCount,
            }
        })
    } catch (error) {
        console.error('Error fetching contact messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Message ID and status are required' },
                { status: 400 }
            )
        }

        // Update message status
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({
            success: true,
            message: 'Status updated',
            data: updatedMessage
        })

    } catch (error) {
        console.error('Error updating message status:', error)
        return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
        )
    }
}
