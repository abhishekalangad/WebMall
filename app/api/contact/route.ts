import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, subject, message, userId } = body

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Create new message
        // Build message data without userId initially
        const messageData: any = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
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

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.',
            messageId: newMessage.id
        })
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
        // In a real app, verify Admin session here
        // const session = await getServerSession() ...

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // Build filter
        let where: any = {}
        if (status === 'replied') {
            where.adminReply = { not: null }
        } else if (status === 'new') {
            where.adminReply = null
        }
        // 'all' or 'read' (treating read similar to new for now)

        const messages = await prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        // Map Prisma model to ContactMessage interface
        const mappedMessages = messages.map(msg => ({
            id: msg.id,
            name: msg.name,
            email: msg.email,
            subject: msg.subject || 'No Subject',
            message: msg.message,
            status: msg.adminReply ? 'replied' : 'new',
            reply: msg.adminReply || undefined,
            repliedAt: msg.replyAt?.toISOString(),
            createdAt: msg.createdAt.toISOString(),
            updatedAt: msg.updatedAt.toISOString(),
        }))

        // Calculate stats
        const total = await prisma.message.count()
        const newCount = await prisma.message.count({ where: { adminReply: null } })
        const repliedCount = await prisma.message.count({ where: { adminReply: { not: null } } })

        return NextResponse.json({
            messages: mappedMessages,
            total,
            stats: {
                new: newCount,
                read: 0,
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
