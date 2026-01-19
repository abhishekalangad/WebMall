import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

        // Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 🔒 SECURITY: Sanitize file extension
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: jpg, jpeg, png, webp, gif' },
                { status: 400 }
            )
        }

        // 🧹 CLEANUP: Delete old profile image if exists
        // Fetch user's current profile image from database
        const { prisma } = await import('@/lib/prisma')
        const dbUser = await prisma.user.findUnique({
            where: { supabaseId: userId },
            select: { profileImage: true }
        })

        if (dbUser?.profileImage) {
            console.log('🗑️ Deleting old profile image:', dbUser.profileImage)

            try {
                // Extract bucket name and file path from the old image URL
                const oldImageUrl = new URL(dbUser.profileImage)
                const pathParts = oldImageUrl.pathname.split('/')

                // Expected format: /storage/v1/object/public/{bucket}/{path...}
                const publicIndex = pathParts.indexOf('public')
                if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
                    const oldBucketName = pathParts[publicIndex + 1]
                    const oldFilePath = pathParts.slice(publicIndex + 2).join('/')

                    // Delete the old file from storage
                    const { error: deleteError } = await supabaseAdmin
                        .storage
                        .from(oldBucketName)
                        .remove([oldFilePath])

                    if (deleteError) {
                        console.warn('⚠️ Failed to delete old image:', deleteError.message)
                        // Don't fail the upload if deletion fails
                    } else {
                        console.log('✅ Old profile image deleted successfully')
                    }
                }
            } catch (deleteErr) {
                console.warn('⚠️ Error during old image cleanup:', deleteErr)
                // Don't fail the upload if cleanup fails
            }
        }

        // Create unique filename path: profiles/{userId}/{timestamp}.{ext}
        // Grouping by userId keeps the bucket organized
        const timestamp = Date.now()
        const fileName = `profiles/${userId}/${timestamp}.${fileExtension}`

        // Convert File to Buffer for upload
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Supabase Storage
        // Using a 'profiles' bucket if it exists
        const bucketName = 'profiles'

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            // Fallback to 'general' bucket if 'profiles' doesn't exist (common setup issue)
            if (uploadError.message.includes('Bucket not found')) {
                console.warn(`Bucket '${bucketName}' not found, falling back to 'general' bucket`)
                const fallbackBucket = 'general'
                const { error: fallbackError } = await supabaseAdmin
                    .storage
                    .from(fallbackBucket)
                    .upload(fileName, buffer, {
                        contentType: file.type,
                        upsert: false
                    })

                if (fallbackError) {
                    console.error('Supabase Upload Error (Fallback):', fallbackError)
                    throw fallbackError
                }

                // Get Public URL from fallback bucket
                const { data: { publicUrl } } = supabaseAdmin
                    .storage
                    .from(fallbackBucket)
                    .getPublicUrl(fileName)

                return NextResponse.json({
                    success: true,
                    imageUrl: publicUrl,
                    message: 'Profile image uploaded successfully'
                })
            }

            console.error('Supabase Upload Error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from(bucketName)
            .getPublicUrl(fileName)

        return NextResponse.json({
            success: true,
            imageUrl: publicUrl,
            message: 'Profile image uploaded successfully'
        })

    } catch (error: any) {
        console.error('Error uploading profile image:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to upload image' },
            { status: 500 }
        )
    }
}

// DELETE endpoint to remove profile images
export async function DELETE(request: NextRequest) {
    try {
        // 🔒 AUTHENTICATION CHECK
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

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Invalid image URL' },
                { status: 400 }
            )
        }

        // Initialize Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Try to parse bucket and path from URL
        let bucketName = 'profiles'
        let filePath = ''

        try {
            const urlObj = new URL(imageUrl)
            const pathParts = urlObj.pathname.split('/')

            // Expected: /storage/v1/object/public/{bucket}/{path...}
            const publicIndex = pathParts.indexOf('public')
            if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
                bucketName = pathParts[publicIndex + 1]
                filePath = pathParts.slice(publicIndex + 2).join('/')
            } else {
                throw new Error('Could not parse storage path')
            }
        } catch (e) {
            console.error('Error parsing URL for delete:', e)
            return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .storage
            .from(bucketName)
            .remove([filePath])

        if (error) {
            console.error('Supabase Delete Error:', error)
            return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
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
