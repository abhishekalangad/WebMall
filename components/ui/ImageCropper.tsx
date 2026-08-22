'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { ZoomIn, ZoomOut, RotateCw, Crop as CropIcon, Check, X, Image as ImageIcon } from 'lucide-react'

interface ImageCropperProps {
    image: string
    onCropComplete: (croppedImage: string) => void
    onCancel: () => void
    aspectRatio?: number
    circularCrop?: boolean
    title?: string
}

/**
 * Create an image element from source with CORS handling
 */
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', error => reject(error))
        image.src = url
    })
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

    const cropW = Math.max(1, Math.round(pixelCrop.width))
    const cropH = Math.max(1, Math.round(pixelCrop.height))

    canvas.width = cropW
    canvas.height = cropH

    // Clean white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cropW, cropH)

    // Save state & handle rotation
    ctx.save()
    if (rotation !== 0) {
        ctx.translate(cropW / 2, cropH / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-cropW / 2, -cropH / 2)
    }

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        cropW,
        cropH
    )
    ctx.restore()

    return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Fit entire original image centered on square canvas without cropping off any edges
 */
async function getFitFullImg(imageSrc: string): Promise<string> {
    const image = await createImage(imageSrc)
    const size = Math.max(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (!ctx) return imageSrc

    // Clean white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    const scale = Math.min(size / image.width, size / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const x = (size - drawW) / 2
    const y = (size - drawH) / 2

    ctx.drawImage(image, 0, 0, image.width, image.height, x, y, drawW, drawH)
    return canvas.toDataURL('image/jpeg', 0.95)
}

export default function ImageCropper({
    image,
    onCropComplete,
    onCancel,
    aspectRatio: initialAspect = 1,
    circularCrop = false,
    title = 'Adjust & Crop Product Image'
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [aspect, setAspect] = useState<number | undefined>(initialAspect)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null)

    const onCropChange = (location: { x: number; y: number }) => {
        setCrop(location)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropAreaChange = useCallback(async (croppedArea: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels)
        try {
            const preview = await getCroppedImg(image, pixels, rotation)
            setLivePreviewUrl(preview)
        } catch (e) {
            // Ignore preview errors if CORS or loading
        }
    }, [image, rotation])

    const handleRotateQuick = async () => {
        const nextRot = (rotation + 90) % 360
        setRotation(nextRot)
        if (croppedAreaPixels) {
            try {
                const preview = await getCroppedImg(image, croppedAreaPixels, nextRot)
                setLivePreviewUrl(preview)
            } catch (e) {}
        }
    }

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

    const handleUseOriginal = async () => {
        setIsProcessing(true)
        try {
            const fitImage = await getFitFullImg(image)
            onCropComplete(fitImage)
        } catch (e) {
            onCropComplete(image)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-background dark:bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <CropIcon className="h-5 w-5 text-pink-500" />
                            {title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Drag image to re-frame, use zoom controls or buttons below to adjust scale
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Main Workspace (Cropper + Live Preview) */}
                <div className="grid grid-cols-1 md:grid-cols-3 bg-black/90 min-h-[300px] sm:min-h-[360px] flex-shrink-0 relative overflow-hidden">
                    {/* Interactive Cropper Canvas */}
                    <div className="relative md:col-span-2 h-[280px] sm:h-[360px] bg-slate-950 border-r border-border/20">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            minZoom={0.2}
                            maxZoom={3}
                            rotation={rotation}
                            aspect={aspect}
                            cropShape={circularCrop ? 'round' : 'rect'}
                            showGrid={!circularCrop}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropAreaChange}
                            mediaProps={{ crossOrigin: 'anonymous' }}
                        />
                    </div>

                    {/* Live Result Preview Box */}
                    <div className="hidden md:flex flex-col items-center justify-center p-4 bg-slate-900 border-l border-slate-800 text-center">
                        <span className="text-xs font-semibold text-pink-400 mb-2 uppercase tracking-wider">
                            📷 Live Result Preview
                        </span>
                        <div className="w-40 h-40 rounded-xl overflow-hidden border-2 border-pink-500/40 bg-black/50 shadow-inner flex items-center justify-center relative">
                            {livePreviewUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={livePreviewUrl}
                                    alt="Live Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-[11px] text-slate-400 p-2">Adjust controls to preview</span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5 max-w-[160px]">
                            This is how your image will look on the product card!
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 sm:p-5 space-y-4 border-t border-border bg-card">
                    {/* Mobile Live Preview (small screen indicator) */}
                    {livePreviewUrl && (
                        <div className="flex md:hidden items-center gap-3 p-2 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={livePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-pink-300 shrink-0" />
                            <div className="text-xs text-pink-800 dark:text-pink-300">
                                <span className="font-bold block">Live Preview Active</span>
                                Adjust zoom/scale below to see changes in real time.
                            </div>
                        </div>
                    )}

                    {/* Zoom & Quick Controls Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Zoom Control */}
                        <div>
                            <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1.5">
                                <span>Zoom / Scale Level (Out/In)</span>
                                <span className="text-pink-600 font-bold">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newZoom = Math.max(0.2, Number((zoom - 0.15).toFixed(2)))
                                        setZoom(newZoom)
                                    }}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                    title="Zoom out (make smaller)"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </button>
                                <input
                                    type="range"
                                    min={0.2}
                                    max={3}
                                    step={0.02}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newZoom = Math.min(3, Number((zoom + 0.15).toFixed(2)))
                                        setZoom(newZoom)
                                    }}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                                    title="Zoom in (make larger)"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Rotate & Aspect Ratio */}
                        <div>
                            <div className="text-xs font-semibold text-foreground mb-1.5">
                                Aspect Ratio & Rotation
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setAspect(1)}
                                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                                        aspect === 1
                                            ? 'bg-pink-500 text-white border-pink-500'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    1:1 Square
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAspect(4 / 3)}
                                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                                        aspect === 4 / 3
                                            ? 'bg-pink-500 text-white border-pink-500'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    4:3 Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAspect(undefined)}
                                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                                        aspect === undefined
                                            ? 'bg-pink-500 text-white border-pink-500'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    Free
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRotateQuick}
                                    className="p-1 px-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1 text-xs font-medium"
                                    title="Rotate 90°"
                                >
                                    <RotateCw className="h-3.5 w-3.5" />
                                    <span>Rotate</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 sm:px-5 py-3 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                        type="button"
                        onClick={handleUseOriginal}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/50 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="Fit 100% of original image centered on canvas without cropping any edges"
                    >
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        <span>Use Original (Fit Full Picture)</span>
                    </button>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground bg-background border border-border rounded-xl hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCropComplete}
                            disabled={isProcessing}
                            className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 shrink-0" />
                                    <span>Save & Apply</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

