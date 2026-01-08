import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { useState } from 'react'
import { getValidImageUrl } from '@/lib/image-utils'

interface SafeImageProps extends Omit<NextImageProps, 'src' | 'onError'> {
    src: string | null | undefined
    fallback?: string
}

/**
 * SafeImage Component - A wrapper around Next.js Image with built-in error handling
 * 
 * Features:
 * - Automatically validates image URLs
 * - Falls back to placeholder on error
 * - Maintains all Next.js Image optimization benefits
 * - Prevents "invalid image" errors from breaking the UI
 */
export function SafeImage({
    src,
    fallback = '/placeholder.png',
    alt,
    ...props
}: SafeImageProps) {
    const [imgSrc, setImgSrc] = useState<string>(getValidImageUrl(src, fallback))
    const [hasError, setHasError] = useState(false)

    const handleError = () => {
        if (!hasError && imgSrc !== fallback) {
            console.warn(`Failed to load image: ${imgSrc}, falling back to placeholder`)
            setImgSrc(fallback)
            setHasError(true)
        }
    }

    return (
        <NextImage
            {...props}
            src={imgSrc}
            alt={alt}
            onError={handleError}
        />
    )
}
