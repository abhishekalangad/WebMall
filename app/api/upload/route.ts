import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuthToken } from '@/lib/auth-server'
import { apiError } from '@/lib/api-response'
import { checkRateLimitAsync, RateLimitPresets } from '@/lib/rate-limit'

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif'
])

const ALLOWED_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'heif'
])

export async function POST(request: NextRequest) {
    try {
        const rateLimitResult = await checkRateLimitAsync(request, RateLimitPresets.upload)
        if (!rateLimitResult.success) {
            return apiError('Rate limit exceeded for file uploads', 429)
        }

        // 🔒 AUTHENTICATION CHECK
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return apiError('Unauthorized', 401)
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return apiError('Forbidden - Admin access required', 403)
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bucket = formData.get('bucket') as string | null

        if (!file) {
            return apiError('No file provided', 400)
        }

        const fileExt = (file.name.split('.').pop() || '').toLowerCase()

        // Reject SVG, HTML, Executables explicitly
        if (fileExt === 'svg' || fileExt === 'html' || fileExt === 'htm' || file.type === 'image/svg+xml') {
            return apiError('SVG and HTML upload is strictly prohibited for security reasons', 400)
        }

        if (!ALLOWED_EXTENSIONS.has(fileExt)) {
            return apiError(`Invalid file extension ".${fileExt}". Allowed formats: JPEG, PNG, WebP, AVIF, HEIC`, 400)
        }

        let contentType = file.type
        if (['heic', 'heif'].includes(fileExt) || contentType === 'application/octet-stream' || !contentType) {
            contentType = fileExt === 'heif' ? 'image/heif' : 'image/heic'
        }

        if (!ALLOWED_MIME_TYPES.has(contentType)) {
            return apiError(`Invalid image content type "${contentType}". Allowed formats: JPEG, PNG, WebP, AVIF, HEIC`, 400)
        }

        if (file.size > 15 * 1024 * 1024) {
            return apiError('File size must be less than 15MB', 400)
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing')
            return apiError('Server configuration error', 500)
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const bucketName = bucket === 'products' ? 'products' : 'general'
        const fileName = `${bucketName}/${timestamp}-${randomStr}.${fileExt}`

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error } = await supabaseAdmin
            .storage
            .from('products')
            .upload(fileName, buffer, {
                contentType,
                upsert: false
            })

        if (error) {
            console.error('Supabase Upload Error:', error)
            return apiError('Failed to upload to storage', 500)
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('products')
            .getPublicUrl(fileName)

        return NextResponse.json({
            url: publicUrl,
            success: true,
            message: 'File uploaded successfully'
        })
    } catch (error: any) {
        console.error('Error uploading file:', error)
        return apiError(error.message || 'Failed to upload file', 500)
    }
}
