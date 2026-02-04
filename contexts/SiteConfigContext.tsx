'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SiteSettings {
    storeName: string
    tagline: string | null
    description: string | null
    logoUrl: string | null
    contactEmail: string | null
    contactPhone: string | null
    contactAddress: string | null
    facebookUrl: string | null
    instagramUrl: string | null
    instagramUrl2: string | null
    twitterUrl: string | null
    shippingBaseRate: number
    freeShippingThreshold: number
    headerNavigation: any | null // JSON array of links for admins
    customerNavigation: any | null // JSON array of links for customers
}

interface HeroBanner {
    id: string
    title: string
    subtitle: string | null
    imageUrl: string
    ctaText: string | null
    ctaLink: string | null
    position: number
    isActive: boolean
    showBadge: boolean
    showTopRated: boolean
}

interface Category {
    id: string
    name: string
    slug: string
    image: string | null
    description: string | null
}

interface SiteConfigContextType {
    settings: SiteSettings | null
    banners: HeroBanner[]
    categories: Category[]
    loading: boolean
    refreshConfig: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType>({
    settings: null,
    banners: [],
    categories: [],
    loading: true,
    refreshConfig: async () => { }
})

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [banners, setBanners] = useState<HeroBanner[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const fetchConfig = async () => {
        try {
            console.log('[SiteConfig] Fetching configuration...')
            const response = await fetch('/api/site/config', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                console.log('[SiteConfig] Received:', data.settings?.contactEmail)
                setSettings(data.settings)
                setBanners(data.banners)
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('[SiteConfig] Failed to fetch:', error)
        } finally {
            setLoading(false)
        }
    }

    const refreshConfig = async () => {
        console.log('[SiteConfig] Refreshing configuration...')
        await fetchConfig()
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    return (
        <SiteConfigContext.Provider value={{ settings, banners, categories, loading, refreshConfig }}>
            {children}
        </SiteConfigContext.Provider>
    )
}


export const useSiteConfig = () => useContext(SiteConfigContext)
