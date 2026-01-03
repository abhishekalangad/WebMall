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

        // Enforce admin access for site owner
        const isOwner = ['webmalll.ik@gmail.com', 'webmall.ik@gmail.com', 'webmalll.lk@gmail.com', 'webmall.lk@gmail.com'].includes(user.email || '')

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
        const { name, phone, address, birthday, profileImage } = body

        // Check if user exists by Supabase ID
        let dbUser = await prisma.user.findUnique({
            where: { supabaseId: user.id }
        })

        // Enforce admin access for site owner
        const isOwner = ['webmalll.ik@gmail.com', 'webmall.ik@gmail.com', 'webmalll.lk@gmail.com', 'webmall.lk@gmail.com'].includes(user.email || '')
        const forceRole = isOwner ? 'admin' : undefined

        if (dbUser) {
            // Update existing user matches ID
            dbUser = await prisma.user.update({
                where: { supabaseId: user.id },
                data: {
                    ...(forceRole && { role: forceRole }),
                    ...(name !== undefined && { name }),
                    ...(phone !== undefined && { phone }),
                    ...(address !== undefined && { address }),
                    ...(birthday !== undefined && { birthday }),
                    ...(profileImage !== undefined && { profileImage })
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
                        ...(name !== undefined && { name }),
                        ...(phone !== undefined && { phone }),
                        ...(address !== undefined && { address }),
                        ...(birthday !== undefined && { birthday }),
                        ...(profileImage !== undefined && { profileImage })
                    }
                })
            } else {
                // Create new user
                dbUser = await prisma.user.create({
                    data: {
                        supabaseId: user.id,
                        email: user.email,
                        name: name || user.name || '',
                        role: isOwner ? 'admin' : 'customer',
                        ...(phone && { phone }),
                        ...(address && { address }),
                        ...(birthday && { birthday }),
                        ...(profileImage && { profileImage })
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
