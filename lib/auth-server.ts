import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
    id: string
    email: string
    name?: string
    role: string
    email_verified?: boolean
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) return null

        // Fetch user details from Database (Prisma)
        // Fetch user details from Database (Prisma)
        let dbUser = await prisma.user.findUnique({
            where: { supabaseId: user.id }
        })

        // Just-In-Time Sync: If user exists in Auth but not in DB, create them
        if (!dbUser) {
            try {
                dbUser = await prisma.user.create({
                    data: {
                        supabaseId: user.id,
                        email: user.email!, // Email is guaranteed from Supabase
                        name: user.user_metadata.name || user.email!.split('@')[0],
                        role: 'customer'
                    }
                })
            } catch (createError) {
                console.error('Failed to auto-create user in DB:', createError)
                return null
            }
        }

        if (!dbUser) return null

        return {
            id: user.id,
            email: user.email!,
            name: dbUser.name || user.user_metadata.name,
            role: dbUser.role, // Authoritative Source
            email_verified: !!user.email_confirmed_at
        }
    } catch (error) {
        console.error('Error verifying auth token (server):', error)
        return null
    }
}
