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
    Truck,
    Menu,
    X,
    GripVertical,
    Plus,
    Trash2,
    Image as ImageIcon
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { Reorder, useDragControls } from 'framer-motion'

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

interface NavItem {
    id: string
    label: string
    path: string
}

interface BannerItem {
    id: string
    title: string
    subtitle: string
    imageUrl: string
    ctaText: string
    ctaLink: string
    position: number
    isActive: boolean
    showBadge: boolean
    showTopRated: boolean
    isNew?: boolean
}

// Sortable navigation item component
const SortableNavItem = ({
    item,
    onChange,
    onRemove
}: {
    item: NavItem
    onChange: (field: 'label' | 'path', value: string) => void
    onRemove: () => void
}) => {
    const controls = useDragControls()

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            className="grid grid-cols-12 gap-4 items-center group bg-white p-2 rounded-md border border-transparent hover:border-gray-200 transition-colors"
        >
            {/* Drag Handle */}
            <div className="col-span-1 flex justify-center">
                <div
                    onPointerDown={(e) => controls.start(e)}
                    className="cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                    <GripVertical className="w-5 h-5" />
                </div>
            </div>

            {/* Label Input */}
            <div className="col-span-4">
                <Input
                    value={item.label}
                    onChange={(e) => onChange('label', e.target.value)}
                    placeholder="Label"
                    className="h-9"
                />
            </div>

            {/* Path Input */}
            <div className="col-span-6">
                <Input
                    value={item.path}
                    onChange={(e) => onChange('path', e.target.value)}
                    placeholder="/path"
                    className="h-9 font-mono text-xs"
                />
            </div>

            {/* Delete Button */}
            <div className="col-span-1 flex justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 p-0 rounded-full"
                    onClick={onRemove}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </Reorder.Item>
    )
}

export default function AdminSettingsPage() {
    const { toast } = useToast()
    const { accessToken } = useAuth()
    const { refreshConfig } = useSiteConfig()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    const DEFAULT_ADMIN_TABS: NavItem[] = [
        { id: 'cat', label: 'Categories', path: '/admin/categories' },
        { id: 'sub', label: 'Subcategories', path: '/admin/subcategories' },
        { id: 'prod', label: 'Products', path: '/admin/products' },
        { id: 'ord', label: 'Orders', path: '/admin/orders' },
        { id: 'msg', label: 'Messages', path: '/admin/messages' },
        { id: 'cust', label: 'Customers', path: '/admin/users' },
        { id: 'set', label: 'Settings', path: '/admin/settings' }
    ]

    const DEFAULT_CUSTOMER_TABS: NavItem[] = [
        { id: 'home', label: 'Home', path: '/' },
        { id: 'prods', label: 'Products', path: '/products' },
        { id: 'about', label: 'About', path: '/about' },
        { id: 'contact', label: 'Contact', path: '/contact' }
    ]

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
        instagramUrl2: '',
        twitterUrl: '',
        shippingBaseRate: 500,
        freeShippingThreshold: 10000,
        headerNavigation: DEFAULT_ADMIN_TABS,
        customerNavigation: DEFAULT_CUSTOMER_TABS
    })

    const [banners, setBanners] = useState<BannerItem[]>([])
    const [isSavingBanners, setIsSavingBanners] = useState(false)

    // Load settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = await accessToken()
                if (!token) {
                    setInitialLoading(false)
                    return
                }

                const response = await fetch('/api/admin/settings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                        // Ensure loaded nav items have IDs
                        const processNav = (nav: any[], defaults: NavItem[]) => {
                            if (!Array.isArray(nav) || nav.length === 0) return defaults
                            return nav.map(item => ({
                                ...item,
                                id: item.id || generateId()
                            }))
                        }

                        const consolidatedSettings = {
                            ...data,
                            headerNavigation: processNav(data.headerNavigation, DEFAULT_ADMIN_TABS),
                            customerNavigation: processNav(data.customerNavigation, DEFAULT_CUSTOMER_TABS)
                        }
                        setSettings(prev => ({ ...prev, ...consolidatedSettings }))
                    }
                }

                // Fetch banners
                const bannersRes = await fetch('/api/admin/hero-banners', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (bannersRes.ok) {
                    const bannersData = await bannersRes.json()
                    setBanners(bannersData)
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
            if (!token) throw new Error('Not authenticated')

            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error?.message || 'Failed to save settings')
            }

            await refreshConfig()

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
        if (!e || !e.target) return
        const { name, value, type } = e.target
        setSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : value) : value
        }))
    }

    const updateNavLabel = (
        type: 'headerNavigation' | 'customerNavigation',
        id: string,
        field: 'label' | 'path',
        value: string
    ) => {
        setSettings(prev => ({
            ...prev,
            [type]: (prev[type] as NavItem[]).map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }))
    }

    const removeNavItem = (type: 'headerNavigation' | 'customerNavigation', id: string) => {
        setSettings(prev => ({
            ...prev,
            [type]: (prev[type] as NavItem[]).filter(item => item.id !== id)
        }))
    }

    const addNavItem = (type: 'headerNavigation' | 'customerNavigation') => {
        setSettings(prev => ({
            ...prev,
            [type]: [
                ...(prev[type] as NavItem[]),
                { id: generateId(), label: '', path: '' }
            ]
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
                                <label className="text-sm font-semibold text-gray-700">Store Logo</label>
                                <ImageUpload
                                    currentImageUrl={settings.logoUrl || ''}
                                    onUploadComplete={(url) => setSettings(prev => ({ ...prev, logoUrl: url }))}
                                    bucket="site-assets"
                                />
                                <Input
                                    type="hidden"
                                    name="logoUrl"
                                    value={settings.logoUrl || ''}
                                />
                                <p className="text-xs text-gray-500">Upload a transparent PNG for best results.</p>
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
                        <div className="space-y-6">
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
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Second Instagram URL (Optional)</label>
                                <Input
                                    name="instagramUrl2"
                                    value={settings.instagramUrl2 || ''}
                                    onChange={handleChange}
                                    placeholder="https://... (for additional Instagram profile)"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Admin Header Navigation */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Menu className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Admin Header Navigation</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Customize the tabs that appear in the admin header. Drag handles to reorder.
                            </p>

                            <div className="grid grid-cols-12 gap-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1 text-center">Order</div>
                                <div className="col-span-4">Label</div>
                                <div className="col-span-6">Path</div>
                                <div className="col-span-1"></div>
                            </div>

                            <Reorder.Group
                                axis="y"
                                values={settings.headerNavigation as NavItem[]}
                                onReorder={(newOrder) => setSettings({ ...settings, headerNavigation: newOrder })}
                                className="space-y-2"
                            >
                                {(settings.headerNavigation as NavItem[]).map((item) => (
                                    <SortableNavItem
                                        key={item.id}
                                        item={item}
                                        onChange={(field, value) => updateNavLabel('headerNavigation', item.id, field, value)}
                                        onRemove={() => removeNavItem('headerNavigation', item.id)}
                                    />
                                ))}
                            </Reorder.Group>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => addNavItem('headerNavigation')}
                                className="w-full mt-4 border-dashed h-9 text-sm relative"
                            >
                                + Add Navigation Item
                            </Button>

                            {(settings.headerNavigation as any[] || []).length === 0 && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                                    <p className="text-sm text-gray-400">Navigation is empty</p>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-pink-600 h-auto p-0 mt-1"
                                        onClick={() => {
                                            setSettings({
                                                ...settings,
                                                headerNavigation: DEFAULT_ADMIN_TABS
                                            });
                                        }}
                                    >
                                        Load Defaults
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Customer Header Navigation */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Menu className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Customer Header Navigation</h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Customize the tabs that appear in the customer header. Drag handles to reorder.
                            </p>

                            <div className="grid grid-cols-12 gap-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1 text-center">Order</div>
                                <div className="col-span-4">Label</div>
                                <div className="col-span-6">Path</div>
                                <div className="col-span-1"></div>
                            </div>

                            <Reorder.Group
                                axis="y"
                                values={settings.customerNavigation as NavItem[]}
                                onReorder={(newOrder) => setSettings({ ...settings, customerNavigation: newOrder })}
                                className="space-y-2"
                            >
                                {(settings.customerNavigation as NavItem[]).map((item) => (
                                    <SortableNavItem
                                        key={item.id}
                                        item={item}
                                        onChange={(field, value) => updateNavLabel('customerNavigation', item.id, field, value)}
                                        onRemove={() => removeNavItem('customerNavigation', item.id)}
                                    />
                                ))}
                            </Reorder.Group>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => addNavItem('customerNavigation')}
                                className="w-full mt-4 border-dashed h-9 text-sm"
                            >
                                + Add Navigation Item
                            </Button>

                            {(settings.customerNavigation as any[] || []).length === 0 && (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 mt-4">
                                    <p className="text-sm text-gray-400">Navigation is empty (will show categories)</p>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-blue-600 h-auto p-0 mt-1"
                                        onClick={() => {
                                            setSettings({
                                                ...settings,
                                                customerNavigation: DEFAULT_CUSTOMER_TABS
                                            });
                                        }}
                                    >
                                        Load Defaults
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Hero Banners */}
                    <Card className="p-8 border-none shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Hero Banners</h2>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    const newBanner: BannerItem = {
                                        id: generateId(),
                                        title: 'New Featured Collection',
                                        subtitle: 'Discover our latest arrivals',
                                        imageUrl: '',
                                        ctaText: 'Shop Now',
                                        ctaLink: '/products',
                                        position: banners.length,
                                        isActive: true,
                                        showBadge: true,
                                        showTopRated: true,
                                        isNew: true
                                    }
                                    setBanners([...banners, newBanner])
                                }}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Banner
                            </Button>
                        </div>

                        <div className="space-y-8">
                            {banners.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No hero banners configured yet.</p>
                                </div>
                            )}

                            <Reorder.Group
                                axis="y"
                                values={banners}
                                onReorder={setBanners}
                                className="space-y-6"
                            >
                                {banners.map((banner, index) => {
                                    return (
                                        <Reorder.Item
                                            key={banner.id}
                                            value={banner}
                                            className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
                                        >
                                            <div className="p-6">
                                                <div className="flex gap-6">
                                                    {/* Drag Handle */}
                                                    <div className="flex items-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600">
                                                        <GripVertical className="w-6 h-6" />
                                                    </div>

                                                    {/* Image Preview / Upload */}
                                                    <div className="w-48 space-y-2">
                                                        <ImageUpload
                                                            currentImageUrl={banner.imageUrl}
                                                            onUploadComplete={(url) => {
                                                                const newBanners = [...banners]
                                                                newBanners[index].imageUrl = url
                                                                setBanners(newBanners)
                                                            }}
                                                            bucket="site-assets"
                                                        />
                                                    </div>

                                                    {/* Form Fields */}
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div className="col-span-2 space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Banner Title</label>
                                                            <Input
                                                                value={banner.title}
                                                                onChange={(e) => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].title = e.target.value
                                                                    setBanners(newBanners)
                                                                }}
                                                                placeholder="Main headline"
                                                            />
                                                        </div>
                                                        <div className="col-span-2 space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Subtitle / Description</label>
                                                            <Input
                                                                value={banner.subtitle}
                                                                onChange={(e) => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].subtitle = e.target.value
                                                                    setBanners(newBanners)
                                                                }}
                                                                placeholder="Secondary text"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Button Text</label>
                                                            <Input
                                                                value={banner.ctaText}
                                                                onChange={(e) => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].ctaText = e.target.value
                                                                    setBanners(newBanners)
                                                                }}
                                                                placeholder="e.g. Shop Now"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Button URL</label>
                                                            <Input
                                                                value={banner.ctaLink}
                                                                onChange={(e) => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].ctaLink = e.target.value
                                                                    setBanners(newBanners)
                                                                }}
                                                                placeholder="e.g. /products"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Actions & Toggles */}
                                                    <div className="flex flex-col gap-4 min-w-[140px]">
                                                        {/* Status Toggle (isActive) */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Banner Status</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].isActive = !newBanners[index].isActive
                                                                    setBanners(newBanners)
                                                                }}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${banner.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
                                                            >
                                                                <span className="sr-only">Toggle Status</span>
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${banner.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                                                />
                                                                <span className="absolute right-1 text-[8px] font-bold text-white uppercase pr-1.5 select-none">{banner.isActive ? 'ON' : ''}</span>
                                                                <span className="absolute left-1 text-[8px] font-bold text-gray-400 uppercase pl-1.5 select-none">{!banner.isActive ? 'OFF' : ''}</span>
                                                            </button>
                                                        </div>

                                                        {/* Badge Toggle */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Craft Badge</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].showBadge = !newBanners[index].showBadge
                                                                    setBanners(newBanners)
                                                                }}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${banner.showBadge ? 'bg-pink-500' : 'bg-gray-200'}`}
                                                            >
                                                                <span className="sr-only">Toggle Badge</span>
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${banner.showBadge ? 'translate-x-6' : 'translate-x-1'}`}
                                                                />
                                                                <span className="absolute right-1 text-[8px] font-bold text-white uppercase pr-1.5 select-none">{banner.showBadge ? 'ON' : ''}</span>
                                                                <span className="absolute left-1 text-[8px] font-bold text-gray-400 uppercase pl-1.5 select-none">{!banner.showBadge ? 'OFF' : ''}</span>
                                                            </button>
                                                        </div>

                                                        {/* Top Rated Toggle */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Top Rated Card</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newBanners = [...banners]
                                                                    newBanners[index].showTopRated = !newBanners[index].showTopRated
                                                                    setBanners(newBanners)
                                                                }}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${banner.showTopRated ? 'bg-indigo-500' : 'bg-gray-200'}`}
                                                            >
                                                                <span className="sr-only">Toggle Top Rated</span>
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${banner.showTopRated ? 'translate-x-6' : 'translate-x-1'}`}
                                                                />
                                                                <span className="absolute right-1 text-[8px] font-bold text-white uppercase pr-1.5 select-none">{banner.showTopRated ? 'ON' : ''}</span>
                                                                <span className="absolute left-1 text-[8px] font-bold text-gray-400 uppercase pl-1.5 select-none">{!banner.showTopRated ? 'OFF' : ''}</span>
                                                            </button>
                                                        </div>

                                                        <div className="pt-2 border-t mt-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:bg-red-50 w-full justify-start p-0 h-8"
                                                                onClick={async () => {
                                                                    if (!banner.isNew) {
                                                                        if (!confirm('Permanently delete this banner?')) return
                                                                        try {
                                                                            const token = await accessToken()
                                                                            await fetch(`/api/admin/hero-banners/${banner.id}`, {
                                                                                method: 'DELETE',
                                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                                            })
                                                                        } catch (err) {
                                                                            console.error(err)
                                                                        }
                                                                    }
                                                                    setBanners(banners.filter(b => b.id !== banner.id))
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Reorder.Item>
                                    )
                                })}
                            </Reorder.Group>

                            {banners.length > 0 && (
                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            setIsSavingBanners(true)
                                            try {
                                                const token = await accessToken()
                                                // Save all banners sequentially or in parallel
                                                await Promise.all(banners.map(async (banner, index) => {
                                                    const payload = { ...banner, position: index }
                                                    const method = banner.isNew ? 'POST' : 'PUT'
                                                    const url = banner.isNew ? '/api/admin/hero-banners' : `/api/admin/hero-banners/${banner.id}`

                                                    const res = await fetch(url, {
                                                        method,
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify(payload)
                                                    })
                                                    return res.json()
                                                }))

                                                await refreshConfig()
                                                toast({
                                                    title: "Banners Saved",
                                                    description: "Hero banners have been synchronized."
                                                })

                                                // Refresh banners to get permanent IDs
                                                const bannersRes = await fetch('/api/admin/hero-banners', {
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                })
                                                if (bannersRes.ok) {
                                                    setBanners(await bannersRes.json())
                                                }
                                            } catch (error) {
                                                console.error(error)
                                                toast({
                                                    title: "Save Failed",
                                                    description: "Could not save banners.",
                                                    variant: "destructive"
                                                })
                                            } finally {
                                                setIsSavingBanners(false)
                                            }
                                        }}
                                        disabled={isSavingBanners}
                                        className="bg-pink-600 hover:bg-pink-700 text-white"
                                    >
                                        {isSavingBanners ? "Synchronizing..." : "Save Banner Configuration"}
                                    </Button>
                                </div>
                            )}
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
                                    value={settings.shippingBaseRate ?? ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Free Shipping Min Amount (LKR)</label>
                                <Input
                                    name="freeShippingThreshold"
                                    type="number"
                                    value={settings.freeShippingThreshold ?? ''}
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
        </div >
    )
}
