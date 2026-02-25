'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X, Upload, Loader2, GripVertical, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ProductImage {
    url: string
    alt?: string
    position: number
}

interface MultiImageUploadProps {
    images: ProductImage[]
    onChange: (images: ProductImage[]) => void
    maxImages?: number
}

export function MultiImageUpload({ images, onChange, maxImages = 8 }: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const { accessToken } = useAuth()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Check if adding these files would exceed max
        if (images.length + files.length > maxImages) {
            toast({
                title: 'Too many images',
                description: `You can only upload ${maxImages} images per product`,
                variant: 'destructive'
            })
            return
        }

        setUploading(true)

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                // Validate file
                if (!file.type.startsWith('image/')) {
                    throw new Error(`${file.name} is not an image`)
                }
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`${file.name} is too large (max 5MB)`)
                }

                // Create form data
                const formData = new FormData()
                formData.append('file', file)
                formData.append('bucket', 'products')

                // Upload
                const token = await accessToken()
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData
                })

                if (!res.ok) {
                    const error = await res.json()
                    throw new Error(error.error || 'Upload failed')
                }

                const data = await res.json()
                return data.url
            })

            const urls = await Promise.all(uploadPromises)

            // Add new images with positions
            const newImages: ProductImage[] = urls.map((url, index) => ({
                url,
                alt: '',
                position: images.length + index
            }))

            onChange([...images, ...newImages])

            toast({
                title: 'Success',
                description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`
            })
        } catch (error: any) {
            console.error('Upload error:', error)
            toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setUploading(false)
            e.target.value = '' // Reset input
        }
    }

    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        // Reindex positions
        newImages.forEach((img, i) => img.position = i)
        onChange(newImages)
    }

    const handleMoveImage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= images.length) return

        const newImages = [...images]
        const [movedItem] = newImages.splice(fromIndex, 1)
        newImages.splice(toIndex, 0, movedItem)

        // Reindex positions
        newImages.forEach((img, i) => img.position = i)
        onChange(newImages)
    }

    const handleUpdateAlt = (index: number, alt: string) => {
        const newImages = [...images]
        newImages[index].alt = alt
        onChange(newImages)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                    Product Images ({images.length}/{maxImages})
                </Label>
                {images.length < maxImages && (
                    <div>
                        <input
                            type="file"
                            id="multi-image-upload"
                            multiple
                            accept="image/*, .heic, .heif"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('multi-image-upload')?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add Images
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {images.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                    <label
                        htmlFor="multi-image-upload"
                        className="flex flex-col items-center justify-center py-12 px-4 cursor-pointer"
                    >
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload product images
                        </p>
                        <p className="text-xs text-gray-500">
                            PNG, JPG, WebP, HEIC (iPhone) up to 5MB (max {maxImages} images)
                        </p>
                    </label>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((image, index) => (
                        <Card key={index} className="p-4 relative group">
                            <div className="flex gap-3">
                                {/* Drag Handle */}
                                <div className="flex flex-col gap-1 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveImage(index, index - 1)}
                                        disabled={index === 0}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        title="Move up"
                                    >
                                        ▲
                                    </button>
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => handleMoveImage(index, index + 1)}
                                        disabled={index === images.length - 1}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        title="Move down"
                                    >
                                        ▼
                                    </button>
                                </div>

                                {/* Image Preview */}
                                <div className="flex-shrink-0 w-20 h-20 relative bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={image.url}
                                        alt={image.alt || 'Product image'}
                                        fill
                                        className="object-cover"
                                    />
                                    {index === 0 && (
                                        <div className="absolute top-1 left-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                            Main
                                        </div>
                                    )}
                                </div>

                                {/* Alt Text Input */}
                                <div className="flex-1 min-w-0">
                                    <Input
                                        type="text"
                                        placeholder="Alt text (optional)"
                                        value={image.alt || ''}
                                        onChange={(e) => handleUpdateAlt(index, e.target.value)}
                                        className="text-sm h-9"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Position: {index + 1}
                                    </p>
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-500">
                Tip: The first image will be used as the main product image. Drag to reorder.
            </p>
        </div>
    )
}
