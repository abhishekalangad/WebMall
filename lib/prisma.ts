import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Using a versioned key to force re-instantiation when schema changes
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL?.includes('connection_limit')
      ? process.env.DATABASE_URL
      : `${process.env.DATABASE_URL}?connection_limit=3`,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient }

export const prisma = globalForPrisma.prisma_v2 || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma