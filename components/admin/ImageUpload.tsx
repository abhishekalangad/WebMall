'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ImageUploadProps {
    onUploadComplete: (url: string) => void
    currentImageUrl?: string
    bucket?: string
    autoReset?: boolean
    maxSizeMB?: number
}

export function ImageUpload({
    onUploadComplete,
    currentImageUrl,
    bucket = 'products',
    autoReset = false,
    maxSizeMB = 5
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
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

        // Preview
        // We use createObjectURL for preview, but release it when component unmounts or changes?
        // React handles memory reasonably well, but for huge files on tablet this might be heavy.
        // However, this is standard pattern.
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
                <label className="text-sm font-medium text-gray-700">Photo</label>
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
                className={`relative aspect-square md:aspect-video rounded-lg sm:rounded-xl border-2 border-dashed transition-all flex flex-center cursor-pointer overflow-hidden ${preview ? 'border-pink-300 bg-white' : 'border-gray-300 bg-gray-50 hover:border-pink-300 hover:bg-white'
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
                        <div className="p-2 sm:p-3 rounded-full bg-pink-50 text-pink-500">
                            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900">Click to upload photo</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">PNG, JPG, WEBP, HEIC (Max. {maxSizeMB}MB)</p>
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
        </div>
    )
}
