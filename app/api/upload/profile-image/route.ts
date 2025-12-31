import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const userId = formData.get('userId') as string | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
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

        // Create unique filename with timestamp and user ID
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop() || 'jpg'
        const fileName = `profile-${userId}-${timestamp}.${fileExtension}`

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Save file
        const filePath = path.join(uploadsDir, fileName)
        await writeFile(filePath, new Uint8Array(buffer))

        // Return the public URL
        const imageUrl = `/uploads/profiles/${fileName}`

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

// Optional: DELETE endpoint to remove old profile images
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const imageUrl = searchParams.get('imageUrl')

        if (!imageUrl || !imageUrl.startsWith('/uploads/profiles/')) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 400 }
            )
        }

        const filePath = path.join(process.cwd(), 'public', imageUrl)

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
