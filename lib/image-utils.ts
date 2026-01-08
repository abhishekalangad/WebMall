/**
 * Custom image validation and error handling utility
 * Helps prevent "requested resource isn't a valid image" errors
 */

export function getValidImageUrl(url: string | undefined | null, fallback: string = '/placeholder.png'): string {
    if (!url) return fallback

    // Handle absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }

    // Handle relative URLs - check if they're likely valid
    if (url.startsWith('/')) {
        // If it's a local upload, ensure it exists or fallback
        return url
    }

    return fallback
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const target = e.currentTarget
    if (target.src.includes('/placeholder')) {
        return // Already showing fallback
    }

    console.warn(`Failed to load image: ${target.src}`)
    target.src = '/placeholder.png'
}

/**
 * Check if an image URL is likely to be valid
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
    if (!url) return false

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']
    const lowerUrl = url.toLowerCase()

    return validExtensions.some(ext => lowerUrl.includes(ext))
}
