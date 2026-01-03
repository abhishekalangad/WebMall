import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { messageId, reply } = body

        if (!messageId || !reply) {
            return NextResponse.json(
                { error: 'Message ID and reply are required' },
                { status: 400 }
            )
        }

        // Update the message with admin reply
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                adminReply: reply.trim(),
                replyAt: new Date(),
                isReadByUser: false,
                status: 'replied'
            }
        })

        // Here you could also send an email notification to the customer
        // using their email (updatedMessage.email)

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully',
            data: updatedMessage
        })
    } catch (error) {
        console.error('Error sending reply:', error)
        return NextResponse.json(
            { error: 'Failed to send reply. Please try again later.' },
            { status: 500 }
        )
    }
}
