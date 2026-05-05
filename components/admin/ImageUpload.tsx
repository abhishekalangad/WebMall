'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import ImageCropper from '@/components/ui/ImageCropper'

interface ImageUploadProps {
    onUploadComplete: (url: string) => void
    currentImageUrl?: string
    bucket?: string
    autoReset?: boolean
    maxSizeMB?: number
    cropEnabled?: boolean
    cropAspectRatio?: number
    circularCrop?: boolean
}

export function ImageUpload({
    onUploadComplete,
    currentImageUrl,
    bucket = 'products',
    autoReset = false,
    maxSizeMB = 5,
    cropEnabled = false,
    cropAspectRatio = 1,
    circularCrop = false
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { accessToken } = useAuth()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 1. Validate File Type
        const ALLOWED_TYPES = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
            'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'
        ]
        if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload a PNG, JPG, WEBP or HEIC (iPhone) image.',
                variant: 'destructive'
            })
            return
        }

        // 2. Validate File Size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: `Image must be less than ${maxSizeMB}MB`,
                variant: 'destructive'
            })
            return
        }

        if (cropEnabled) {
            const objectUrl = URL.createObjectURL(file)
            setImageToCrop(objectUrl)
        } else {
            await processUpload(file)
        }
    }

    const handleCropComplete = async (croppedImageUrl: string) => {
        setImageToCrop(null)
        
        // Convert base64 to File object
        const arr = croppedImageUrl.split(',')
        const mimeMatch = arr[0].match(/:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        const file = new File([u8arr], 'cropped.jpg', { type: mime })
        
        await processUpload(file)
    }

    const processUpload = async (file: File | Blob) => {
        // Preview
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        try {
            setUploading(true)

            // 3. Upload via API (Server-side)
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', bucket)

            const token = await accessToken()
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            })

            let data;
            try {
                data = await res.json()
            } catch (e) {
                throw new Error(`Server returned ${res.status} ${res.statusText}`)
            }

            if (!res.ok) {
                throw new Error(data.error || `Upload failed: ${res.statusText}`)
            }

            if (!data.url) {
                throw new Error('Invalid response from server: No URL returned')
            }

            onUploadComplete(data.url)
            toast({
                title: 'Success',
                description: 'Image uploaded successfully'
            })

            if (autoReset) {
                setPreview(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload image',
                variant: 'destructive'
            })
            // Revert preview if failed
            setPreview(currentImageUrl || null)
        } finally {
            setUploading(false)
        }
    }

    const triggerSelect = () => {
        fileInputRef.current?.click()
    }

    const clearImage = () => {
        setPreview(null)
        onUploadComplete('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Photo</label>
                {preview && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImage}
                        className="text-red-500 hover:text-red-600 h-8 text-xs sm:text-sm"
                    >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Remove
                    </Button>
                )}
            </div>

            <div
                onClick={!uploading ? triggerSelect : undefined}
                className={`relative aspect-square md:aspect-video rounded-lg sm:rounded-xl border-2 border-dashed transition-all flex items-center justify-center cursor-pointer overflow-hidden ${preview ? 'border-pink-300 bg-background' : 'border-border bg-muted/50 hover:border-pink-300 hover:bg-muted'
                    }`}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 p-4 sm:p-6 text-center w-full">
                        <div className="p-2 sm:p-3 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400">
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-foreground">Click to upload photo</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP, HEIC (Max. {maxSizeMB}MB)</p>
                        </div>
                    </div>
                )}

                {/* Overlay for uploading state */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-2" />
                        <p className="text-xs sm:text-sm font-medium">Uploading...</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, .heic, .heif"
                className="hidden"
            />
            
            {imageToCrop && (
                <ImageCropper
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                    aspectRatio={cropAspectRatio}
                    circularCrop={circularCrop}
                />
            )}
        </div>
    )
}
