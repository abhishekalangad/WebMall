const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Hi';`)
    console.log('Successfully added whatsapp_message column to public.site_settings')
  } catch (error) {
    console.error('Error adding column:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
