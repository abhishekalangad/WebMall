'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    Users,
    Search,
    MoreHorizontal,
    Mail,
    Calendar,
    Shield,
    User as UserIcon,
    ArrowLeft
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

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { accessToken } = useAuth()

    useEffect(() => {
        fetchUsers()
    }, [accessToken])

    const fetchUsers = async () => {
        try {
            const token = await accessToken()
            if (!token) return

            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

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
                        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
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
                            <span>{users.length} Total Users</span>
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
                                        <Button variant="outline" size="sm">
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
            </div>
        </div>
    )
}
