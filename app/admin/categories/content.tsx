'use client'

import { useEffect, useState, Fragment } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, FolderOpen, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'

interface Subcategory {
    id: string
    name: string
    slug: string
    description?: string
    image?: string
    categoryId: string
    _count?: {
        products: number
    }
}

interface Category {
    id: string
    name: string
    slug: string
    description?: string
    image?: string
    createdAt: string
    subcategories?: Subcategory[]
    _count?: {
        products: number
        subcategories: number
    }
}

export default function AdminCategoriesContent() {
    const { user, loading, accessToken } = useAuth()
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
    const [isCreateSubcategoryModalOpen, setIsCreateSubcategoryModalOpen] = useState(false)
    const [isEditSubcategoryModalOpen, setIsEditSubcategoryModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
    const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<Category | null>(null)
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        slug: '',
        description: '',
        image: '',
    })
    const [subcategoryFormData, setSubcategoryFormData] = useState({
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
                // Fetch subcategories for each category
                const categoriesWithSubs = await Promise.all(
                    data.map(async (category: Category) => {
                        const subResponse = await fetch(`/api/subcategories?categoryId=${category.id}`, { headers })
                        const subcategories = subResponse.ok ? await subResponse.json() : []
                        return { ...category, subcategories }
                    })
                )
                setCategories(categoriesWithSubs)
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error)
        }
    }

    const toggleCategoryExpansion = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
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
                body: JSON.stringify(categoryFormData),
            })

            if (response.ok) {
                setIsCreateCategoryModalOpen(false)
                setCategoryFormData({ name: '', slug: '', description: '', image: '' })
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
                body: JSON.stringify(categoryFormData),
            })

            if (response.ok) {
                setIsEditCategoryModalOpen(false)
                setEditingCategory(null)
                setCategoryFormData({ name: '', slug: '', description: '', image: '' })
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

    const openEditCategoryModal = (category: Category) => {
        setEditingCategory(category)
        setCategoryFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            image: category.image || '',
        })
        setIsEditCategoryModalOpen(true)
    }

    const openCreateSubcategoryModal = (category: Category) => {
        setSelectedCategoryForSubcategory(category)
        setSubcategoryFormData({
            name: '',
            slug: '',
            description: '',
            image: '',
            categoryId: category.id,
        })
        setIsCreateSubcategoryModalOpen(true)
    }

    const openEditSubcategoryModal = (subcategory: Subcategory) => {
        setEditingSubcategory(subcategory)
        setSubcategoryFormData({
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description || '',
            image: subcategory.image || '',
            categoryId: subcategory.categoryId,
        })
        setIsEditSubcategoryModalOpen(true)
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
                body: JSON.stringify(subcategoryFormData),
            })

            if (response.ok) {
                setIsCreateSubcategoryModalOpen(false)
                setSelectedCategoryForSubcategory(null)
                setSubcategoryFormData({ name: '', slug: '', description: '', image: '', categoryId: '' })
                fetchCategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create subcategory')
            }
        } catch (error) {
            console.error('Failed to create subcategory:', error)
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
                body: JSON.stringify(subcategoryFormData),
            })

            if (response.ok) {
                setIsEditSubcategoryModalOpen(false)
                setEditingSubcategory(null)
                setSubcategoryFormData({ name: '', slug: '', description: '', image: '', categoryId: '' })
                fetchCategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update subcategory')
            }
        } catch (error) {
            console.error('Failed to update subcategory:', error)
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
                fetchCategories()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete subcategory')
            }
        } catch (error) {
            console.error('Failed to delete subcategory:', error)
        }
    }

    if (loading || !user || user.role !== 'admin') {
        return <div className="max-w-7xl mx-auto p-6">Loading...</div>
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FolderOpen className="h-8 w-8" />
                    Manage Categories & Subcategories
                </h1>
                <Button onClick={() => setIsCreateCategoryModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Subcategories</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <Fragment key={category.id}>
                                {/* Category Row */}
                                <TableRow className="bg-gray-50">
                                    <TableCell>
                                        <button
                                            onClick={() => toggleCategoryExpansion(category.id)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                        >
                                            {expandedCategories.has(category.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </button>
                                    </TableCell>
                                    <TableCell className="font-bold">{category.name}</TableCell>
                                    <TableCell>{category.description || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">
                                                {category.subcategories?.length || 0} subcategories
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openCreateSubcategoryModal(category)}
                                                className="h-6 px-2"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {category.image ? (
                                            <img src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded" />
                                        ) : '(none)'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openEditCategoryModal(category)}>
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Subcategory Rows (Expandable) */}
                                {expandedCategories.has(category.id) && category.subcategories && category.subcategories.length > 0 && (
                                    category.subcategories.map((subcategory) => (
                                        <TableRow key={subcategory.id} className="bg-blue-50/30">
                                            <TableCell></TableCell>
                                            <TableCell className="pl-8">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="h-3 w-3 text-gray-400" />
                                                    <span className="text-sm">{subcategory.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{subcategory.description || 'N/A'}</TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {subcategory._count?.products || 0} products
                                            </TableCell>
                                            <TableCell>
                                                {subcategory.image ? (
                                                    <img src={subcategory.image} alt={subcategory.name} className="w-6 h-6 object-cover rounded" />
                                                ) : '(none)'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => openEditSubcategoryModal(subcategory)}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteSubcategory(subcategory.id)}
                                                        disabled={(subcategory._count?.products || 0) > 0}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Create Category Modal */}
            <Dialog open={isCreateCategoryModalOpen} onOpenChange={setIsCreateCategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                value={categoryFormData.name}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={categoryFormData.slug}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={categoryFormData.description}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setCategoryFormData({ ...categoryFormData, image: url })}
                                currentImageUrl={categoryFormData.image}
                                bucket="categories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateCategoryModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Category</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Category Modal */}
            <Dialog open={isEditCategoryModalOpen} onOpenChange={setIsEditCategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditCategory} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Category Name</Label>
                            <Input
                                id="edit-name"
                                value={categoryFormData.name}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-slug">Slug</Label>
                            <Input
                                id="edit-slug"
                                value={categoryFormData.slug}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={categoryFormData.description}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setCategoryFormData({ ...categoryFormData, image: url })}
                                currentImageUrl={categoryFormData.image}
                                bucket="categories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditCategoryModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Update Category</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Subcategory Modal */}
            <Dialog open={isCreateSubcategoryModalOpen} onOpenChange={setIsCreateSubcategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Add Subcategory to {selectedCategoryForSubcategory?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubcategory} className="space-y-4">
                        <div>
                            <Label htmlFor="sub-name">Subcategory Name</Label>
                            <Input
                                id="sub-name"
                                value={subcategoryFormData.name}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="sub-slug">Slug</Label>
                            <Input
                                id="sub-slug"
                                value={subcategoryFormData.slug}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="sub-description">Description</Label>
                            <Textarea
                                id="sub-description"
                                value={subcategoryFormData.description}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setSubcategoryFormData({ ...subcategoryFormData, image: url })}
                                currentImageUrl={subcategoryFormData.image}
                                bucket="subcategories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateSubcategoryModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Subcategory</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Subcategory Modal */}
            <Dialog open={isEditSubcategoryModalOpen} onOpenChange={setIsEditSubcategoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subcategory</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubcategory} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-sub-name">Subcategory Name</Label>
                            <Input
                                id="edit-sub-name"
                                value={subcategoryFormData.name}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-sub-slug">Slug</Label>
                            <Input
                                id="edit-sub-slug"
                                value={subcategoryFormData.slug}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-sub-description">Description</Label>
                            <Textarea
                                id="edit-sub-description"
                                value={subcategoryFormData.description}
                                onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <ImageUpload
                                onUploadComplete={(url) => setSubcategoryFormData({ ...subcategoryFormData, image: url })}
                                currentImageUrl={subcategoryFormData.image}
                                bucket="subcategories"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditSubcategoryModalOpen(false)}>
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
