'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

interface ImageUploadProps {
    onUploadComplete: (url: string) => void
    currentImageUrl?: string
    bucket?: string
}

export function ImageUpload({
    onUploadComplete,
    currentImageUrl,
    bucket = 'products'
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        try {
            setUploading(true)

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file)

            if (error) throw error

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            onUploadComplete(publicUrl)
            toast({
                title: 'Success',
                description: 'Image uploaded successfully'
            })
        } catch (error: any) {
            console.error('Upload error:', error)
            toast({
                title: 'Error',
                description: error.message || 'Failed to upload image',
                variant: 'destructive'
            })
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
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Photo</label>
                {preview && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImage}
                        className="text-red-500 hover:text-red-600 h-8"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                    </Button>
                )}
            </div>

            <div
                onClick={!uploading ? triggerSelect : undefined}
                className={`relative aspect-square md:aspect-video rounded-xl border-2 border-dashed transition-all flex flex-center cursor-pointer overflow-hidden ${preview ? 'border-pink-300 bg-white' : 'border-gray-300 bg-gray-50 hover:border-pink-300 hover:bg-white'
                    }`}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center w-full">
                        <div className="p-3 rounded-full bg-pink-50 text-pink-500">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Click to upload photo</p>
                            <p className="text-xs text-gray-500">PNG, JPG or WEBP (Max. 5MB)</p>
                        </div>
                    </div>
                )}

                {/* Overlay for uploading state */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm font-medium">Uploading to secure storage...</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            <p className="text-xs text-gray-500 italic">
                * Select a high-quality image from your computer to represent this item.
            </p>
        </div>
    )
}
