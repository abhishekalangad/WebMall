import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const email = 'Webmalll.lk@gmail.com'
        const password = '123456'
        const name = 'Admin Mall'

        console.log(`🚀 API: Creating admin user: ${email}...`)

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: 'admin' }
        })

        let supabaseId = ''

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('ℹ️ User already exists in Supabase Auth.')
                const { data: users, error: listError } = await supabase.auth.admin.listUsers()
                if (listError) throw listError
                const existingUser = users.users.find(u => u.email === email)
                if (!existingUser) throw new Error('Could not find existing user')
                supabaseId = existingUser.id
            } else {
                throw authError
            }
        } else {
            console.log('✅ User created in Supabase Auth.')
            supabaseId = authData.user!.id
        }

        // 2. Create user in Prisma public.User table
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                supabaseId,
                name,
                role: 'admin'
            },
            create: {
                supabaseId,
                email,
                name,
                role: 'admin'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Admin setup complete',
            user: {
                email: user.email,
                role: user.role,
                supabaseId: user.supabaseId
            }
        })
    } catch (error: any) {
        console.error('❌ Admin setup error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
