import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Using a versioned key to force re-instantiation when schema changes
const prismaClientSingleton = () => {
  const isPoolerUrl = process.env.DATABASE_URL?.includes('pooler.supabase.com')

  // Configure connection string with appropriate pool settings
  let connectionUrl = process.env.DATABASE_URL || ''

  if (isPoolerUrl) {
    // For Supabase Pooler (Transaction mode), use optimized settings
    if (!connectionUrl.includes('pgbouncer=true')) {
      connectionUrl += connectionUrl.includes('?') ? '&' : '?'
      connectionUrl += 'pgbouncer=true&connection_limit=10'
    }
  } else {
    // For direct connections, use smaller pool
    if (!connectionUrl.includes('connection_limit')) {
      connectionUrl += connectionUrl.includes('?') ? '&' : '?'
      connectionUrl += 'connection_limit=5'
    }
  }

  return new PrismaClient({
    datasourceUrl: connectionUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = global as unknown as { prisma_v2: PrismaClient }

export const prisma = globalForPrisma.prisma_v2 || prismaClientSingleton()

// Gracefully handle connection cleanup
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production') {
    // In production, ensure clean shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect()
    })
  } else {
    // In development, store in global to prevent hot-reload issues
    globalForPrisma.prisma_v2 = prisma
  }
}