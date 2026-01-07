'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, X, Trash2, Copy, Edit2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface ProductVariant {
    id?: string
    sku: string
    name: string
    attributes: Record<string, string>
    priceOverride?: number | null
    stock: number
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
    const [showForm, setShowForm] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [formData, setFormData] = useState<ProductVariant>({
        sku: '',
        name: '',
        attributes: {},
        priceOverride: null,
        stock: 0
    })
    const [selectedAttributeType, setSelectedAttributeType] = useState('')
    const [customAttributeKey, setCustomAttributeKey] = useState('')
    const [customAttributeValue, setCustomAttributeValue] = useState('')

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

    const handleSaveVariant = () => {
        // Validate
        if (!formData.sku.trim()) {
            alert('SKU is required')
            return
        }

        if (!formData.name.trim()) {
            alert('Variant name is required')
            return
        }

        if (Object.keys(formData.attributes).length === 0) {
            alert('Please add at least one attribute (e.g., Color, Size)')
            return
        }

        // Check for duplicate SKU
        const duplicateSKU = variants.some((v, i) =>
            v.sku === formData.sku && i !== editingIndex
        )
        if (duplicateSKU) {
            alert('SKU already exists. Please use a unique SKU.')
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
            stock: 0
        })
        setSelectedAttributeType('')
        setCustomAttributeKey('')
        setCustomAttributeValue('')
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            {!showForm && (
                <div className="flex items-center justify-between">
                    <div>
                        {variants.length > 0 && (
                            <p className="text-sm text-gray-600">
                                {variants.length} variant{variants.length !== 1 ? 's' : ''} created
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-pink-50 to-yellow-50 border-pink-200 hover:from-pink-100 hover:to-yellow-100"
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
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-sm">{variant.name}</h4>
                                        <Badge variant="secondary" className="text-xs mt-1">
                                            {variant.sku}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDuplicateVariant(index)}
                                            className="h-7 w-7 p-0"
                                            title="Duplicate"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditVariant(index)}
                                            className="h-7 w-7 p-0"
                                            title="Edit"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteVariant(index)}
                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
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

                    {/* Section 1: Variant Attributes */}
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

                        {/* Selected Attributes Display */}
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
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {options.map(value => {
                                                const isSelected = formData.attributes[type] === value
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => handleAddPresetAttribute(type, value)}
                                                        className={`text-xs py-2 px-3 rounded-md border transition-all ${isSelected
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
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Type (e.g., Pattern)"
                                    value={customAttributeKey}
                                    onChange={(e) => setCustomAttributeKey(e.target.value)}
                                    className="flex-1 h-9 text-sm"
                                />
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
                                    className="h-9"
                                    disabled={!customAttributeKey.trim() || !customAttributeValue.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Variant Details */}
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-sm font-semibold flex items-center gap-2">
                            <svg className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Variant Details
                        </Label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="variant-price" className="text-sm">
                                    Price Override <span className="text-gray-400">(Optional)</span>
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
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to use base price
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="variant-stock" className="text-sm">
                                    Stock Quantity *
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
                                {formData.stock > 0 && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {formData.stock} units available
                                    </p>
                                )}
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
