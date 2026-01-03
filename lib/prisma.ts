import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Using a versioned key to force re-instantiation when schema changes
const globalForPrisma = global as unknown as { prisma_v2: PrismaClient }

export const prisma =
  globalForPrisma.prisma_v2 ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma