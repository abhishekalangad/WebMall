/**
 * Input Sanitization Utilities
 * Prevents XSS attacks and malicious input in user-generated content
 */

/**
 * Sanitize string input by removing HTML tags and dangerous characters
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length (optional)
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined, maxLength?: number): string {
    if (!input || typeof input !== 'string') return ''

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '')

    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // Remove dangerous characters that could be used for XSS
    sanitized = sanitized.replace(/[<>]/g, '')

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')

    // Trim whitespace
    sanitized = sanitized.trim()

    // Enforce max length if specified
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
}

/**
 * Sanitize phone number to allow only digits, spaces, hyphens, parentheses, and plus sign
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string | null | undefined): string {
    if (!phone || typeof phone !== 'string') return ''

    // Allow only valid phone number characters
    const sanitized = phone.replace(/[^0-9\s\-\(\)\+]/g, '').trim()

    // Limit to reasonable phone number length
    return sanitized.substring(0, 20)
}

/**
 * Sanitize email address
 * @param email - The email to sanitize
 * @returns Sanitized email (lowercase, trimmed)
 */
export function sanitizeEmail(email: string | null | undefined): string {
    if (!email || typeof email !== 'string') return ''

    // Remove dangerous characters, convert to lowercase, and trim
    const sanitized = email
        .replace(/[<>]/g, '')
        .toLowerCase()
        .trim()

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') return ''

    const trimmed = url.trim()

    // Block dangerous schemes
    const dangerousSchemes = /^(javascript|data|vbscript|file):/i
    if (dangerousSchemes.test(trimmed)) {
        return ''
    }

    // Allow only http, https, and relative URLs
    if (!trimmed.match(/^(https?:\/\/|\/)/i) && trimmed.includes(':')) {
        return ''
    }

    return trimmed
}

/**
 * Sanitize birthday/date input
 * @param date - The date string to sanitize
 * @returns Sanitized date string (YYYY-MM-DD format) or empty string
 */
export function sanitizeDate(date: string | null | undefined): string {
    if (!date || typeof date !== 'string') return ''

    // Allow only date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const sanitized = date.trim()

    return dateRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize text area input (allows multiline but removes dangerous content)
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeTextArea(text: string | null | undefined, maxLength: number = 5000): string {
    if (!text || typeof text !== 'string') return ''

    // Remove HTML tags and scripts
    let sanitized = text.replace(/<[^>]*>/g, '')
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>]/g, '')

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '')

    // Trim but preserve internal whitespace and newlines
    sanitized = sanitized.trim()

    // Enforce max length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
}

/**
 * Sanitize user profile data
 * @param profileData - Object containing profile fields
 * @returns Sanitized profile data object
 */
export function sanitizeProfileData(profileData: {
    name?: string
    phone?: string
    address?: string
    birthday?: string
    profileImage?: string
    [key: string]: any
}) {
    return {
        ...(profileData.name !== undefined && {
            name: sanitizeString(profileData.name, 100)
        }),
        ...(profileData.phone !== undefined && {
            phone: sanitizePhone(profileData.phone)
        }),
        ...(profileData.address !== undefined && {
            address: sanitizeTextArea(profileData.address, 500)
        }),
        ...(profileData.birthday !== undefined && {
            birthday: sanitizeDate(profileData.birthday)
        }),
        ...(profileData.profileImage !== undefined && {
            profileImage: sanitizeUrl(profileData.profileImage)
        }),
    }
}
