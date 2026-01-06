'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    User, Mail, Phone, MapPin, Calendar,
    Shield, ArrowLeft, Package, Clock,
    ShoppingBag, AlertCircle, Trash2, Ban,
    Edit2, Key, CheckCircle, XCircle, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface UserDetail {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
    phone: string | null
    address: string | null
    profileImage: string | null
    _count: {
        orders: number
        reviews: number
    }
    orders: Array<{
        id: string
        orderNumber: string
        totalAmount: number
        status: string
        createdAt: string
        items: Array<{
            id: string
            quantity: number
            price: number
            product: {
                name: string
            }
        }>
    }>
}

export default function AdminUserDetailPage() {
    const params = useParams()
    const { accessToken } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [user, setUser] = useState<UserDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [passwordLink, setPasswordLink] = useState<string | null>(null)

    // Controlled Dialog States
    const [isEditing, setIsEditing] = useState(false)
    const [isBanOpen, setIsBanOpen] = useState(false)
    const [isUnbanOpen, setIsUnbanOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isResetOpen, setIsResetOpen] = useState(false)

    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        address: '',
        role: ''
    })

    const fetchUser = async () => {
        try {
            const token = await accessToken()
            if (!token) return

            const response = await fetch(`/api/admin/users/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data)
                setEditForm({
                    name: data.name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    role: data.role
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch user details",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [params.id, accessToken])

    const handleAction = async (action: string, payload: any = {}) => {
        setActionLoading(true)
        try {
            const token = await accessToken()
            const response = await fetch(`/api/admin/users/${params.id}`, {
                method: action === 'delete' ? 'DELETE' : 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: action === 'delete' ? undefined : JSON.stringify({ action: action, ...payload })
            })

            const data = await response.json()

            if (response.ok) {
                if (action === 'delete') {
                    toast({ title: "Success", description: "User deleted successfully" })
                    setIsDeleteOpen(false)
                    router.push('/admin/users')
                } else if (action === 'resetPassword') {
                    setPasswordLink(data.recoveryLink)
                    toast({ title: "Success", description: "Recovery link generated" })
                    // We keep reset modal open to show the link!
                } else if (action === 'ban') {
                    toast({ title: "Success", description: "User has been banned." })
                    fetchUser()
                    setIsBanOpen(false)
                } else if (action === 'unban') {
                    toast({ title: "Success", description: "User has been unbanned." })
                    fetchUser()
                    setIsUnbanOpen(false)
                } else if (action === 'updateProfile' || action === 'updateRole') {
                    toast({ title: "Success", description: "Profile updated successfully" })
                    fetchUser()
                    setIsEditing(false)
                }
            } else {
                toast({
                    title: "Error",
                    description: data.error || data.details || "Operation failed",
                    variant: "destructive"
                })
            }
        } catch (e) {
            console.error(e)
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
                <Button onClick={() => router.push('/admin/users')} className="mt-4">
                    Back to Users
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/admin/users')} className="p-2 h-auto text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">User Profile</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500 font-mono">ID: {user.id}</p>
                                <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-none shadow-sm space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit User Profile</DialogTitle>
                                            <DialogDescription>Update user details directly.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Select value={editForm.role} onValueChange={(val) => setEditForm({ ...editForm, role: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="customer">Customer</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                            <Button
                                                onClick={() => {
                                                    // Handle multi-step update if role changes separately or combined
                                                    handleAction('updateProfile', { name: editForm.name, phone: editForm.phone, address: editForm.address })
                                                    if (editForm.role !== user.role) {
                                                        handleAction('updateRole', { role: editForm.role })
                                                    }
                                                }}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-sm">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-300" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{user.name || 'No Name'}</h2>
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-2 text-[10px] uppercase tracking-wider">
                                    {user.role}
                                </Badge>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email</p>
                                        <p className="text-sm font-medium text-slate-900 break-all">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{user.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Address</p>
                                        <p className="text-sm font-medium text-slate-900 line-clamp-2">{user.address || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Joined</p>
                                        <p className="text-sm font-medium text-slate-900">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Account Actions</h3>
                            <div className="space-y-3">
                                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Key className="w-4 h-4 mr-2" /> Reset Password
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Reset Password</DialogTitle>
                                            <DialogDescription>
                                                Generate a password recovery link for this user. You can send this link to them manually.
                                            </DialogDescription>
                                        </DialogHeader>
                                        {passwordLink ? (
                                            <div className="space-y-4">
                                                <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                                                    <div className="flex gap-3">
                                                        <Shield className="w-5 h-5 text-red-600 shrink-0" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-red-900">Security Warning</h4>
                                                            <p className="text-xs text-red-700 mt-1">
                                                                This link grants <strong>immediate access</strong> to the user's account.
                                                                Only share this with the verified user securely.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-50 rounded-lg border flex items-center justify-between gap-3">
                                                    <div className="font-mono text-xs text-slate-500 truncate max-w-[200px]">
                                                        {process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token=...
                                                    </div>
                                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                                                        Active
                                                    </Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <p className="text-sm text-slate-500">Click generate to create a secure one-time recovery link.</p>
                                            </div>
                                        )}
                                        <DialogFooter>
                                            {passwordLink ? (
                                                <Button onClick={() => {
                                                    navigator.clipboard.writeText(passwordLink)
                                                    toast({ title: "Copied!", description: "Secure link copied to clipboard." })
                                                }} className="w-full sm:w-auto">
                                                    <Copy className="w-4 h-4 mr-2" /> Copy Secure Link
                                                </Button>
                                            ) : (
                                                <Button onClick={() => handleAction('resetPassword')} disabled={actionLoading}>
                                                    {actionLoading ? 'Generating...' : 'Generate Recovery Link'}
                                                </Button>
                                            )}
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Separator />

                                <Dialog open={isBanOpen} onOpenChange={setIsBanOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-amber-600 border-amber-200 hover:bg-amber-50">
                                            <Ban className="w-4 h-4 mr-2" /> Ban / Suspend
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Deactivate User</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to ban this user? They will not be able to log in.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsBanOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={() => handleAction('ban')}>Yes, Ban User</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isUnbanOpen} onOpenChange={setIsUnbanOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                            <Shield className="w-4 h-4 mr-2" /> Unban / Reactivate
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Reactivate User</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to unban this user? They will regain access to their account immediately.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsUnbanOpen(false)}>Cancel</Button>
                                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction('unban')}>Yes, Unban User</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" className="w-full justify-start">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete User Account</DialogTitle>
                                            <DialogDescription>
                                                This action is permanent and cannot be undone. All user data will be removed.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={() => handleAction('delete')}>
                                                {actionLoading ? 'Deleting...' : 'Permanently Delete'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content - Orders */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-md">
                                <p className="text-3xl font-bold">{user._count.orders}</p>
                                <p className="text-sm opacity-90 font-medium uppercase mt-1">Total Orders</p>
                            </Card>
                            <Card className="p-6 bg-white border-none shadow-sm">
                                <p className="text-3xl font-bold text-slate-900">{user._count.reviews}</p>
                                <p className="text-sm text-slate-500 font-medium uppercase mt-1">Reviews Posted</p>
                            </Card>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mt-8 mb-4">Recent Order History</h3>

                        {user.orders.length > 0 ? (
                            <div className="space-y-4">
                                {user.orders.map(order => (
                                    <Card key={order.id} className="p-6 border-none shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                    <span className="font-bold text-slate-900">{order.orderNumber}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 mt-1 block">
                                                    {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={`
                                                    ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-blue-50 text-blue-700 border-blue-100'}
                                                `}>
                                                    {order.status}
                                                </Badge>
                                                <span className="font-bold text-slate-900">LKR {order.totalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {order.items.map(item => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-medium text-slate-600">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="text-slate-700">{item.product.name}</span>
                                                    </div>
                                                    <span className="text-slate-500">LKR {item.price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium">No orders found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
