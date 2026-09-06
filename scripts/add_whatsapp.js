const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;`)
    console.log('WHATSAPP_COLUMN_ADDED_SUCCESSFULLY')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
