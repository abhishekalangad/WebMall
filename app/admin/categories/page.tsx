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
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  createdAt: string
}

export default function AdminCategoriesPage() {
  const { user, loading, accessToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  })

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/')
      } else {
        fetchCategories()
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = await accessToken()
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({ name: '', slug: '', description: '', image: '' })
        fetchCategories()
      } else {
        alert('Failed to create category')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const token = await accessToken()
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setEditingCategory(null)
        setFormData({ name: '', slug: '', description: '', image: '' })
        fetchCategories()
      } else {
        alert('Failed to update category')
      }
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const token = await accessToken()
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit,
      })

      if (response.ok) {
        fetchCategories()
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
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
          <FolderOpen className="h-8 w-8" />
          Manage Categories
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.description || 'N/A'}</TableCell>
                <TableCell>
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded" />
                  ) : '(none)'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(category)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Category Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
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
                bucket="categories"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
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
                bucket="categories"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
