'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft, Plus, Search, Package, AlertTriangle,
  Edit, Trash2, Save, X, Loader2, TrendingDown,
  RefreshCcw, Boxes, DollarSign, Minus
} from 'lucide-react'

const UNITS = ['pcs', 'rolls', 'boxes', 'sheets', 'bags', 'kg', 'g', 'litres', 'ml', 'pairs', 'sets', 'metres']

const CATEGORIES = [
  'Packaging', 'Stationery', 'Tools', 'Cleaning', 'Printing', 'Office', 'Labels', 'General'
]

const emptyForm = {
  name: '', category: 'General', quantity: '', unit: 'pcs',
  lowStockAlert: '5', costPerUnit: '', supplier: '', notes: ''
}

export default function InventoryPage() {
  const { user, loading: authLoading, accessToken } = useAuth()
  const router = useRouter()

  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState({ totalItems: 0, lowStockCount: 0, totalValue: 0, categoriesCount: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  // Inline quick-adjust
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/login?redirect=/admin/inventory')
      } else {
        fetchInventory()
      }
    }
  }, [user, authLoading])

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      const token = await accessToken()
      const res = await fetch('/api/inventory', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items)
      setStats(data.stats)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const headers = useCallback(async () => {
    const token = await accessToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    } as HeadersInit
  }, [accessToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const h = await headers()
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: h, body: JSON.stringify(form) })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      const saved = await res.json()
      if (editingItem) {
        setItems(prev => prev.map(i => i.id === saved.id ? saved : i))
        toast({ title: 'Updated', description: `"${saved.name}" updated successfully` })
      } else {
        setItems(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
        toast({ title: 'Added', description: `"${saved.name}" added to inventory` })
      }
      setStats(prev => ({
        ...prev,
        totalItems: editingItem ? prev.totalItems : prev.totalItems + 1,
        lowStockCount: items.concat(editingItem ? [] : [saved]).filter((i: any) => i.quantity <= i.lowStockAlert).length
      }))
      closeForm()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from inventory?`)) return
    try {
      const h = await headers()
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: h })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(prev => prev.filter(i => i.id !== id))
      toast({ title: 'Deleted', description: `"${name}" removed from inventory` })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleQuickAdjust = async (id: string, delta: number) => {
    try {
      const h = await headers()
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH', headers: h, body: JSON.stringify({ delta })
      })
      if (!res.ok) throw new Error('Failed to adjust')
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      setAdjustingId(null)
      setAdjustDelta('')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      lowStockAlert: item.lowStockAlert.toString(),
      costPerUnit: item.costPerUnit?.toString() || '',
      supplier: item.supplier || '',
      notes: item.notes || ''
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setForm({ ...emptyForm })
  }

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || i.category === categoryFilter
    const matchLow = !lowStockOnly || i.quantity <= i.lowStockAlert
    return matchSearch && matchCat && matchLow
  })

  const allCategories = ['All', ...Array.from(new Set(items.map((i: any) => i.category))).sort()]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden scroll-smooth w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()} className="h-9 px-3 flex-shrink-0">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600 flex-shrink-0" />
                <span className="truncate">Operational Inventory</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track supplies used to run the business</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={fetchInventory} className="h-9 px-3">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => { setShowForm(true); setEditingItem(null); setForm({ ...emptyForm }) }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold h-9 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border-0 shadow-sm">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
            <p className="text-xs text-gray-500 mt-1">Tracked supplies</p>
          </Card>
          <Card className={`p-5 border-0 shadow-sm ${stats.lowStockCount > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>Low Stock</p>
            <p className="text-3xl font-bold text-gray-900">{stats.lowStockCount}</p>
            <p className="text-xs text-gray-500 mt-1">Need restocking</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-sm">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Est. Value</p>
            <p className="text-3xl font-bold text-gray-900">LKR {stats.totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total inventory cost</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-sm">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Categories</p>
            <p className="text-3xl font-bold text-gray-900">{stats.categoriesCount}</p>
            <p className="text-xs text-gray-500 mt-1">Supply types</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, category, or supplier…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setLowStockOnly(p => !p)}
              className={`h-9 px-3 rounded-md text-sm font-medium border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${lowStockOnly ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Low Stock Only
            </button>
          </div>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <Boxes className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No items found</h3>
            <p className="text-sm text-gray-400">
              {items.length === 0 ? 'Add your first operational supply item to get started.' : 'Try adjusting your search or filters.'}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto scroll-smooth w-full">
              <table className="w-full table-fixed min-w-[700px]">
              <colgroup>
                <col className="w-[30%] sm:w-[28%]" />
                <col className="w-[15%] sm:w-[12%]" />
                <col className="w-[20%] sm:w-[16%]" />
                <col className="w-[15%] hidden md:table-column" />
                <col className="w-[15%] hidden lg:table-column" />
                <col className="w-[20%] sm:w-[18%]" />
              </colgroup>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Cost/Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map(item => {
                  const isLow = item.quantity <= item.lowStockAlert
                  const isOut = item.quantity === 0
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow ? 'bg-amber-50/30' : ''}`}>
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isOut ? (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-red-500" title="Out of stock" />
                          ) : isLow ? (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-400" title="Low stock" />
                          ) : (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-green-400" title="OK" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                            {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5 font-medium">{item.category}</span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3">
                        {adjustingId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={adjustDelta}
                              onChange={e => setAdjustDelta(e.target.value)}
                              placeholder="±qty"
                              className="w-16 h-7 text-xs border border-gray-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter' && adjustDelta) handleQuickAdjust(item.id, parseInt(adjustDelta))
                                if (e.key === 'Escape') { setAdjustingId(null); setAdjustDelta('') }
                              }}
                            />
                            <button
                              onClick={() => adjustDelta && handleQuickAdjust(item.id, parseInt(adjustDelta))}
                              className="h-7 w-7 flex items-center justify-center bg-teal-500 text-white rounded hover:bg-teal-600"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => { setAdjustingId(null); setAdjustDelta('') }}
                              className="h-7 w-7 flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold tabular-nums ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-gray-400">{item.unit}</span>
                            {isLow && !isOut && <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
                            {isOut && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                            {/* Quick +/- */}
                            <div className="flex items-center gap-0.5 ml-1">
                              <button
                                onClick={() => handleQuickAdjust(item.id, -1)}
                                title="Use 1"
                                className="h-5 w-5 flex items-center justify-center rounded border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item.id, 1)}
                                title="Add 1"
                                className="h-5 w-5 flex items-center justify-center rounded border border-gray-300 hover:bg-green-50 hover:border-green-300 text-gray-500 hover:text-green-600 transition-colors"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Cost/Unit */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-700 tabular-nums">
                          {item.costPerUnit ? `LKR ${Number(item.costPerUnit).toLocaleString()}` : '—'}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600 truncate">{item.supplier || '—'}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setAdjustingId(item.id); setAdjustDelta('') }}
                            title="Adjust quantity"
                            className="h-7 px-2 flex items-center gap-1 text-xs rounded border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-medium"
                          >
                            <RefreshCcw className="h-3 w-3" />
                            Adjust
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            title="Edit"
                            className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Delete"
                            className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </Card>
        )}

        {/* Add / Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto scroll-smooth">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto flex flex-col max-h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingItem ? 'Edit Item' : 'Add Inventory Item'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Operational supply for business use</p>
                </div>
                <button
                  onClick={closeForm}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto scroll-smooth flex-1 max-h-[65vh]">
                  {/* Name */}
                  <div>
                    <Label className="text-sm font-medium">Item Name *</Label>
                    <Input
                      autoFocus
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Cello Tape, Scissors, Business Cards"
                      className="mt-1.5 h-10"
                      required
                    />
                  </div>

                  {/* Category + Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Category *</Label>
                      <select
                        value={form.category}
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                        className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Unit *</Label>
                      <select
                        value={form.unit}
                        onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                        className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Quantity + Low Stock Alert */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Current Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.quantity}
                        onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                        placeholder="0"
                        className="mt-1.5 h-10"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Low Stock Alert at</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.lowStockAlert}
                        onChange={e => setForm(p => ({ ...p, lowStockAlert: e.target.value }))}
                        placeholder="5"
                        className="mt-1.5 h-10"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">Alert when qty drops below this</p>
                    </div>
                  </div>

                  {/* Cost per unit */}
                  <div>
                    <Label className="text-sm font-medium">Cost per Unit <span className="text-gray-400">(Optional — LKR)</span></Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.costPerUnit}
                      onChange={e => setForm(p => ({ ...p, costPerUnit: e.target.value }))}
                      placeholder="e.g., 25.00"
                      className="mt-1.5 h-10"
                    />
                  </div>

                  {/* Supplier */}
                  <div>
                    <Label className="text-sm font-medium">Supplier <span className="text-gray-400">(Optional)</span></Label>
                    <Input
                      value={form.supplier}
                      onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                      placeholder="e.g., Cargills Food City, Local store"
                      className="mt-1.5 h-10"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-sm font-medium">Notes <span className="text-gray-400">(Optional)</span></Label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="e.g., Used for sealing parcels before dispatch"
                      rows={2}
                      className="mt-1.5 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 sm:p-6 border-t flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
                  <Button type="button" variant="outline" onClick={closeForm} className="flex-1 h-10" disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !form.name.trim()}
                    className="flex-1 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
