const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;`)
    console.log('Successfully added idempotency_key column to public.orders table')
  } catch (error) {
    console.error('Error adding column:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
