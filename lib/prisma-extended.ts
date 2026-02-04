import { prisma } from './prisma'

// Export types if needed elsewhere, though usually @prisma/client is preferred
export type { SiteSettings, HeroBanner } from '@prisma/client'

// Re-export the prisma instance
export { prisma }
