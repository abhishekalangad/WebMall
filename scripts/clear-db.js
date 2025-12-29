const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Starting database cleanup...')

    try {
        // Delete in order of dependencies (Products depend on Categories)

        console.log('Deleting all Products...')
        const productCount = await prisma.product.deleteMany({})
        console.log(`Deleted ${productCount.count} products.`)

        console.log('Deleting all Categories...')
        const categoryCount = await prisma.category.deleteMany({})
        console.log(`Deleted ${categoryCount.count} categories.`)

        console.log('Database cleanup successful!')
    } catch (error) {
        console.error('Error clearing database:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
