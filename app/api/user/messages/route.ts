import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        // Verify user authentication
        const authHeader = request.headers.get('Authorization')
        console.log('[User Messages] Auth header:', authHeader ? 'present' : 'missing')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[User Messages] Invalid auth header format')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        console.log('[User Messages] Token:', token ? 'present' : 'missing')

        const user = await verifyAuthToken(token)
        console.log('[User Messages] User:', user ? user.id : 'null')

        if (!user) {
            console.log('[User Messages] Invalid token or user not found')
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Fetch messages for this specific user
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { email: user.email }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log(`[User Messages] Found ${messages.length} messages for user ${user.id}`)

        // Map to response format
        const mappedMessages = messages.map(msg => ({
            id: msg.id,
            subject: msg.subject || 'No Subject',
            message: msg.message,
            reply: msg.adminReply || null,
            repliedAt: msg.replyAt?.toISOString() || null,
            status: msg.adminReply ? 'replied' : 'new',
            isReadByUser: msg.isReadByUser,
            createdAt: msg.createdAt.toISOString(),
        }))

        console.log(`[User Messages] Returning ${mappedMessages.length} messages`)

        return NextResponse.json({
            messages: mappedMessages,
            total: mappedMessages.length,
            unreadCount: mappedMessages.filter((m: any) => !m.isReadByUser && m.reply).length
        })
    } catch (error) {
        console.error('Error fetching user messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const body = await request.json()
        const { messageId } = body

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
        }

        // Update the message - ensure it belongs to the user
        await prisma.message.updateMany({
            where: {
                id: messageId,
                OR: [
                    { userId: user.id },
                    { email: user.email }
                ]
            },
            data: {
                isReadByUser: true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error marking message as read:', error)
        return NextResponse.json(
            { error: 'Failed to update message' },
            { status: 500 }
        )
    }
}
