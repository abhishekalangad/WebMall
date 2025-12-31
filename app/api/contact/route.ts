import { NextRequest, NextResponse } from 'next/server'
import { ContactMessage, ContactFormData } from '@/types/contact'

// In-memory storage (replace with database in production)
let contactMessages: ContactMessage[] = []

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json()

        // Validate required fields
        if (!body.name || !body.email || !body.subject || !body.message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Create new message
        const newMessage: ContactMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: body.name.trim(),
            email: body.email.trim().toLowerCase(),
            subject: body.subject.trim(),
            message: body.message.trim(),
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        // Save message
        contactMessages.push(newMessage)

        // TODO: Send email notification to admin
        // TODO: Send confirmation email to user

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.',
            messageId: newMessage.id
        })
    } catch (error) {
        console.error('Error submitting contact form:', error)
        return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check admin authentication (you'll need to implement this)
        // const session = await getServerSession()
        // if (!session || !isAdmin(session.user)) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let filteredMessages = contactMessages

        if (status && ['new', 'read', 'replied'].includes(status)) {
            filteredMessages = contactMessages.filter(msg => msg.status === status)
        }

        // Sort by newest first
        const sortedMessages = [...filteredMessages].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return NextResponse.json({
            messages: sortedMessages,
            total: sortedMessages.length,
            stats: {
                new: contactMessages.filter(m => m.status === 'new').length,
                read: contactMessages.filter(m => m.status === 'read').length,
                replied: contactMessages.filter(m => m.status === 'replied').length,
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
