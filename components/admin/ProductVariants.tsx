'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, X, Trash2, Copy, Edit2, Sparkles, Upload, Loader2, ImageIcon, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ProductVariant {
    id?: string
    sku: string
    name: string
    attributes: Record<string, string>
    priceOverride?: number | null
    stock: number
    image?: string | null
    images?: string[]
    discount?: number
}

interface ProductVariantsProps {
    variants: ProductVariant[]
    onChange: (variants: ProductVariant[]) => void
    basePrice: number
    currency?: string
    existingImages?: { url: string }[]
}

// Preset attribute options
const PRESET_ATTRIBUTES = {
    Color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Multicolor', 'Gold', 'Silver'],
    Size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'],
    Material: ['Cotton', 'Polyester', 'Silk', 'Leather', 'Wool', 'Denim', 'Linen', 'Velvet', 'Satin'],
    Style: ['Classic', 'Modern', 'Vintage', 'Casual', 'Formal', 'Sport', 'Boho', 'Chic']
}

export function ProductVariants({
    variants,
    onChange,
    basePrice,
    currency = 'LKR',
    existingImages = []
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
        images: [],
        discount: 0 // Local UI helper only
    })

    // For Attribute Selection
    const [selectedAttrType, setSelectedAttrType] = useState<string>('')
    const [selectedAttrValue, setSelectedAttrValue] = useState<string>('')
    const [customAttrType, setCustomAttrType] = useState('')
    const [customAttrValue, setCustomAttrValue] = useState('')

    const [uploading, setUploading] = useState(false)

    // Auto-generate variant name from attributes
    useEffect(() => {
        if (Object.keys(formData.attributes).length > 0 && (!formData.name || !editingIndex)) {
            const attrValues = Object.values(formData.attributes).join(' - ')
            if (!editingIndex || formData.name === '') {
                setFormData(prev => ({ ...prev, name: attrValues }))
            }
        }
    }, [formData.attributes, editingIndex])

    // Auto-generate SKU suggestion
    const generateSKUSuggestion = () => {
        const attrShort = Object.values(formData.attributes)
            .map(v => v.substring(0, 3).toUpperCase())
            .join('-')
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `VAR-${attrShort}-${randomSuffix}`.substring(0, 30)
    }

    const handleAddAttribute = () => {
        const type = selectedAttrType === 'Custom' ? customAttrType : selectedAttrType
        const value = selectedAttrType === 'Custom' ? customAttrValue : (selectedAttrValue === 'Custom' ? customAttrValue : selectedAttrValue)

        if (!type.trim() || !value.trim()) {
            toast({ title: 'Error', description: 'Please select or enter both attribute type and value', variant: 'destructive' })
            return
        }

        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [type.trim()]: value.trim()
            }
        }))

        // Reset inputs
        if (selectedAttrType !== 'Custom') {
            setSelectedAttrValue('')
        } else {
            setCustomAttrType('')
            setCustomAttrValue('')
        }
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

    const handleSelectExistingImage = (url: string) => {
        if (formData.images?.includes(url)) return

        setFormData(prev => {
            const newImages = [...(prev.images || []), url]
            return {
                ...prev,
                images: newImages,
                image: newImages[0] || null
            }
        })
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
        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Variant name is required', variant: 'destructive' })
            return
        }

        if (Object.keys(formData.attributes).length === 0) {
            toast({ title: 'Error', description: 'Please add at least one attribute (e.g., Color, Size)', variant: 'destructive' })
            return
        }

        // Auto generate SKU if missing
        let processedData = { ...formData }
        if (!processedData.sku.trim()) {
            processedData.sku = generateSKUSuggestion()
        }

        // Check for duplicate SKU
        const duplicateSKU = variants.some((v, i) =>
            v.sku === processedData.sku && i !== editingIndex
        )
        // If duplicate, append random string
        if (duplicateSKU) {
            processedData.sku = `${processedData.sku}-${Math.floor(Math.random() * 1000)}`
        }

        const newVariants = [...variants]
        if (editingIndex !== null) {
            newVariants[editingIndex] = processedData
        } else {
            newVariants.push(processedData)
        }

        onChange(newVariants)
        handleCancelForm()
    }

    const handleEditVariant = (index: number) => {
        const variant = variants[index]
        const currentPrice = variant.priceOverride ?? basePrice
        const discount = basePrice > 0 ? Math.round(((basePrice - currentPrice) / basePrice) * 100) : 0

        setFormData({
            ...variant,
            discount: discount > 0 ? discount : 0
        })
        setEditingIndex(index)
        setShowForm(true)
    }

    const handleDuplicateVariant = (index: number) => {
        const variant = variants[index]
        setFormData({
            ...variant,
            sku: `${variant.sku}-COPY-${Math.floor(Math.random() * 100)}`,
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
            images: [],
            discount: 0
        })
        setSelectedAttrType('')
        setSelectedAttrValue('')
        setCustomAttrType('')
        setCustomAttrValue('')
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            {!showForm && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-pink-100 rounded-lg text-pink-600">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <h3 className="font-semibold text-gray-900">Product Variants</h3>
                            <p className="text-xs text-gray-500">{variants.length} active variant{variants.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Variant
                    </Button>
                </div>
            )}

            {/* Existing Variants List */}
            {variants.length > 0 && !showForm && (
                <div className="space-y-3">
                    {variants.map((variant, index) => (
                        <div key={index} className="group flex flex-col sm:flex-row gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-pink-200">
                            {/* Variant Image */}
                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                                {variant.image ? (
                                    <Image
                                        src={variant.image}
                                        alt={variant.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="h-8 w-8" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900 truncate pr-4">{variant.name}</h4>
                                            <p className="text-xs text-gray-500 font-mono mt-1">SKU: {variant.sku}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEditVariant(index)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-green-600" onClick={() => handleDuplicateVariant(index)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDeleteVariant(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {Object.entries(variant.attributes).map(([key, value]) => (
                                            <div key={key} className="flex items-center text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                                                <span className="text-gray-500 mr-1">{key}:</span>
                                                <span className="font-medium text-gray-900">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between mt-4">
                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Price</span>
                                            <span className="font-semibold text-gray-900">
                                                {currency} {(variant.priceOverride || basePrice).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Stock</span>
                                            <span className={`font-semibold ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {variant.stock}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="p-0 overflow-hidden border-2 border-pink-100 shadow-xl rounded-xl animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                {editingIndex !== null ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{editingIndex !== null ? 'Edit Variant' : 'Create Variant'}</h3>
                                <p className="text-xs text-gray-500">Configure variant details and attributes</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleCancelForm} className="h-8 w-8 p-0 rounded-full hover:bg-gray-200">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Attributes & Info */}
                        <div className="space-y-6">
                            {/* Attribute Selector */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                <Label className="text-sm font-bold text-blue-900">1. Variant Attributes</Label>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">Type</Label>
                                        <Select
                                            value={selectedAttrType}
                                            onValueChange={(val) => {
                                                setSelectedAttrType(val)
                                                setSelectedAttrValue('')
                                            }}
                                        >
                                            <SelectTrigger className="h-9 bg-white border-blue-200">
                                                <SelectValue placeholder="Attribute" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(PRESET_ATTRIBUTES).map(key => (
                                                    <SelectItem key={key} value={key}>{key}</SelectItem>
                                                ))}
                                                <SelectItem value="Custom">+ Custom Type</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {selectedAttrType === 'Custom' && (
                                            <Input
                                                placeholder="e.g. Fabric"
                                                value={customAttrType}
                                                onChange={e => setCustomAttrType(e.target.value)}
                                                className="h-9 mt-1"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">Value</Label>
                                        {selectedAttrType && selectedAttrType !== 'Custom' ? (
                                            <Select
                                                value={selectedAttrValue}
                                                onValueChange={(val) => {
                                                    if (val === 'Custom_Value_Option') {
                                                        setSelectedAttrValue('Custom') // Logic to show input
                                                    } else {
                                                        setSelectedAttrValue(val)
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-9 bg-white border-blue-200">
                                                    <SelectValue placeholder="Value" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRESET_ATTRIBUTES[selectedAttrType as keyof typeof PRESET_ATTRIBUTES].map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                    <SelectItem value="Custom">+ Custom Value</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="h-9 flex items-center text-xs text-gray-400 italic px-2 border border-transparent">
                                                Select Type first
                                            </div>
                                        )}

                                        {(selectedAttrValue === 'Custom' || selectedAttrType === 'Custom') && (
                                            <Input
                                                placeholder="e.g. Silk"
                                                value={customAttrValue}
                                                onChange={e => setCustomAttrValue(e.target.value)}
                                                className="h-9 mt-1"
                                            />
                                        )}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleAddAttribute}
                                    variant="secondary"
                                    className="w-full h-9 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                    Add Attribute
                                </Button>

                                {/* Selected Attributes Chips */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {Object.entries(formData.attributes).map(([key, value]) => (
                                        <Badge key={key} className="bg-white border border-blue-200 text-blue-800 pointer-events-none pl-2 pr-1 py-1 h-7 flex items-center gap-1">
                                            <span>{key}: <span className="font-bold">{value}</span></span>
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleRemoveAttribute(key); }}
                                                className="pointer-events-auto h-5 w-5 rounded-full hover:bg-red-50 hover:text-red-500 flex items-center justify-center ml-1 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {Object.keys(formData.attributes).length === 0 && (
                                        <div className="text-xs text-gray-400 italic text-center w-full">No attributes added yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Details */}
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-gray-900">2. Variant Details</Label>

                                <div>
                                    <Label className="text-xs font-medium text-gray-600">Variant Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1"
                                        placeholder="e.g. Red - Large"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600">SKU</Label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                value={formData.sku}
                                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                placeholder="Auto-generated"
                                                className="font-mono text-xs"
                                            />
                                            <Button type="button" variant="outline" size="icon" onClick={() => setFormData({ ...formData, sku: generateSKUSuggestion() })} title="Regenerate SKU">
                                                <Sparkles className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600">Stock</Label>
                                        <Input
                                            type="number"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            className="mt-1"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-medium text-gray-600">Price Override</Label>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{currency}</span>
                                            <Input
                                                type="number"
                                                step="1"
                                                value={formData.priceOverride ?? ''}
                                                onChange={e => {
                                                    const val = e.target.value
                                                    const newPrice = val ? parseFloat(val) : null
                                                    let newDiscount = 0
                                                    if (newPrice !== null && basePrice > 0 && newPrice < basePrice) {
                                                        newDiscount = ((basePrice - newPrice) / basePrice) * 100
                                                    }
                                                    setFormData({
                                                        ...formData,
                                                        priceOverride: newPrice,
                                                        discount: Math.round(newDiscount)
                                                    })
                                                }}
                                                className="pl-12"
                                                placeholder={`${basePrice}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-medium text-gray-600">Discount (%)</Label>
                                        <div className="relative mt-1">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.discount || ''}
                                                onChange={e => {
                                                    const val = e.target.value
                                                    const newDiscount = val ? parseFloat(val) : 0
                                                    let newPrice = null
                                                    if (newDiscount > 0) {
                                                        newPrice = Math.round(basePrice * (1 - newDiscount / 100))
                                                    }
                                                    setFormData({
                                                        ...formData,
                                                        discount: newDiscount,
                                                        priceOverride: newPrice
                                                    })
                                                }}
                                                placeholder="0%"
                                                className="pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Base Price: {currency} {basePrice?.toLocaleString()}
                                    {formData.priceOverride && formData.priceOverride < basePrice && (
                                        <span className="text-green-600 ml-1 font-medium">
                                            (Standard Save: {currency} {(basePrice - formData.priceOverride).toLocaleString()})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Images */}
                        <div className="space-y-6">
                            <Label className="text-sm font-bold text-gray-900">3. Variant Images</Label>

                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">Upload New</TabsTrigger>
                                    <TabsTrigger value="existing">Select Existing</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="mt-4">
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                                        <input
                                            type="file"
                                            id="variant-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleUploadImage}
                                            disabled={uploading}
                                        />
                                        <label htmlFor="variant-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            {uploading ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                            )}
                                            <p className="text-sm font-medium text-gray-900">Click to upload images</p>
                                            <p className="text-xs text-gray-500">JPG, PNG, WebP up to 5MB</p>
                                        </label>
                                    </div>
                                </TabsContent>
                                <TabsContent value="existing" className="mt-4">
                                    {existingImages.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                                            {existingImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSelectExistingImage(img.url)}
                                                    className="relative aspect-square border rounded-md overflow-hidden hover:ring-2 hover:ring-pink-500 focus:outline-none"
                                                >
                                                    <Image src={img.url} alt="Product" fill className="object-cover" />
                                                    {formData.images?.includes(img.url) && (
                                                        <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                                            <div className="bg-pink-500 text-white rounded-full p-0.5"><Check className="h-3 w-3" /></div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-8">No main product images available</p>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Selected Images Grid */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">Selected Images ({formData.images?.length || 0})</Label>
                                {formData.images && formData.images.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {formData.images.map((url, idx) => (
                                            <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                                <Image src={url} alt="Variant" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                <button
                                                    onClick={() => handleRemoveVariantImage(idx)}
                                                    className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {idx === 0 && (
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">Primary</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200">
                                        No images selected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3">
                        <Button variant="outline" onClick={handleCancelForm} type="button">Cancel</Button>
                        <Button onClick={handleSaveVariant} type="button" className="bg-pink-600 hover:bg-pink-700 text-white">
                            {editingIndex !== null ? 'Update Variant' : 'Save Variant'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {variants.length === 0 && !showForm && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <PackageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">No Variants Added</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4">Create variants to offer different options like colors, sizes, or materials for this product.</p>
                    <Button onClick={() => setShowForm(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Variant
                    </Button>
                </div>
            )}
        </div>
    )
}

function PackageIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22v-10" />
        </svg>
    )
}
