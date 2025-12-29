'use client'

import { useState, useEffect } from 'react'
import {
    Settings,
    Globe,
    Palette,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Save,
    ArrowLeft,
    Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'

export default function AdminSettingsPage() {
    const { toast } = useToast()
    const { accessToken } = useAuth()
    const { refreshConfig } = useSiteConfig()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [settings, setSettings] = useState({
        storeName: 'WebMall',
        tagline: 'Sri Lankan Fashion Accessories',
        description: 'Your premier destination for Sri Lankan fashion accessories.',
        logoUrl: '',
        contactEmail: 'webmalll.ik@gmail.com',
        contactPhone: '+94 778973708',
        contactAddress: 'Colombo, Sri Lanka',
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        shippingBaseRate: 500,
        freeShippingThreshold: 10000,
    })

    // Load settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = await accessToken()
                console.log('[Settings Load] Token:', token ? 'present' : 'missing')
                if (!token) {
                    console.log('[Settings Load] No token, skipping fetch')
                    return
                }

                const response = await fetch('/api/admin/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                console.log('[Settings Load] Response status:', response.status)

                if (response.ok) {
                    const data = await response.json()
                    console.log('[Settings Load] Received data:', data)
                    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                        setSettings(prev => ({ ...prev, ...data }))
                        console.log('[Settings Load] Settings updated')
                    } else {
                        console.log('[Settings Load] No valid data received')
                    }
                } else {
                    console.error('[Settings Load] Failed with status:', response.status)
                }
            } catch (error) {
                console.error('[Settings Load] Error:', error)
            } finally {
                setInitialLoading(false)
            }
        }

        fetchSettings()
    }, [accessToken])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = await accessToken()
            console.log('[Settings Save] Token:', token ? 'present' : 'missing')

            if (!token) throw new Error('Not authenticated')

            console.log('[Settings Save] Sending data:', settings)

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })

            console.log('[Settings Save] Response status:', response.status)

            if (!response.ok) {
                let errorMessage = 'Failed to save settings'
                try {
                    const error = await response.json()
                    console.log('[Settings Save] Error response:', error)
                    errorMessage = error?.error || error?.message || errorMessage
                } catch (parseError) {
                    console.error('[Settings Save] Failed to parse error:', parseError)
                }
                throw new Error(errorMessage)
            }

            const result = await response.json()
            console.log('[Settings Save] Success:', result)

            // Refresh the site config so footer and other components update immediately
            console.log('[Settings Save] Refreshing site config...')
            await refreshConfig()
            console.log('[Settings Save] Site config refreshed')

            if (toast) {
                toast({
                    title: "Settings Saved",
                    description: "Your site configuration has been updated successfully.",
                })
            }
        } catch (error: any) {
            console.error('[Settings Save] Error:', error)
            if (toast) {
                toast({
                    title: "Error",
                    description: error?.message || 'An unexpected error occurred',
                    variant: "destructive"
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!e || !e.target) {
            console.error('[Settings] Invalid event object:', e)
            return
        }
        const { name, value, type } = e.target
        console.log('[Settings] Changing field:', name, 'to:', value)
        setSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }))
    }

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b mb-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link href="/admin">
                            <Button variant="ghost" className="p-2 h-auto text-gray-500 hover:text-gray-900">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
                    </div>
                    <p className="text-gray-500">Configure your store's branding, contact details, and social presence.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <form onSubmit={handleSave} className="space-y-8">
                    {/* General Branding */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">General Branding</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Store Name</label>
                                <Input
                                    name="storeName"
                                    value={settings.storeName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Tagline</label>
                                <Input
                                    name="tagline"
                                    value={settings.tagline || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Store Description</label>
                                <Textarea
                                    name="description"
                                    value={settings.description || ''}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Logo URL</label>
                                <Input
                                    name="logoUrl"
                                    value={settings.logoUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Contact Information */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Contact & Support</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Support Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        name="contactEmail"
                                        value={settings.contactEmail || ''}
                                        onChange={handleChange}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        name="contactPhone"
                                        value={settings.contactPhone || ''}
                                        onChange={handleChange}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Physical Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Textarea
                                        name="contactAddress"
                                        value={settings.contactAddress || ''}
                                        onChange={handleChange}
                                        className="pl-10"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Social Media */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Facebook className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Social Presence</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Facebook URL</label>
                                <Input
                                    name="facebookUrl"
                                    value={settings.facebookUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Instagram URL</label>
                                <Input
                                    name="instagramUrl"
                                    value={settings.instagramUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Twitter URL</label>
                                <Input
                                    name="twitterUrl"
                                    value={settings.twitterUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Shipping Settings */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                <Truck className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Shipping Configuration</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Fixed Shipping Rate (LKR)</label>
                                <Input
                                    name="shippingBaseRate"
                                    type="number"
                                    value={settings.shippingBaseRate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Free Shipping Min Amount (LKR)</label>
                                <Input
                                    name="freeShippingThreshold"
                                    type="number"
                                    value={settings.freeShippingThreshold}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            className="bg-gray-900 text-white hover:bg-gray-800 h-12 px-8 font-bold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Site Settings
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
