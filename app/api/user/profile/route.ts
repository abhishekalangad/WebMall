import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-extended'
import { verifyAuthToken } from '@/lib/auth'

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
        const { name, phone, address, birthday, profileImage } = body

        // Update user profile in database
        const updatedProfile = await prisma.user.update({
            where: { supabaseId: user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone }),
                ...(address !== undefined && { address }),
                ...(birthday !== undefined && { birthday }),
                ...(profileImage !== undefined && { profileImage })
            },
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
