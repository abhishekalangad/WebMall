import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Using a versioned key to force re-instantiation when schema changes
const prismaClientSingleton = () => {
  const isPoolerUrl = process.env.DATABASE_URL?.includes('pooler.supabase.com')
  const isTransactionPort = process.env.DATABASE_URL?.includes(':6543')

  // Configure connection string with appropriate pool settings
  let connectionUrl = process.env.DATABASE_URL || ''

  if (connectionUrl) {
    // Add sslmode=require if not present
    if (!connectionUrl.includes('sslmode=')) {
      connectionUrl += connectionUrl.includes('?') ? '&' : '?'
      connectionUrl += 'sslmode=require'
    }

    if (isPoolerUrl && isTransactionPort) {
      // For Supabase Pooler (Transaction mode) - Only on port 6543
      if (!connectionUrl.includes('pgbouncer=true')) {
        connectionUrl += connectionUrl.includes('?') ? '&' : '?'
        const limit = process.env.NODE_ENV === 'development' ? 5 : 10
        connectionUrl += `pgbouncer=true&connection_limit=${limit}`
      }
    } else if (!connectionUrl.includes('connection_limit')) {
      // For Direct connections or Session mode
      connectionUrl += connectionUrl.includes('?') ? '&' : '?'
      const limit = process.env.NODE_ENV === 'development' ? 5 : 5
      connectionUrl += `connection_limit=${limit}`
    }

    // Log the connection URL (obfuscated) to help debug reachability issues
    if (process.env.NODE_ENV === 'development') {
      const obfuscated = connectionUrl.replace(/:([^:@]+)@/, ':****@')
      console.log(`[Prisma] Connecting to: ${obfuscated}`)
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