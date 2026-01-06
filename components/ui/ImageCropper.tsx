'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'

interface ImageCropperProps {
    image: string
    onCropComplete: (croppedImage: string) => void
    onCancel: () => void
    aspectRatio?: number
    circularCrop?: boolean
}

/**
 * Create a canvas and draw the cropped image
 */
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
): Promise<string> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }

    // Set canvas size to match the bounding box
    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    // Translate canvas context to center point
    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    // Draw rotated image
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    // Set canvas width to final desired crop size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Paste generated rotate image at the correct position
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    // Return as base64
    return canvas.toDataURL('image/jpeg', 0.95)
}

/**
 * Create an image element from source
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', error => reject(error))
        image.src = url
    })
}

export default function ImageCropper({
    image,
    onCropComplete,
    onCancel,
    aspectRatio = 1,
    circularCrop = true
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleCropComplete = async () => {
        if (!croppedAreaPixels) return

        setIsProcessing(true)
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
            onCropComplete(croppedImage)
        } catch (error) {
            console.error('Error cropping image:', error)
            alert('Failed to crop image. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Crop Profile Picture
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Drag to reposition, use slider to zoom
                    </p>
                </div>

                {/* Cropper Area */}
                <div className="relative h-96 bg-gray-100">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        cropShape={circularCrop ? 'round' : 'rect'}
                        showGrid={!circularCrop}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaChange}
                    />
                </div>

                {/* Controls */}
                <div className="px-6 py-4 space-y-4 border-b">
                    {/* Zoom Control */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zoom
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">-</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-500">+</span>
                        </div>
                    </div>

                    {/* Rotation Control */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rotation
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">0°</span>
                            <input
                                type="range"
                                min={0}
                                max={360}
                                step={1}
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-gray-500">360°</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCropComplete}
                        disabled={isProcessing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Apply'
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      `}</style>
        </div>
    )
}
