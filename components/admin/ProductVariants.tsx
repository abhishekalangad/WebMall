'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, X, Trash2, Copy, Edit2, Sparkles, Upload, Loader2, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export interface ProductVariant {
    id?: string
    sku: string
    name: string
    attributes: Record<string, string>
    priceOverride?: number | null
    stock: number
    image?: string | null
    images?: string[]
}

interface ProductVariantsProps {
    variants: ProductVariant[]
    onChange: (variants: ProductVariant[]) => void
    basePrice: number
    currency?: string
}

// Preset attribute options
const PRESET_ATTRIBUTES = {
    Color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Multicolor'],
    Size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    Material: ['Cotton', 'Polyester', 'Silk', 'Leather', 'Wool', 'Denim', 'Linen'],
    Style: ['Classic', 'Modern', 'Vintage', 'Casual', 'Formal', 'Sport']
}

export function ProductVariants({
    variants,
    onChange,
    basePrice,
    currency = 'LKR'
}: ProductVariantsProps) {
    const { accessToken } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [formData, setFormData] = useState<ProductVariant>({
        sku: '',
        name: '',
        attributes: {},
        priceOverride: null,
        stock: 0,
        image: null,
        images: []
    })
    const [selectedAttributeType, setSelectedAttributeType] = useState('')
    const [customAttributeKey, setCustomAttributeKey] = useState('')
    const [customAttributeValue, setCustomAttributeValue] = useState('')
    const [uploading, setUploading] = useState(false)

    // Auto-generate variant name from attributes
    useEffect(() => {
        if (Object.keys(formData.attributes).length > 0 && !editingIndex) {
            const attrValues = Object.values(formData.attributes).join(' - ')
            setFormData(prev => ({ ...prev, name: attrValues }))
        }
    }, [formData.attributes, editingIndex])

    // Auto-generate SKU suggestion
    const generateSKUSuggestion = () => {
        const attrShort = Object.values(formData.attributes)
            .map(v => v.substring(0, 3).toUpperCase())
            .join('-')
        return `VAR-${attrShort}`.substring(0, 20)
    }

    const handleAddPresetAttribute = (type: string, value: string) => {
        setFormData({
            ...formData,
            attributes: {
                ...formData.attributes,
                [type]: value
            }
        })
    }

    const handleAddCustomAttribute = () => {
        if (!customAttributeKey.trim() || !customAttributeValue.trim()) return

        setFormData({
            ...formData,
            attributes: {
                ...formData.attributes,
                [customAttributeKey.trim()]: customAttributeValue.trim()
            }
        })
        setCustomAttributeKey('')
        setCustomAttributeValue('')
        setSelectedAttributeType('')
    }

    const handleRemoveAttribute = (key: string) => {
        const newAttributes = { ...formData.attributes }
        delete newAttributes[key]
        setFormData({ ...formData, attributes: newAttributes })
    }

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Validate all files
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                toast({ title: 'Error', description: `${file.name} is not an image`, variant: 'destructive' })
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: 'Error', description: `${file.name} is larger than 5MB`, variant: 'destructive' })
                return
            }
        }

        setUploading(true)
        try {
            const token = await accessToken()

            const uploadPromises = files.map(async (file) => {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                formDataUpload.append('bucket', 'products')

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formDataUpload
                })

                if (!res.ok) throw new Error(`Upload failed for ${file.name}`)
                const data = await res.json()
                return data.url
            })

            const urls = await Promise.all(uploadPromises)

            setFormData(prev => {
                const newImages = [...(prev.images || []), ...urls]
                return {
                    ...prev,
                    images: newImages,
                    // Keep the single image field in sync with the first image for backward compatibility
                    image: newImages[0] || null
                }
            })

            toast({ title: 'Success', description: `${urls.length} image(s) uploaded` })
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to upload images', variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveVariantImage = (index: number) => {
        setFormData(prev => {
            const newImages = (prev.images || []).filter((_, i) => i !== index)
            return {
                ...prev,
                images: newImages,
                image: newImages[0] || null
            }
        })
    }

    const handleSaveVariant = () => {
        // Validate
        if (!formData.sku.trim()) {
            toast({ title: 'Error', description: 'SKU is required', variant: 'destructive' })
            return
        }

        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Variant name is required', variant: 'destructive' })
            return
        }

        if (Object.keys(formData.attributes).length === 0) {
            toast({ title: 'Error', description: 'Please add at least one attribute (e.g., Color, Size)', variant: 'destructive' })
            return
        }

        // Check for duplicate SKU
        const duplicateSKU = variants.some((v, i) =>
            v.sku === formData.sku && i !== editingIndex
        )
        if (duplicateSKU) {
            toast({ title: 'Error', description: 'SKU already exists. Please use a unique SKU.', variant: 'destructive' })
            return
        }

        const newVariants = [...variants]
        if (editingIndex !== null) {
            newVariants[editingIndex] = formData
        } else {
            newVariants.push(formData)
        }

        onChange(newVariants)
        handleCancelForm()
    }

    const handleEditVariant = (index: number) => {
        setFormData(variants[index])
        setEditingIndex(index)
        setShowForm(true)
    }

    const handleDuplicateVariant = (index: number) => {
        const variant = variants[index]
        setFormData({
            ...variant,
            sku: `${variant.sku}-COPY`,
            name: `${variant.name} (Copy)`
        })
        setEditingIndex(null)
        setShowForm(true)
    }

    const handleDeleteVariant = (index: number) => {
        if (!confirm('Delete this variant?')) return
        onChange(variants.filter((_, i) => i !== index))
    }

    const handleCancelForm = () => {
        setShowForm(false)
        setEditingIndex(null)
        setFormData({
            sku: '',
            name: '',
            attributes: {},
            priceOverride: null,
            stock: 0,
            image: null,
            images: []
        })
        setSelectedAttributeType('')
        setCustomAttributeKey('')
        setCustomAttributeValue('')
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            {!showForm && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="p-1 px-2 bg-pink-50 rounded-lg border border-pink-100 inline-block w-fit">
                        {variants.length > 0 ? (
                            <p className="text-xs font-medium text-pink-700">
                                {variants.length} Variant{variants.length !== 1 ? 's' : ''} Created
                            </p>
                        ) : (
                            <p className="text-xs font-medium text-gray-500">No variants added yet</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold border-none w-full sm:w-auto shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                    </Button>
                </div>
            )}

            {/* Existing Variants List */}
            {variants.length > 0 && !showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variants.map((variant, index) => (
                        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                                {/* Variant Image Preview */}
                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                                    {variant.image ? (
                                        <Image
                                            src={variant.image}
                                            alt={variant.name}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 flex-1">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm truncate">{variant.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] font-mono">
                                                    {variant.sku}
                                                </Badge>
                                                <span className="text-[10px] text-gray-400">
                                                    {variant.images?.length || (variant.image ? 1 : 0)} photos
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 bg-gray-50 p-1 rounded-md border self-end sm:self-start">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDuplicateVariant(index)}
                                                className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm"
                                                title="Duplicate"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditVariant(index)}
                                                className="h-7 w-7 p-0 hover:bg-white hover:shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteVariant(index)}
                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-white hover:shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Attributes */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(variant.attributes).map(([key, value]) => (
                                            <Badge key={key} className="bg-pink-100 text-pink-700 text-xs">
                                                {key}: {value}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                                        <span className="font-medium text-gray-700">
                                            {currency} {(variant.priceOverride || basePrice).toLocaleString()}
                                            {variant.priceOverride && (
                                                <span className="text-gray-400 ml-1">(override)</span>
                                            )}
                                        </span>
                                        <span className={`font-medium ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {variant.stock} units
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="p-4 sm:p-6 space-y-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50/30 to-yellow-50/30">
                    {/* Form Header */}
                    <div className="flex items-center justify-between pb-3 border-b">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-pink-500" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingIndex !== null ? 'Edit Variant' : 'Add New Variant'}
                            </h3>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelForm}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Attributes */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <svg className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Variant Attributes *
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose from presets or add custom attributes
                                </p>
                            </div>

                            {/* Selected Attributes */}
                            {Object.keys(formData.attributes).length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border">
                                    {Object.entries(formData.attributes).map(([key, value]) => (
                                        <Badge key={key} className="bg-pink-100 text-pink-700 text-sm py-1.5 px-3">
                                            {key}: {value}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttribute(key)}
                                                className="ml-2 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Preset Attributes */}
                            <div className="space-y-3">
                                {Object.entries(PRESET_ATTRIBUTES).map(([type, options]) => {
                                    const hasThisType = type in formData.attributes
                                    return (
                                        <div key={type} className="space-y-2">
                                            <Label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                                {type}
                                                {hasThisType && <Badge variant="outline" className="text-xs">Selected</Badge>}
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {options.map(value => {
                                                    const isSelected = formData.attributes[type] === value
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => handleAddPresetAttribute(type, value)}
                                                            className={`text-xs py-2 px-3 rounded-md border transition-all whitespace-nowrap min-w-[60px] ${isSelected
                                                                ? 'bg-pink-500 text-white border-pink-600 shadow-sm'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300 hover:bg-pink-50'
                                                                }`}
                                                        >
                                                            {value}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Custom Attribute */}
                            <div className="pt-3 border-t">
                                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                                    Or Add Custom Attribute
                                </Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Type (e.g., Pattern)"
                                        value={customAttributeKey}
                                        onChange={(e) => setCustomAttributeKey(e.target.value)}
                                        className="w-full sm:flex-1 h-9 text-sm"
                                    />
                                    <div className="flex gap-2 w-full sm:flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Value (e.g., Striped)"
                                            value={customAttributeValue}
                                            onChange={(e) => setCustomAttributeValue(e.target.value)}
                                            className="flex-1 h-9 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddCustomAttribute}
                                            className="h-9 px-3 bg-pink-50 hover:bg-pink-100 border-pink-200"
                                            disabled={!customAttributeKey.trim() || !customAttributeValue.trim()}
                                        >
                                            <Plus className="h-4 w-4 text-pink-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Details & Image */}
                        <div className="space-y-6">
                            {/* Variant Image */}
                            <div>
                                <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                                    <ImageIcon className="h-4 w-4 text-pink-500" />
                                    Variant Images
                                </Label>

                                <div className="space-y-4">
                                    {/* Image Grid */}
                                    {(formData.images && formData.images.length > 0) && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {formData.images.map((url, index) => (
                                                <div key={index} className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200">
                                                    <Image
                                                        src={url}
                                                        alt={`Variant ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVariantImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                    {index === 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white py-0.5 text-center">
                                                            Primary
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            id="variant-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleUploadImage}
                                            disabled={uploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-24 border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:border-pink-400 hover:bg-pink-50/50 transition-all"
                                            onClick={() => document.getElementById('variant-image-upload')?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                                                    <span className="text-xs font-medium text-gray-500">Uploading...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="h-6 w-6 text-pink-500" />
                                                    <span className="text-xs font-medium text-gray-700">Add Images</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <p className="text-[11px] text-gray-500 italic">
                                        Tip: You can upload multiple images. The first image will be used as primary.
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="variant-sku" className="text-sm">
                                        SKU * <span className="text-gray-400">(Unique Identifier)</span>
                                    </Label>
                                    <div className="flex gap-2 mt-1.5">
                                        <Input
                                            id="variant-sku"
                                            type="text"
                                            placeholder="e.g., TSHIRT-RED-L"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            className="flex-1"
                                        />
                                        {Object.keys(formData.attributes).length > 0 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFormData({ ...formData, sku: generateSKUSuggestion() })}
                                                title="Auto-generate SKU"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="variant-name" className="text-sm">
                                        Variant Name * <span className="text-gray-400">(Display Name)</span>
                                    </Label>
                                    <Input
                                        id="variant-name"
                                        type="text"
                                        placeholder="Auto-generated from attributes"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1.5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="variant-price" className="text-sm">
                                            Price Override
                                        </Label>
                                        <Input
                                            id="variant-price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={`Base: ${currency} ${basePrice.toLocaleString()}`}
                                            value={formData.priceOverride || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                priceOverride: e.target.value ? parseFloat(e.target.value) : null
                                            })}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="variant-stock" className="text-sm">
                                            Stock Count *
                                        </Label>
                                        <Input
                                            id="variant-stock"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelForm}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveVariant}
                            className="w-full sm:w-auto bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
                        >
                            {editingIndex !== null ? 'Update Variant' : 'Add Variant'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {variants.length === 0 && !showForm && (
                <Card className="p-8 text-center border-dashed border-2 bg-gray-50">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-1">No variants yet</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Add variants to offer different options like colors, sizes, or materials
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-pink-50 to-yellow-50"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Variant
                    </Button>
                </Card>
            )}
        </div>
    )
}
