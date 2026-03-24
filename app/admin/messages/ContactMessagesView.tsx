'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Loader2, CheckCircle, Clock, Eye, Trash2, RefreshCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { ContactMessage } from '@/types/contact'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function ContactMessagesView() {
    const { toast } = useToast()
    const { accessToken } = useAuth()
    const [messages, setMessages] = useState<ContactMessage[]>([])
    const [stats, setStats] = useState({ new: 0, read: 0, replied: 0, total: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
    const [replyText, setReplyText] = useState('')
    const [isSendingReply, setIsSendingReply] = useState(false)
    const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    const fetchMessages = async (pageNum: number = 1, append: boolean = false) => {
        if (append) setIsLoadingMore(true)
        else setIsLoading(true)

        try {
            const url = filter === 'all'
                ? `/api/contact?page=${pageNum}&limit=10`
                : `/api/contact?status=${filter}&page=${pageNum}&limit=10`

            const token = await accessToken()
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()

            if (response.ok) {
                if (append) {
                    setMessages(prev => [...prev, ...(data.messages || [])])
                } else {
                    setMessages(data.messages || [])
                }
                setStats(data.stats ? { ...data.stats, total: data.total } : { new: 0, read: 0, replied: 0, total: 0 })
                setHasMore(data.pagination?.hasMore || false)
                setPage(pageNum)
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
            toast({
                title: 'Error',
                description: 'Failed to load messages',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    useEffect(() => {
        setPage(1)
        fetchMessages(1, false)
    }, [filter])

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchMessages(page + 1, true)
        }
    }

    const handleDeleteMessage = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation() // don't open the dialog when clicking delete on the row
        if (!window.confirm('Permanently delete this message? This cannot be undone.')) return

        try {
            const token = await accessToken()
            const res = await fetch(`/api/contact?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Delete failed')

            // Remove from local state immediately
            setMessages(prev => prev.filter(m => m.id !== id))

            // Close dialog if this was the open message
            if (selectedMessage?.id === id) setSelectedMessage(null)

            // Update total count in stats
            setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))

            toast({ title: 'Deleted', description: 'Message removed permanently.' })
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete message.', variant: 'destructive' })
        }
    }

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = await accessToken()
            await fetch('/api/contact', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, status: 'read' })
            })
            // Update local state to reflect change immediately (optimistic update)
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m))

            // Update stats immediately to reflect the count change
            setStats(prev => ({
                ...prev,
                new: prev.new > 0 ? prev.new - 1 : 0,
                read: prev.read + 1
            }))
        } catch (error) {
            console.error('Failed to mark as read', error)
        }
    }

    const handleViewMessage = (message: ContactMessage) => {
        setSelectedMessage(message)
        setReplyText(message.reply || '')

        // Mark as read if it's new
        if (message.status === 'new') {
            handleMarkAsRead(message.id)
        }
    }

    const handleSendReply = async () => {
        if (!selectedMessage || !replyText.trim()) return

        setIsSendingReply(true)
        try {
            const token = await accessToken()
            if (!token) {
                throw new Error('Not authenticated')
            }

            const response = await fetch('/api/contact/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId: selectedMessage.id,
                    reply: replyText,
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast({
                    title: 'Reply Sent!',
                    description: 'Your reply has been sent successfully.',
                })

                // Update stats locally for immediate feedback
                if (selectedMessage.status !== 'replied') {
                    setStats(prev => ({
                        ...prev,
                        replied: prev.replied + 1,
                        read: selectedMessage.status === 'read' ? (prev.read > 0 ? prev.read - 1 : 0) : prev.read,
                        new: selectedMessage.status === 'new' ? (prev.new > 0 ? prev.new - 1 : 0) : prev.new
                    }))
                }

                setSelectedMessage(null)
                setReplyText('')
                // Fetch to sync complete state
                fetchMessages(1, false)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send reply',
                variant: 'destructive',
            })
        } finally {
            setIsSendingReply(false)
        }
    }

    const getStatusBadge = (status: ContactMessage['status']) => {
        const styles = {
            new: 'bg-blue-100 text-blue-700 border-blue-200',
            read: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            replied: 'bg-green-100 text-green-700 border-green-200',
        }
        return (
            <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                {status === 'new' && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse outline outline-2 outline-red-100"></span>
                )}
            </div>
        )
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

    const cleanSubject = (subject: string) => {
        // Recursively remove Re: prefixes (case insensitive) and whitespace
        return subject.replace(/^(re:\s*)+/i, '').trim()
    }

    return (
        <div className="min-h-screen bg-muted/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Customer Messages</h1>
                        <p className="text-muted-foreground">View and respond to customer inquiries</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card rounded-xl shadow p-6 border border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Messages</p>
                                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <Mail className="h-8 w-8 text-muted-foreground/80" />
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-6 border border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">New</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-6 border border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Read</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.read}</p>
                            </div>
                            <Eye className="h-8 w-8 text-yellow-400" />
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-6 border border-border/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Replied</p>
                                <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl shadow p-4 mb-6 flex flex-wrap gap-2">
                    {['all', 'new', 'read', 'replied'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                ? 'bg-gray-900 text-white'
                                : 'bg-muted text-foreground/80 hover:bg-gray-200'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                    <button
                        onClick={() => fetchMessages()}
                        className="ml-auto px-4 py-2 rounded-lg bg-muted text-foreground/80 hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Messages List */}
                <div className="bg-card rounded-xl shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/80" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-muted-foreground">No messages found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleViewMessage(message)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-foreground">{message.name}</h3>
                                                {getStatusBadge(message.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{message.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                                            <button
                                                onClick={(e) => handleDeleteMessage(message.id, e)}
                                                title="Delete message"
                                                className="ml-1 p-1.5 rounded-lg text-muted-foreground/80 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-foreground/90 mb-1">{cleanSubject(message.subject)}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="p-4 border-t border-border/50 flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={handleLoadMore}
                                        disabled={isLoadingMore}
                                        className="rounded-xl min-w-[150px]"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : 'Load More'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Reply Dialog */}
                <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Message Details</DialogTitle>
                            <DialogDescription>View message and send a reply</DialogDescription>
                        </DialogHeader>

                        {selectedMessage && (
                            <div className="space-y-6">
                                {/* Message Info */}
                                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">{selectedMessage.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                                        </div>
                                        {getStatusBadge(selectedMessage.status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Subject</p>
                                        <p className="font-medium text-foreground">{cleanSubject(selectedMessage.subject)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Message</p>
                                        <p className="text-foreground/80 whitespace-pre-wrap">{selectedMessage.message}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Sent on {formatDate(selectedMessage.createdAt)}
                                    </p>
                                </div>

                                {/* Previous Reply (if exists) */}
                                {selectedMessage.reply && (
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <p className="text-xs text-green-700 mb-2 font-semibold">Previous Reply</p>
                                        <p className="text-foreground/80 whitespace-pre-wrap">{selectedMessage.reply}</p>
                                        <p className="text-xs text-green-600 mt-2">
                                            Replied by {selectedMessage.repliedBy} on {selectedMessage.repliedAt && formatDate(selectedMessage.repliedAt)}
                                        </p>
                                    </div>
                                )}

                                {/* Reply Form */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                        {selectedMessage.status === 'replied' ? 'Send Another Reply' : 'Your Reply'}
                                    </label>
                                    <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply here..."
                                        rows={6}
                                        className="w-full rounded-xl"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={isSendingReply || !replyText.trim()}
                                        className="flex-1 bg-gray-900 hover:bg-gray-800 rounded-xl"
                                    >
                                        {isSendingReply ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Send Reply
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setSelectedMessage(null)}
                                        variant="outline"
                                        className="rounded-xl"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteMessage(selectedMessage!.id)}
                                        variant="outline"
                                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                        title="Delete this message permanently"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
