'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Layers } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Category {
    id: string
    name: string
    slug: string
}

interface Subcategory {
    id: string
    name: string
    slug: string
    description?: string
    image?: string
    categoryId: string
    category: Category
    _count: {
        products: number
    }
    createdAt: string
}

export default function AdminSubcategoriesPage() {
    const { user, loading, accessToken } = useAuth()
    const router = useRouter()
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
        categoryId: '',
    })

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin') {
                router.replace('/')
            } else {
                fetchCategories()
                fetchSubcategories()
            }
        }
    }, [user, loading, router])

    const fetchCategories = async () => {
        try {
            const token = await accessToken()
            const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
            const response = await fetch('/api/categories', { headers })
            const data = await response.json()
            if (response.ok) {
                setCategories(data)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        }
    }

    const fetchSubcategories = async () => {
        try {
            const token = await accessToken()
            const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
            const response = await fetch('/api/subcategories', { headers })
            const data = await response.json()
            if (response.ok) {
                setSubcategories(data)
            }
        } catch (error) {
            console.error('Failed to fetch subcategories:', error)
        }
    }

    const handleCreateSubcategory = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await accessToken()
            const response = await fetch('/api/subcategories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                } as HeadersInit,
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setIsCreateModalOpen(false)
                setFormData({ name: '', slug: '', description: '', image: '', categoryId: '' })
                fetchSubcategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create subcategory')
            }
        } catch (error) {
            console.error('Failed to create subcategory:', error)
            alert('Failed to create subcategory')
        }
    }

    const handleEditSubcategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSubcategory) return

        try {
            const token = await accessToken()
            const response = await fetch(`/api/subcategories/${editingSubcategory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                } as HeadersInit,
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setIsEditModalOpen(false)
                setEditingSubcategory(null)
                setFormData({ name: '', slug: '', description: '', image: '', categoryId: '' })
                fetchSubcategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update subcategory')
            }
        } catch (error) {
            console.error('Failed to update subcategory:', error)
            alert('Failed to update subcategory')
        }
    }

    const handleDeleteSubcategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subcategory?')) return

        try {
            const token = await accessToken()
            const response = await fetch(`/api/subcategories/${id}`, {
                method: 'DELETE',
                headers: (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit,
            })

            if (response.ok) {
                fetchSubcategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete subcategory')
            }
        } catch (error) {
            console.error('Failed to delete subcategory:', error)
            alert('Failed to delete subcategory')
        }
    }

    const openEditModal = (subcategory: Subcategory) => {
        setEditingSubcategory(subcategory)
        setFormData({
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description || '',
            image: subcategory.image || '',
            categoryId: subcategory.categoryId,
        })
        setIsEditModalOpen(true)
    }

    if (loading || !user || user.role !== 'admin') {
        return <div className="max-w-7xl mx-auto p-6">Loading...</div>
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Layers className="h-8 w-8" />
                    Manage Subcategories
                </h1>
                <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Subcategory
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subcategories.map((subcategory) => (
                            <TableRow key={subcategory.id}>
                                <TableCell className="font-medium">{subcategory.name}</TableCell>
                                <TableCell>
                                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                                        {subcategory.category.name}
                                    </span>
                                </TableCell>
                                <TableCell>{subcategory.slug}</TableCell>
                                <TableCell>{subcategory.description || 'N/A'}</TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-600">
                                        {subcategory._count.products} products
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {subcategory.image ? (
                                        <img src={subcategory.image} alt={subcategory.name} className="w-8 h-8 object-cover rounded" />
                                    ) : '(none)'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(subcategory)}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                                            disabled={subcategory._count.products > 0}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Create Subcategory Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Subcategory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubcategory} className="space-y-4">
                        <div>
                            <Label htmlFor="category">Parent Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="name">Subcategory Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="slug">Slug *</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                                currentImageUrl={formData.image}
                                bucket="subcategories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Subcategory</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Subcategory Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subcategory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubcategory} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-category">Parent Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-name">Subcategory Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-slug">Slug *</Label>
                            <Input
                                id="edit-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                                currentImageUrl={formData.image}
                                bucket="subcategories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Update Subcategory</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
