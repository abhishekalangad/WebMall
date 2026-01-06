import { Suspense } from 'react'
import AdminCategoriesContent from './content'

export const dynamic = 'force-dynamic'

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Categories...</div>}>
      <AdminCategoriesContent />
    </Suspense>
  )
}
