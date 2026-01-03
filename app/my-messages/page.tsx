'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageCircle, Clock, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UserMessage {
    id: string
    subject: string
    message: string
    reply: string | null
    repliedAt: string | null
    status: 'new' | 'replied'
    createdAt: string
}

export default function MyMessagesPage() {
    const { user, accessToken } = useAuth()
    const router = useRouter()
    const [messages, setMessages] = useState<UserMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState<UserMessage | null>(null)

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/my-messages')
            return
        }
        fetchMessages()
    }, [user])

    const fetchMessages = async () => {
        setIsLoading(true)
        try {
            const token = await accessToken()
            if (!token) {
                console.error('No access token available')
                setIsLoading(false)
                return
            }

            const response = await fetch('/api/user/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(data.messages || [])
            } else {
                console.error('Failed to fetch messages:', response.status)
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-2">My Messages</h1>
                    <p className="text-gray-600">View your conversation history and admin replies</p>
                </div>

                {/* Messages List */}
                {messages.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Messages Yet</h2>
                        <p className="text-gray-600 mb-6">
                            You haven't sent any messages to us yet.
                        </p>
                        <Link href="/contact">
                            <Button className="bg-gray-900 hover:bg-gray-800 rounded-xl">
                                Send a Message
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Message Header */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <MessageCircle className="h-5 w-5 text-gray-400" />
                                                <h3 className="font-bold text-gray-900">{message.subject}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${message.status === 'replied'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {message.status === 'replied' ? 'Replied' : 'Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                <Clock className="h-3 w-3 inline mr-1" />
                                                Sent on {formatDate(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Your Message */}
                                <div className="p-6 bg-gray-50">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Your Message:</p>
                                    <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                                </div>

                                {/* Admin Reply */}
                                {message.reply && (
                                    <div className="p-6 bg-green-50 border-t border-green-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <p className="text-sm font-semibold text-green-900">Admin Reply:</p>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap mb-3">{message.reply}</p>
                                        {message.repliedAt && (
                                            <p className="text-xs text-green-700">
                                                Replied on {formatDate(message.repliedAt)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {!message.reply && (
                                    <div className="p-4 bg-blue-50 border-t border-blue-200">
                                        <p className="text-sm text-blue-700">
                                            <Clock className="h-4 w-4 inline mr-1" />
                                            Waiting for admin response...
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact Again Button */}
                {messages.length > 0 && (
                    <div className="mt-8 text-center">
                        <Link href="/contact">
                            <Button variant="outline" className="rounded-xl">
                                <Mail className="h-4 w-4 mr-2" />
                                Send Another Message
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
