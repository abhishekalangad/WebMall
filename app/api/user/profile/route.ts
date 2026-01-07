import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth'
import { sanitizeProfileData } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch full user profile from database
        const profile = await prisma.user.findUnique({
            where: { supabaseId: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                address: true,
                birthday: true,
                profileImage: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Enforce admin access for site owner
        const isOwner = ['adminwebmall@gmail.com', 'webmalll.lk@gmail.com', 'webmall.lk@gmail.com'].includes(user.email || '')

        if (isOwner && profile.role !== 'admin') {
            profile.role = 'admin'
        }

        return NextResponse.json(profile)
    } catch (error: any) {
        console.error('Error fetching user profile:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Sanitize all user inputs to prevent XSS attacks
        const sanitizedData = sanitizeProfileData({
            name: body.name,
            phone: body.phone,
            address: body.address,
            birthday: body.birthday,
            profileImage: body.profileImage
        })

        // Check if user exists by Supabase ID
        let dbUser = await prisma.user.findUnique({
            where: { supabaseId: user.id }
        })

        // Enforce admin access for site owner
        const isOwner = ['webmalll.ik@gmail.com', 'webmall.ik@gmail.com', 'webmalll.lk@gmail.com', 'webmall.lk@gmail.com'].includes(user.email || '')
        const forceRole = isOwner ? 'admin' : undefined

        if (dbUser) {
            // Update existing user
            dbUser = await prisma.user.update({
                where: { supabaseId: user.id },
                data: {
                    ...(forceRole && { role: forceRole }),
                    ...sanitizedData
                }
            })
        } else {
            // Check if user exists by email (legacy account or sync issue)
            const emailUser = await prisma.user.findUnique({
                where: { email: user.email }
            })

            if (emailUser) {
                // Link account and update
                dbUser = await prisma.user.update({
                    where: { email: user.email },
                    data: {
                        supabaseId: user.id,
                        ...(forceRole && { role: forceRole }),
                        ...sanitizedData
                    }
                })
            } else {
                // Create new user with sanitized data
                dbUser = await prisma.user.create({
                    data: {
                        supabaseId: user.id,
                        email: user.email,
                        name: sanitizedData.name || user.name || '',
                        role: isOwner ? 'admin' : 'customer',
                        ...(sanitizedData.phone && { phone: sanitizedData.phone }),
                        ...(sanitizedData.address && { address: sanitizedData.address }),
                        ...(sanitizedData.birthday && { birthday: sanitizedData.birthday }),
                        ...(sanitizedData.profileImage && { profileImage: sanitizedData.profileImage })
                    }
                })
            }
        }

        const updatedProfile = dbUser; // for response

        return NextResponse.json({
            success: true,
            user: updatedProfile,
            message: 'Profile updated successfully'
        })
    } catch (error: any) {
        console.error('Error updating user profile:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update profile' },
            { status: 500 }
        )
    }
}
