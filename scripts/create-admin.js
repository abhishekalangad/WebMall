const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const prisma = new PrismaClient();

async function createAdmin() {
    const email = 'Webmalll.lk@gmail.com';
    const password = '123456';
    const name = 'Admin Mall';

    console.log(`🚀 Creating admin user: ${email}...`);

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' }
    });

    let supabaseId = '';

    if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('Email already exists')) {
            console.log('ℹ️ User already exists in Supabase Auth.');
            // Fetch existing user to get ID
            const { data: users, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) throw listError;
            const existingUser = users.users.find(u => u.email === email);
            if (!existingUser) throw new Error('Could not find existing user');

            supabaseId = existingUser.id;
        } else {
            throw authError;
        }
    } else {
        console.log('✅ User created in Supabase Auth.');
        supabaseId = authData.user.id;
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
    });

    console.log('✅ User created/updated in Prisma database.');
    console.log('🎉 Admin setup complete!');
}

createAdmin()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
