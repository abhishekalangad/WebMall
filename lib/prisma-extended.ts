import { PrismaClient } from '@prisma/client'

// Define the missing types manually to solve the lint errors until prisma generate works
// Triggering rebuild to pick up new schema changes (headerNavigation)
export interface SiteSettings {
    id: string
    storeName: string
    tagline?: string
    description?: string
    logoUrl?: string
    contactEmail?: string
    contactPhone?: string
    contactAddress?: string
    facebookUrl?: string
    instagramUrl?: string
    twitterUrl?: string
    shippingBaseRate: number

    freeShippingThreshold: number
    headerNavigation?: any
    customerNavigation?: any
    updatedAt: Date
}

export interface HeroBanner {
    id: string
    title: string
    subtitle?: string
    imageUrl: string
    ctaText?: string
    ctaLink?: string
    position: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// Extend the PrismaClient type to include the missing models
export type ExtendedPrismaClient = PrismaClient & {
    siteSettings: {
        findUnique: (args: any) => Promise<SiteSettings | null>
        upsert: (args: any) => Promise<SiteSettings>
        create: (args: any) => Promise<SiteSettings>
    }
    heroBanner: {
        findMany: (args: any) => Promise<HeroBanner[]>
    }
}


import { prisma as basePrisma } from './prisma'

export const prisma = basePrisma as unknown as ExtendedPrismaClient
