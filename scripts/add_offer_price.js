const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_price NUMERIC(10, 2);`)
    console.log('OFFER_PRICE_COLUMN_ADDED_SUCCESSFULLY')
  } catch (err) {
    console.error('Error adding column:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
