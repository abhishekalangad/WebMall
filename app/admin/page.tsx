'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/')
      } else {
        setReady(true)
      }
    }
  }, [user, loading, router])

  if (loading || !ready) {
    return <div className="max-w-7xl mx-auto p-6">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/products">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Manage Products</h2>
            <p className="text-gray-600">Create, update, and delete products</p>
            <div className="mt-4 text-sm text-blue-600 font-medium">→ Products Management</div>
          </Card>
        </Link>
        <Link href="/admin/categories">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Manage Categories</h2>
            <p className="text-gray-600">Organize product categories</p>
            <div className="mt-4 text-sm text-blue-600 font-medium">→ Categories Management</div>
          </Card>
        </Link>
        <Link href="/admin/orders">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Manage Orders</h2>
            <p className="text-gray-600">View and update order statuses</p>
            <div className="mt-4 text-sm text-blue-600 font-medium">→ Orders Management</div>
          </Card>
        </Link>
      </div>
    </div>
  )
}


