'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    Users,
    Search,
    Mail,
    User as UserIcon,
    ArrowLeft,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { format } from 'date-fns'

interface UserAccount {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
    _count: {
        orders: number
    }
}

const LIMIT = 20

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserAccount[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const { accessToken } = useAuth()
    const router = useRouter()
    const sentinelRef = useRef<HTMLDivElement>(null)

    // Initial fetch
    useEffect(() => {
        fetchUsers()
    }, [accessToken])

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [hasMore, loadingMore, loading])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setPage(1)
            setHasMore(true)
            const token = await accessToken()
            if (!token) return

            const response = await fetch(`/api/admin/users?page=1&limit=${LIMIT}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                // Support both old plain-array response and new paginated response
                if (Array.isArray(data)) {
                    setUsers(data)
                    setTotalCount(data.length)
                    setHasMore(false)
                } else {
                    setUsers(data.users || [])
                    setTotalCount(data.pagination?.totalCount ?? 0)
                    setHasMore(data.pagination?.hasNextPage ?? false)
                    setPage(2)
                }
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return
        try {
            setLoadingMore(true)
            const token = await accessToken()
            if (!token) return
            const res = await fetch(`/api/admin/users?page=${page}&limit=${LIMIT}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                const newUsers = Array.isArray(data) ? data : (data.users || [])
                const pagination = data.pagination
                setUsers(prev => [...prev, ...newUsers])
                setHasMore(pagination ? pagination.hasNextPage : false)
                setPage(prev => prev + 1)
            }
        } catch (error) {
            console.error('Failed to load more users:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [page, hasMore, loadingMore, accessToken])

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="p-2 h-auto text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>
                                {loading
                                    ? 'Loading…'
                                    : `${users.length}${hasMore ? '+' : ''} of ${totalCount || users.length} Users`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredUsers.map((user) => (
                            <Card key={user.id} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{user.name || 'No Name'}</h3>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="flex items-center text-sm text-gray-500">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {user.email}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium">ORDERS</p>
                                            <p className="text-lg font-bold text-gray-900">{user._count.orders}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 font-medium">JOINED</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">No users found matching your search.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="py-2" />

                {/* Loading More Spinner */}
                {loadingMore && (
                    <div className="flex items-center justify-center py-6 gap-3 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                        <span className="text-sm font-medium">Loading more users…</span>
                    </div>
                )}

                {/* End of list indicator */}
                {!hasMore && users.length > 0 && !loading && (
                    <p className="text-center text-xs text-gray-400 py-4">
                        All {users.length} users loaded
                    </p>
                )}
            </div>
        </div>
    )
}
