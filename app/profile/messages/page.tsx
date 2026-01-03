'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Mail, MessageCircle, Clock, CheckCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
    id: string
    subject: string
    message: string
    status: 'new' | 'replied'
    reply?: string
    repliedAt?: string
    createdAt: string
    isReadByUser: boolean
}

export default function MyMessagesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [isSendingReply, setIsSendingReply] = useState(false)

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login?redirect=/profile/messages')
            } else {
                fetchMessages()
            }
        }
    }, [user, loading, router])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            // Get auth token from Supabase
            const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()

            if (!session?.access_token) {
                console.error('No access token available')
                setIsLoading(false)
                return
            }

            const response = await fetch('/api/user/messages', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Messages received:', data)
                setMessages(data.messages || [])
            } else {
                console.error('Failed to fetch messages:', response.status)
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleExpand = async (id: string, isUnread: boolean) => {
        setExpandedId(expandedId === id ? null : id)

        if (expandedId !== id && isUnread) {
            try {
                const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
                if (session?.access_token) {
                    await fetch('/api/user/messages', {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ messageId: id })
                    })
                    // Optimistically update local state
                    setMessages(prev => prev.map(m => m.id === id ? { ...m, isReadByUser: true } : m))
                }
            } catch (error) {
                console.error('Failed to mark message as read:', error)
            }
        }
    }

    const handleSendReply = async (originalSubject: string) => {
        if (!replyText.trim()) return

        setIsSendingReply(true)
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user?.name || 'Customer',
                    email: user?.email || '',
                    subject: `Re: ${originalSubject}`,
                    message: replyText,
                    userId: user?.id
                })
            })

            if (response.ok) {
                setReplyText('')
                setReplyingToId(null)
                fetchMessages() // Refresh to show new message

                // Optional: Show success message
                alert('Reply sent successfully!')
            } else {
                alert('Failed to send reply. Please try again.')
            }
        } catch (error) {
            console.error('Error sending reply:', error)
            alert('Failed to send reply. Please try again.')
        } finally {
            setIsSendingReply(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-300 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-2">My Messages</h1>
                            <p className="text-gray-600">View your conversation history with support</p>
                        </div>
                        <Button
                            onClick={fetchMessages}
                            variant="outline"
                            className="rounded-xl border-gray-300 hover:border-gray-400"
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Messages List */}
                {messages.length === 0 ? (
                    <Card className="p-16 text-center bg-white border-0 shadow-lg rounded-3xl">
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="h-10 w-10 text-pink-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Messages Yet</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            You haven't sent any messages to our support team yet. We're here to help!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => router.push('/contact')}
                                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl px-8 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Contact Support
                            </Button>
                            {user?.role === 'admin' && (
                                <Button
                                    onClick={() => router.push('/admin/messages')}
                                    variant="outline"
                                    className="rounded-xl border-gray-300 hover:border-gray-400 px-8 h-12 font-semibold"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage Customer Inquiries
                                </Button>
                            )}
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <Card
                                key={msg.id}
                                className="overflow-hidden border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all"
                            >
                                {/* Message Header */}
                                <div
                                    className={`p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-colors relative ${!msg.isReadByUser && msg.status === 'replied' ? 'bg-pink-50/50' : ''}`}
                                    onClick={() => toggleExpand(msg.id, !msg.isReadByUser && msg.status === 'replied')}
                                >
                                    {/* Unread Notification Dot */}
                                    {!msg.isReadByUser && msg.status === 'replied' && (
                                        <div className="absolute top-6 right-12 flex items-center gap-2">
                                            <span className="flex h-3 w-3 rounded-full bg-pink-600 animate-pulse"></span>
                                            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">New Reply</span>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${msg.status === 'replied'
                                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                                    : 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                                                    }`}>
                                                    {msg.status === 'replied' ? (
                                                        <>
                                                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                            Replied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                            Pending
                                                        </>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    {formatDate(msg.createdAt)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{msg.subject}</h3>
                                            <p className="text-gray-600 line-clamp-2">{msg.message}</p>
                                        </div>
                                        <div className="ml-6 flex-shrink-0">
                                            {expandedId === msg.id ? (
                                                <ChevronUp className="h-6 w-6 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Conversation Thread */}
                                {expandedId === msg.id && (
                                    <div className="p-8 space-y-6 bg-gray-50">
                                        {/* Customer Message */}
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-white rounded-2xl rounded-tl-sm p-6 shadow-md border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-sm font-bold text-gray-900">You</p>
                                                        <p className="text-xs text-gray-500">{formatDate(msg.createdAt)}</p>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Reply */}
                                        {msg.status === 'replied' && msg.reply ? (
                                            <div className="flex gap-4 flex-row-reverse">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                                                        <MessageCircle className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl rounded-tr-sm p-6 shadow-md border border-green-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold text-gray-900">Support Team</p>
                                                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">Admin</span>
                                                            </div>
                                                            {msg.repliedAt && (
                                                                <p className="text-xs text-gray-600">{formatDate(msg.repliedAt)}</p>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{msg.reply}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                                <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                                                <p className="text-blue-700 font-semibold">Waiting for support team response...</p>
                                            </div>
                                        )}

                                        {/* Customer Reply Section - Simple & Clean */}
                                        {msg.status === 'replied' && msg.reply && (
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                {replyingToId === msg.id ? (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                                        <p className="text-sm font-semibold text-gray-700 mb-4">Send Another Reply</p>
                                                        <Textarea
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder="Type your follow-up message..."
                                                            rows={4}
                                                            className="w-full rounded-lg border-gray-300 mb-4"
                                                        />
                                                        <div className="flex gap-3">
                                                            <Button
                                                                onClick={() => handleSendReply(msg.subject)}
                                                                disabled={isSendingReply || !replyText.trim()}
                                                                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                                                            >
                                                                {isSendingReply ? 'Sending...' : 'Send Reply'}
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setReplyingToId(null)
                                                                    setReplyText('')
                                                                }}
                                                                variant="outline"
                                                                className="rounded-lg"
                                                            >
                                                                Close
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => setReplyingToId(msg.id)}
                                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-12"
                                                    >
                                                        <MessageCircle className="h-4 w-4 mr-2" />
                                                        Send Follow-up Message
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Contact Again Button */}
                {messages.length > 0 && (
                    <div className="mt-8 text-center">
                        <Button
                            onClick={() => router.push('/contact')}
                            variant="outline"
                            className="rounded-xl border-2 border-gray-300 hover:border-pink-500 hover:text-pink-600 transition-all px-8 h-12 font-semibold"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Another Message
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
