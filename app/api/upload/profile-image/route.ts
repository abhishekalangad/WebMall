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

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const userId = user.id

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

        // Create unique, SAFE filename (no user input in filename)
        const timestamp = Date.now()
        const safeFileName = `profile-${userId}-${timestamp}.${fileExtension}`

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Save file
        const filePath = path.join(uploadsDir, safeFileName)
        await writeFile(filePath, new Uint8Array(buffer))

        // Return the public URL
        const imageUrl = `/uploads/profiles/${safeFileName}`

        return NextResponse.json({
            success: true,
            imageUrl,
            message: 'Profile image uploaded successfully'
        })
    } catch (error) {
        console.error('Error uploading profile image:', error)
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        )
    }
}

// DELETE endpoint to remove profile images
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const imageUrl = searchParams.get('imageUrl')

        if (!imageUrl || !imageUrl.startsWith('/uploads/profiles/')) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 400 }
            )
        }

        // 🔒 AUTHORIZATION CHECK - Verify user owns this image
        // Extract userId from filename (format: profile-{userId}-{timestamp}.{ext})
        const fileName = imageUrl.split('/').pop()
        if (!fileName) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 400 }
            )
        }

        const fileNameParts = fileName.split('-')
        if (fileNameParts.length < 3 || fileNameParts[0] !== 'profile') {
            return NextResponse.json(
                { error: 'Invalid image format' },
                { status: 400 }
            )
        }

        const fileUserId = fileNameParts[1]

        // Only allow users to delete their own images
        if (fileUserId !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden - You can only delete your own profile images' },
                { status: 403 }
            )
        }

        // 🔒 SECURITY: Validate path to prevent traversal
        const safePath = path.normalize(imageUrl).replace(/^(\.\.[\/\\])+/, '')
        const filePath = path.join(process.cwd(), 'public', safePath)

        // Ensure file path is within uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
        if (!filePath.startsWith(uploadsDir)) {
            return NextResponse.json(
                { error: 'Invalid file path' },
                { status: 400 }
            )
        }

        if (existsSync(filePath)) {
            const { unlink } = await import('fs/promises')
            await unlink(filePath)
        }

        return NextResponse.json({
            success: true,
            message: 'Profile image deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting profile image:', error)
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        )
    }
}
