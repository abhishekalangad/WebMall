'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X, Upload, Loader2, GripVertical, Image as ImageIcon, Crop as CropIcon, Sliders } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import ImageCropper from '@/components/ui/ImageCropper'

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
    const [croppingIndex, setCroppingIndex] = useState<number | null>(null)
    const [isSavingCrop, setIsSavingCrop] = useState(false)
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
                description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded. Click "Crop / Adjust" on any image to zoom or scale!`
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

    const handleCropComplete = async (croppedDataUrl: string) => {
        if (croppingIndex === null) return

        // If user selected "Use Original (No Crop)" or returned an existing URL, no re-upload needed!
        if (croppedDataUrl === images[croppingIndex]?.url || !croppedDataUrl.startsWith('data:')) {
            const updatedImages = [...images]
            updatedImages[croppingIndex] = {
                ...updatedImages[croppingIndex],
                url: croppedDataUrl
            }
            onChange(updatedImages)
            setCroppingIndex(null)
            toast({
                title: 'Original Image Kept',
                description: 'Original image maintained without crop changes.'
            })
            return
        }

        try {
            setIsSavingCrop(true)

            // Convert base64 data URL to Blob/File
            const resBlob = await fetch(croppedDataUrl)
            const blob = await resBlob.blob()
            const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' })

            // Upload cropped image to server
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'products')

            const token = await accessToken()
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to upload adjusted image')
            }

            const data = await res.json()

            // Update image URL in array
            const updatedImages = [...images]
            updatedImages[croppingIndex] = {
                ...updatedImages[croppingIndex],
                url: data.url
            }
            onChange(updatedImages)

            toast({
                title: 'Image Adjusted',
                description: 'Image cropping and scale updated successfully'
            })
        } catch (error: any) {
            console.error('Crop save error:', error)
            toast({
                title: 'Failed to save adjustment',
                description: error.message || 'An error occurred while uploading adjusted image',
                variant: 'destructive'
            })
        } finally {
            setIsSavingCrop(false)
            setCroppingIndex(null)
        }
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
                <div className="space-y-3">
                    {images.map((image, index) => (
                        <Card key={index} className="p-3.5 relative group hover:border-pink-300 transition-all duration-200 bg-card border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Drag Handle */}
                                <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-1">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveImage(index, index - 1)}
                                        disabled={index === 0}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 p-0.5"
                                        title="Move up"
                                    >
                                        ▲
                                    </button>
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                    <button
                                        type="button"
                                        onClick={() => handleMoveImage(index, index + 1)}
                                        disabled={index === images.length - 1}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 p-0.5"
                                        title="Move down"
                                    >
                                        ▼
                                    </button>
                                </div>

                                {/* Image Preview with Hover Overlay */}
                                <div className="shrink-0 w-20 h-20 relative bg-muted rounded-xl overflow-hidden border border-border group/img shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image.url}
                                        alt={image.alt || 'Product image'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                                    />
                                    {index === 0 && (
                                        <div className="absolute top-1 left-1 bg-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider z-10 shadow-sm">
                                            Main
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setCroppingIndex(index)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 z-20"
                                    >
                                        <CropIcon className="h-4 w-4" />
                                        <span>Crop / Adjust</span>
                                    </button>
                                </div>

                                {/* Alt Text & Adjust Action Button */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground">
                                            Position #{index + 1} {index === 0 && <span className="text-pink-500 font-semibold">(Main Image)</span>}
                                        </span>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Alt text (e.g., Front view)"
                                        value={image.alt || ''}
                                        onChange={(e) => handleUpdateAlt(index, e.target.value)}
                                        className="text-xs h-7 bg-background"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCroppingIndex(index)}
                                        className="h-7 text-xs gap-1.5 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50 hover:bg-pink-50 dark:hover:bg-pink-950/30 w-fit font-semibold"
                                    >
                                        <Sliders className="h-3 w-3 shrink-0" />
                                        Crop / Adjust Scale
                                    </Button>
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors ml-1"
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
                Tip: The first image will be used as the main product image. Click <strong>&quot;Crop / Adjust Scale&quot;</strong> on any image to zoom, rotate, or re-frame!
            </p>

            {/* Image Cropper Modal */}
            {croppingIndex !== null && images[croppingIndex] && (
                <ImageCropper
                    image={images[croppingIndex].url}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCroppingIndex(null)}
                    aspectRatio={1}
                    circularCrop={false}
                    title={`Adjust & Crop Image #${croppingIndex + 1}`}
                />
            )}
        </div>
    )
}

