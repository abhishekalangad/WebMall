import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { verifyAuthToken } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
    try {
        // 🔒 AUTHENTICATION CHECK - CRITICAL SECURITY
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid token' },
                { status: 401 }
            )
        }

        // Only allow admin users to upload product images
        if (user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bucket = formData.get('bucket') as string | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 🔒 SECURITY: Sanitize file extension - prevent path traversal
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: jpg, jpeg, png, webp, gif' },
                { status: 400 }
            )
        }

        // Determine upload directory based on bucket parameter
        const bucketName = bucket === 'products' ? 'products' : 'general'

        // Create unique, SAFE filename (no user input in filename)
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const safeFileName = `${bucketName}-${timestamp}-${randomStr}.${fileExtension}`

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', bucketName)
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Save file
        const filePath = path.join(uploadsDir, safeFileName)
        await writeFile(filePath, new Uint8Array(buffer))

        // Return the public URL in the format expected by MultiImageUpload component
        const imageUrl = `/uploads/${bucketName}/${safeFileName}`

        return NextResponse.json({
            url: imageUrl,
            success: true,
            message: 'File uploaded successfully'
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
