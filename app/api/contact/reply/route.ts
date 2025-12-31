import { NextRequest, NextResponse } from 'next/server'

// Import the messages array from the main contact route
// In production, this would be in a database
let contactMessages: any[] = []

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messageId, reply, adminEmail } = body

        if (!messageId || !reply) {
            return NextResponse.json(
                { error: 'Message ID and reply are required' },
                { status: 400 }
            )
        }

        // TODO: Check admin authentication
        // const session = await getServerSession()
        // if (!session || !isAdmin(session.user)) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // }

        // Find the message (in production, query from database)
        const message = contactMessages.find(m => m.id === messageId)

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        // Update message with reply
        message.status = 'replied'
        message.reply = reply.trim()
        message.repliedAt = new Date().toISOString()
        message.repliedBy = adminEmail || 'Admin'
        message.updatedAt = new Date().toISOString()

        // TODO: Send email reply to the user
        // await sendEmail({
        //   to: message.email,
        //   subject: `Re: ${message.subject}`,
        //   text: reply,
        //   html: generateReplyEmailHTML(message, reply)
        // })

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully',
            updatedMessage: message
        })
    } catch (error) {
        console.error('Error sending reply:', error)
        return NextResponse.json(
            { error: 'Failed to send reply' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { messageId, status } = body

        if (!messageId || !status) {
            return NextResponse.json(
                { error: 'Message ID and status are required' },
                { status: 400 }
            )
        }

        if (!['new', 'read', 'replied'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            )
        }

        const message = contactMessages.find(m => m.id === messageId)

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        message.status = status
        message.updatedAt = new Date().toISOString()

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            updatedMessage: message
        })
    } catch (error) {
        console.error('Error updating message status:', error)
        return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
        )
    }
}
