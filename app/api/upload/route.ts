import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuthToken } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
    try {
        // 🔒 AUTHENTICATION CHECK
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bucket = formData.get('bucket') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Create unique filename
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const bucketName = bucket === 'products' ? 'products' : 'general'
        const fileName = `${bucketName}/${timestamp}-${randomStr}.${fileExtension}`

        // Convert File to Buffer for upload
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin
            .storage
            .from('products') // Assuming 'products' is the main bucket
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (error) {
            console.error('Supabase Upload Error:', error)
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
        }

        // Get Public URL
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
        return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
    }
}
