import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET User Details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const requester = await verifyAuthToken(token)

        if (!requester || requester.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        orders: true,
                        reviews: true
                    }
                },
                orders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user details:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE User
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const requester = await verifyAuthToken(token)

        if (!requester || requester.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.supabaseId)
        if (authError) {
            console.error('Error deleting from Supabase:', authError)
            // Proceed to delete from local DB anyway to keep sync
        }

        // Delete from Prisma (Cascades should handle related data)
        await prisma.user.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH User (Ban/Unban)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('PATCH: No Auth Header')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const requester = await verifyAuthToken(token)

        console.log('PATCH: Requester:', requester ? `${requester.email} (${requester.role})` : 'null')

        if (!requester || requester.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden', details: requester ? `Role is ${requester.role}` : 'No User' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { action } = body

        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (action === 'ban') {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
                ban_duration: '876600h' // ~100 years
            })
            if (error) throw error
            return NextResponse.json({ success: true, message: 'User banned successfully' })
        }

        if (action === 'unban') {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
                ban_duration: 'none'
            })
            if (error) throw error
            return NextResponse.json({ success: true, message: 'User unbanned successfully' })
        }

        if (action === 'updateProfile') {
            const { name, phone, address } = body

            // Validate inputs
            if (name && name.length < 2) throw new Error('Name is too short')

            // Update Prisma
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    name,
                    phone,
                    address
                }
            })

            // Sync with Supabase Auth (Metadata) if needed, but Prisma is source of truth for profile data
            // We could update Supabase user_metadata if we wanted consistent syncing

            return NextResponse.json({ success: true, user: updatedUser, message: 'Profile updated successfully' })
        }

        if (action === 'updateRole') {
            const { role } = body
            if (!['admin', 'customer'].includes(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
            }

            // Update Prisma
            const updatedUser = await prisma.user.update({
                where: { id },
                data: { role }
            })

            // Update Supabase App Metadata (for RLS/Client side checks)
            const { error } = await supabaseAdmin.auth.admin.updateUserById(user.supabaseId, {
                app_metadata: { role }
            })
            if (error) console.error('Error updating Supabase role:', error)

            return NextResponse.json({ success: true, user: updatedUser, message: 'Role updated successfully' })
        }

        if (action === 'resetPassword') {
            // OR strictly sendPasswordResetEmail. inviteUser sends welcome email.
            // Better: generate link or just use Supabase reset.
            // Actually, we can trigger reset email ONLY if we have their email.
            // supabaseAdmin.auth.resetPasswordForEmail() is for CLI?
            // supabase.auth.resetPasswordForEmail is Client side.
            // Admin: supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email: user.email }) return link.
            // But usually admins want to "Trigger Reset Email".
            // Let's use deleteUser for hard reset, but 'sendPasswordReset' usually requires Client SDK or generating link.

            // Easiest: Generate Link and return it? No, insecure if admin sees it.
            // Let's assume we can't easily trigger the email template from Admin API without custom mailer.
            // BUT: generateLink returns a link. Admin can give it to user.

            const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: user.email
            })

            if (generateError) throw generateError

            return NextResponse.json({
                success: true,
                message: 'Recovery link generated',
                recoveryLink: data.properties.action_link
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        console.error('Error updating status:', error)
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 })
    }
}
