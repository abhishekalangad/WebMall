const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Attempting to drop foreign key constraint...')
        // Try both naming conventions just in case, though the error log said users_supabase_id_fkey
        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."User" DROP CONSTRAINT IF EXISTS "users_supabase_id_fkey";`)
        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."User" DROP CONSTRAINT IF EXISTS "User_supabaseId_fkey";`)
        console.log('Successfully dropped FK constraint')
    } catch (e) {
        console.error('Error dropping constraint:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
