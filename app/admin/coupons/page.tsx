'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Tag, Calendar, Users, TrendingUp, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Coupon {
    id: string
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    expiryDate: string
    usageLimit: number
    timesUsed: number
    minimumOrder: number
    status: 'active' | 'inactive'
    usageType: 'one_per_user' | 'unlimited' | 'user_specific'
    maxUsesPerUser: number
    createdAt: string
    updatedAt: string
}

export default function AdminCouponsPage() {
    const { accessToken } = useAuth()
    const { toast } = useToast()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: 0,
        expiryDate: '',
        usageLimit: 100,
        minimumOrder: 0,
        status: 'active' as 'active' | 'inactive',
        usageType: 'one_per_user' as 'one_per_user' | 'unlimited' | 'user_specific',
        maxUsesPerUser: 1
    })

    useEffect(() => {
        fetchCoupons()
    }, [])

    const fetchCoupons = async () => {
        try {
            const token = await accessToken()
            const response = await fetch('/api/admin/coupons', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setCoupons(data)
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await accessToken()
            const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
            const method = editingCoupon ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast({
                    title: editingCoupon ? 'Coupon Updated' : 'Coupon Created',
                    description: `Coupon ${formData.code} has been ${editingCoupon ? 'updated' : 'created'} successfully.`
                })
                fetchCoupons()
                resetForm()
            } else {
                const error = await response.json()
                toast({
                    title: 'Error',
                    description: error.error || 'Failed to save coupon',
                    variant: 'destructive'
                })
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return

        try {
            const token = await accessToken()
            const response = await fetch(`/api/admin/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                toast({
                    title: 'Coupon Deleted',
                    description: 'Coupon has been deleted successfully.'
                })
                fetchCoupons()
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete coupon',
                variant: 'destructive'
            })
        }
    }

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon)
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            expiryDate: coupon.expiryDate.split('T')[0],
            usageLimit: coupon.usageLimit,
            minimumOrder: coupon.minimumOrder,
            status: coupon.status,
            usageType: coupon.usageType || 'one_per_user',
            maxUsesPerUser: coupon.maxUsesPerUser || 1
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: 0,
            expiryDate: '',
            usageLimit: 100,
            minimumOrder: 0,
            status: 'active',
            usageType: 'one_per_user',
            maxUsesPerUser: 1
        })
        setEditingCoupon(null)
        setShowForm(false)
    }

    const isExpired = (date: string) => new Date(date) < new Date()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
                                <p className="text-gray-500 mt-1">Manage discount coupons and promotional codes</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Coupon
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Coupons</p>
                                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
                            </div>
                            <Tag className="h-8 w-8 text-pink-500" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Coupons</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {coupons.filter(c => c.status === 'active' && !isExpired(c.expiryDate)).length}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Uses</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {coupons.reduce((sum, c) => sum + c.timesUsed, 0)}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Expired</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {coupons.filter(c => isExpired(c.expiryDate)).length}
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-red-500" />
                        </div>
                    </Card>
                </div>

                {/* Coupon Form */}
                {showForm && (
                    <Card className="p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <Button variant="ghost" onClick={resetForm}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Coupon Code *
                                    </label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., SAVE20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type *
                                    </label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (LKR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Value *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                                        placeholder={formData.discountType === 'percentage' ? '10' : '500'}
                                        min="0"
                                        max={formData.discountType === 'percentage' ? '100' : undefined}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expiry Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Usage Limit
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Order (LKR)
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.minimumOrder}
                                        onChange={(e) => setFormData({ ...formData, minimumOrder: parseFloat(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Usage Type *
                                    </label>
                                    <select
                                        value={formData.usageType}
                                        onChange={(e) => setFormData({ ...formData, usageType: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="one_per_user">One Per User (Email Tracked)</option>
                                        <option value="unlimited">Unlimited Uses Per User</option>
                                        <option value="user_specific">Limited Uses Per User</option>
                                    </select>
                                </div>
                                {formData.usageType !== 'unlimited' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Max Uses Per User
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.maxUsesPerUser || 1}
                                            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                                            min="1"
                                            disabled={formData.usageType === 'one_per_user'}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Coupons Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Tag className="h-4 w-4 text-pink-500 mr-2" />
                                                <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}%`
                                                    : `LKR ${coupon.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="text-gray-900">{new Date(coupon.expiryDate).toLocaleDateString()}</div>
                                                {isExpired(coupon.expiryDate) && (
                                                    <Badge className="mt-1 bg-red-100 text-red-700">Expired</Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                {coupon.timesUsed} / {coupon.usageLimit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                LKR {coupon.minimumOrder.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={coupon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                {coupon.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(coupon)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
