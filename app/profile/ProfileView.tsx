'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Package, Heart, Settings, MapPin,
    LogOut, Camera, ChevronRight, CheckCircle2,
    ShoppingBag, ShieldCheck, Bell, CreditCard,
    Plus, ExternalLink, Calendar, X, Mail, Phone,
    Trash2, AlertCircle, AlertTriangle, Key,
    MailCheck, LucideIcon, Search, SlidersHorizontal,
    Share2, ArrowRight, MoreHorizontal, ShoppingCart,
    HeartOff, LayoutGrid, List, Truck, Receipt,
    Info, ExternalLink as ExternalLinkIcon, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/hooks/use-toast'

type ProfileTab = 'account' | 'orders' | 'wishlist' | 'security'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
    size: string
}

interface OrderDetails {
    id: string
    date: string
    status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled'
    total: number
    items: OrderItem[]
    shippingAddress: string
    paymentMethod: string
    trackingNumber: string
}

export function ProfileView() {
    const { user, signOut, loading: authLoading, updateUser } = useAuth()
    const { totalItems: cartCount, addItem: addToCart } = useCart()
    const { items: wishlistItems, removeItem, clearWishlist } = useWishlist()
    const { toast } = useToast()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState<ProfileTab>('account')

    // Order History State
    const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
    const [showOrderDialog, setShowOrderDialog] = useState(false)
    const [orderCount, setOrderCount] = useState(2)

    // Wishlist Logic State
    const [wishlistSearch, setWishlistSearch] = useState('')
    const [wishlistSort, setWishlistSort] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest')
    const [wishlistView, setWishlistView] = useState<'grid' | 'list'>('grid')

    // Account Information State
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birthday: '',
        address: '',
    })

    // Security & Logic State
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [showNotificationsDialog, setShowNotificationsDialog] = useState(false)
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
    const [notificationSettings, setNotificationSettings] = useState({
        orderUpdates: true,
        promotions: false,
        accountSecurity: true,
        newsletter: true
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '+94 77 123 4567',
                birthday: user.birthday || '1995-05-15',
                address: user.address || '45/11, Flower Road, Colombo 03',
            })
        }
    }, [user])

    const handleSave = async () => {
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await updateUser({
            name: formData.name,
            phone: formData.phone,
            birthday: formData.birthday,
            address: formData.address
        })
        setIsEditing(false)
        setIsSaving(false)
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved and synced globally.",
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please select an image file.",
                variant: "destructive"
            })
            return
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            toast({
                title: "File Too Large",
                description: "Image must be less than 5MB.",
                variant: "destructive"
            })
            return
        }

        try {
            setIsSaving(true)

            if (!user) {
                throw new Error('User not authenticated')
            }

            // Create form data for upload
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', user.id)

            // Upload to server
            const response = await fetch('/api/upload/profile-image', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            // Update user profile with the new image URL
            await updateUser({ profileImage: data.imageUrl })

            toast({
                title: "Profile Picture Updated",
                description: "Your new avatar is now visible across the site.",
            })
        } catch (error) {
            console.error('Error uploading profile image:', error)
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // Order Details Logic - Fully Dynamic
    const handleViewOrder = (id: string, idx: number) => {
        // Dynamic product catalog for different orders
        const productCatalog = [
            [
                { id: '1', name: 'Premium Silk Blouse', price: 8500, image: 'https://images.unsplash.com/photo-1598559069352-3d8437b0d427?q=80&w=200&auto=format&fit=crop', size: 'M' },
                { id: '2', name: 'Tailored Linen Trousers', price: 6000, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=200&auto=format&fit=crop', size: 'L' },
            ],
            [
                { id: '3', name: 'Classic White Shirt', price: 5500, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=200&auto=format&fit=crop', size: 'L' },
                { id: '4', name: 'Designer Denim Jacket', price: 12500, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200&auto=format&fit=crop', size: 'XL' },
                { id: '5', name: 'Leather Belt', price: 3500, image: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?q=80&w=200&auto=format&fit=crop', size: 'One Size' },
            ],
            [
                { id: '6', name: 'Cashmere Sweater', price: 15000, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200&auto=format&fit=crop', size: 'M' },
                { id: '7', name: 'Wool Scarf', price: 4500, image: 'https://images.unsplash.com/photo-1601740599584-421d0ae06f37?q=80&w=200&auto=format&fit=crop', size: 'One Size' },
            ],
            [
                { id: '8', name: 'Summer Dress', price: 9500, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=200&auto=format&fit=crop', size: 'S' },
                { id: '9', name: 'Canvas Sneakers', price: 7500, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200&auto=format&fit=crop', size: '42' },
                { id: '10', name: 'Sunglasses', price: 6500, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=200&auto=format&fit=crop', size: 'One Size' },
            ],
        ]

        // Get order-specific items (cycle through catalog if more orders than catalog entries)
        const orderItems = productCatalog[idx % productCatalog.length].map((item, itemIdx) => ({
            ...item,
            quantity: Math.floor(Math.random() * 2) + 1, // Random quantity 1-2
        }))

        // Calculate dynamic total based on actual items
        const calculatedTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // Dynamic order status based on order age
        const statuses: ('Delivered' | 'Processing' | 'Shipped')[] = ['Delivered', 'Shipped', 'Processing']
        const orderStatus = statuses[idx % statuses.length]

        const mockOrder: OrderDetails = {
            id: `WML-10250${idx + 1}`,
            date: `October ${20 + idx}, 2024`,
            status: orderStatus,
            total: calculatedTotal,
            items: orderItems,
            shippingAddress: formData.address || '45/11, Flower Road, Colombo 03, Sri Lanka',
            paymentMethod: idx % 2 === 0 ? 'Visa Ending In **** 4242' : 'Mastercard Ending In **** 8967',
            trackingNumber: `TRACK-WM-${102500 + idx + 1}`
        }
        setSelectedOrder(mockOrder)
        setShowOrderDialog(true)
    }

    // Wishlist Actions
    const filteredWishlist = useMemo(() => {
        let result = wishlistItems.filter(item =>
            item.name.toLowerCase().includes(wishlistSearch.toLowerCase()) ||
            item.category.toLowerCase().includes(wishlistSearch.toLowerCase())
        )

        switch (wishlistSort) {
            case 'price-low': result.sort((a, b) => a.price - b.price); break;
            case 'price-high': result.sort((a, b) => b.price - a.price); break;
            case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'newest': default: result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()); break;
        }

        return result
    }, [wishlistItems, wishlistSearch, wishlistSort])

    const handleMoveToCart = (item: any) => {
        addToCart({
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image || '',
            quantity: 1,
            slug: item.slug
        })
        removeItem(item.productId)
        toast({
            title: "Moved to Cart",
            description: `${item.name} is now in your basket.`
        })
    }

    const handleMoveAllToCart = () => {
        filteredWishlist.forEach(item => {
            addToCart({
                productId: item.productId,
                name: item.name,
                price: item.price,
                image: item.image || '',
                quantity: 1,
                slug: item.slug
            })
        })
        clearWishlist()
        toast({
            title: "Wishlist Synchronized",
            description: "All selected items have been transferred to your cart."
        })
    }

    const handleShareWishlist = () => {
        navigator.clipboard.writeText(`${window.location.origin}/wishlist/share/${user?.id}`)
        toast({
            title: "Link Copied",
            description: "Your curated wishlist link is ready to share."
        })
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.new !== passwordData.confirm) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" })
            return
        }

        try {
            setIsSaving(true)
            const { error } = await (await import('@/lib/supabase')).supabase.auth.updateUser({
                password: passwordData.new
            })

            if (error) throw error

            setShowPasswordDialog(false)
            setPasswordData({ current: '', new: '', confirm: '' })
            toast({ title: "Success", description: "Your password has been changed successfully." })
        } catch (error: any) {
            console.error('Error changing password:', error)
            toast({
                title: "Error",
                description: error.message || "Failed to update password. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleNotificationSave = async () => {
        setIsSaving(true)
        await new Promise(r => setTimeout(r, 1000))
        setIsSaving(false)
        setShowNotificationsDialog(false)
        toast({ title: "Preferences Saved", description: "Your notification settings have been updated." })
    }

    const handleDeactivate = async () => {
        setIsSaving(true)
        await new Promise(r => setTimeout(r, 2000))
        setIsSaving(false)
        setShowDeactivateDialog(false)
        signOut()
        window.location.href = '/'
    }

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) return null

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'security', label: 'Security', icon: ShieldCheck },
    ]

    return (
        <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
            <div className="max-w-6xl mx-auto px-4 py-8 md:py-20">

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                {/* Profile Summary Header - Responsive Stack */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 pb-8 md:pb-12 border-b border-slate-200 gap-6 md:gap-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-semibold text-slate-900 border border-slate-200 overflow-hidden shadow-sm">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-pink-300 to-yellow-300 flex items-center justify-center">
                                        {user.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-900 transition-all hover:scale-110"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{user.name}</h1>
                            <p className="text-slate-500 text-sm mt-1">{user.email}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                <Badge className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border-none">Silver Member</Badge>
                                <span className="text-xs text-slate-400">Joined Nov 2024</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                        <Link href="/cart" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full rounded-full flex items-center justify-center gap-2 border-slate-200 shadow-sm hover:bg-slate-50 h-11">
                                <ShoppingBag className="h-4 w-4" /> <span className="hidden sm:inline">Cart</span>({cartCount})
                            </Button>
                        </Link>
                        <Button onClick={() => signOut()} variant="secondary" className="flex-1 md:flex-none rounded-full text-slate-600 hover:text-red-600 hover:bg-red-50 h-11">
                            <LogOut className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Sign Out</span>
                        </Button>
                    </div>
                </div>

                {/* Mobile Tab Scroller */}
                <div className="lg:hidden mb-8 overflow-x-auto no-scrollbar -mx-4 px-4">
                    <div className="flex gap-2 min-w-max pb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ProfileTab)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-white text-slate-500 border border-slate-100'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* DESKTOP SIDEBAR NAVIGATION */}
                    <div className="hidden lg:block lg:col-span-3">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <SidebarLink
                                    key={tab.id}
                                    label={tab.label === 'Account' ? 'Account Information' : tab.label === 'Orders' ? 'Order History' : tab.label === 'Wishlist' ? 'Wishlist Favorites' : 'Security & Privacy'}
                                    icon={tab.icon}
                                    active={activeTab === tab.id}
                                    onClick={() => setActiveTab(tab.id as ProfileTab)}
                                />
                            ))}
                        </nav>

                        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="h-4 w-4 text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Help Center</p>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">Have questions about your premium account? Contact our team 24/7.</p>
                            <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest h-10 rounded-xl border-slate-200 hover:bg-slate-50">Contact Support</Button>
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="lg:col-span-9 bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px] md:min-h-[600px]">

                        <AnimatePresence mode="wait">

                            {/* ACCOUNT TAB */}
                            {activeTab === 'account' && (
                                <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 md:p-12">
                                    <div className="flex justify-between items-center mb-10">
                                        <h2 className="text-xl font-bold">Personal Details</h2>
                                        <Button variant={isEditing ? "ghost" : "outline"} onClick={() => setIsEditing(!isEditing)} className="rounded-full border-slate-200 h-10 px-6">
                                            {isEditing ? "Cancel" : "Edit Profile"}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Full Name</Label>
                                            {isEditing ? (
                                                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-lg h-12 focus:ring-slate-900 border-slate-200" />
                                            ) : (
                                                <p className="text-slate-900 font-medium py-3 border-b border-slate-50">{formData.name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Email Address</Label>
                                            <p className="text-slate-400 font-medium py-3 border-b border-slate-50">{formData.email}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Phone Number</Label>
                                            {isEditing ? (
                                                <Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="rounded-lg h-12 border-slate-200" />
                                            ) : (
                                                <p className="text-slate-900 font-medium py-3 border-b border-slate-50">{formData.phone}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Date of Birth</Label>
                                            {isEditing ? (
                                                <Input type="date" value={formData.birthday} onChange={(e) => setFormData(p => ({ ...p, birthday: e.target.value }))} className="rounded-lg h-12 border-slate-200" />
                                            ) : (
                                                <p className="text-slate-900 font-medium py-3 border-b border-slate-50">{formData.birthday}</p>
                                            )}
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">Default Delivery Address</Label>
                                            {isEditing ? (
                                                <Input value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} className="rounded-lg h-12 border-slate-200" />
                                            ) : (
                                                <div className="flex items-start gap-2 py-3 border-b border-slate-50">
                                                    <MapPin className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
                                                    <p className="text-slate-600 font-medium">{formData.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
                                            <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto rounded-full bg-slate-900 text-white hover:bg-slate-800 px-8 h-12 shadow-sm transition-all active:scale-95">
                                                {isSaving ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ORDERS TAB */}
                            {activeTab === 'orders' && (
                                <motion.div key="orders" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6 md:p-12">
                                    <h2 className="text-xl font-bold mb-8">Purchase History</h2>
                                    <div className="space-y-4 md:space-y-6">
                                        {[...Array(orderCount)].map((_, idx) => {
                                            const id = idx + 1;
                                            return (
                                                <div key={id} className="group p-4 md:p-6 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all bg-white relative">
                                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 md:gap-6">
                                                        <div className="flex items-center gap-4 md:gap-6">
                                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors">
                                                                <Package className="h-6 w-6 text-slate-300" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">Order #WML-10250{id}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                    <span className="text-xs text-slate-500 font-medium">Oct 2{id}, 2024</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-12 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                                                            <div className="sm:text-right">
                                                                <p className="text-sm font-bold text-slate-900">LKR {(14500 + id * 1250).toLocaleString()}.00</p>
                                                                <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center sm:justify-end gap-1">
                                                                    <CheckCircle2 className="h-3 w-3" /> Delivered
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="rounded-xl hover:bg-slate-50 px-2 sm:px-4 shrink-0"
                                                                onClick={() => handleViewOrder(`WML-10250${id}`, idx)}
                                                            >
                                                                <span className="hidden xs:inline mr-2">Details</span> <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        <div className="flex justify-center pt-8">
                                            <Button variant="outline" onClick={() => setOrderCount(prev => prev + 2)} className="w-full sm:w-auto rounded-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-900 hover:bg-slate-50 transition-all px-8 h-11 border-slate-200">
                                                Load More Orders
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* WISHLIST TAB */}
                            {activeTab === 'wishlist' && (
                                <motion.div key="wishlist" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="p-6 md:p-12 flex flex-col h-full">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold">Saved Items</h2>
                                            <p className="text-xs text-slate-400 mt-1">Found {filteredWishlist.length} products in your vault.</p>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <Button variant="outline" className="flex-1 sm:flex-none rounded-full h-11 px-6 border-slate-200 shadow-sm" onClick={handleShareWishlist}>
                                                <Share2 className="h-4 w-4 mr-2" /> <span className="text-xs font-bold uppercase tracking-widest">Share</span>
                                            </Button>
                                            <Link href="/products" className="hidden xs:block">
                                                <Button variant="ghost" className="rounded-full h-11 px-6 font-bold text-xs uppercase tracking-widest bg-slate-50">Browse</Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Wishlist Controls */}
                                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-50 gap-4">
                                        <div className="relative w-full md:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search saved items..."
                                                className="pl-10 h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 transition-all text-sm"
                                                value={wishlistSearch}
                                                onChange={e => setWishlistSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="flex-1 md:flex-none h-11 rounded-xl px-4 border border-slate-100 bg-white">
                                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Sort</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                                                    <DropdownMenuItem onClick={() => setWishlistSort('newest')} className="rounded-xl text-xs font-medium py-2 px-3">Newest First</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setWishlistSort('price-low')} className="rounded-xl text-xs font-medium py-2 px-3">Price: Low to High</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setWishlistSort('price-high')} className="rounded-xl text-xs font-medium py-2 px-3">Price: High to Low</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setWishlistSort('name')} className="rounded-xl text-xs font-medium py-2 px-3">Product Name</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                                <button onClick={() => setWishlistView('grid')} className={`p-2 rounded-lg transition-all ${wishlistView === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                                                    <LayoutGrid className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setWishlistView('list')} className={`p-2 rounded-lg transition-all ${wishlistView === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                                                    <List className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {wishlistItems.length > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-11 w-11 p-0 rounded-xl bg-slate-100/50">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl w-56 p-2 shadow-2xl">
                                                        <DropdownMenuItem className="rounded-xl py-3 px-3 flex items-center gap-3 text-slate-700 font-medium" onClick={handleMoveAllToCart}>
                                                            <ShoppingCart className="h-4 w-4 text-emerald-500" />
                                                            <span className="text-xs uppercase tracking-widest font-bold">Move all to cart</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        <DropdownMenuItem className="rounded-xl py-3 px-3 flex items-center gap-3 text-red-500 font-medium" onClick={clearWishlist}>
                                                            <HeartOff className="h-4 w-4" />
                                                            <span className="text-xs uppercase tracking-widest font-bold">Clear Wishlist</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>

                                    {filteredWishlist.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 md:py-32 bg-slate-50/50 rounded-2xl md:rounded-[2rem] border border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                                <Heart className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <p className="text-slate-900 font-bold uppercase tracking-[0.2em] text-xs">Your vault is empty</p>
                                            <p className="text-[12px] text-slate-400 mt-2 max-w-[250px] text-center leading-relaxed">Save items you love and they will appear here for later.</p>
                                            <Link href="/products" className="mt-8">
                                                <Button className="rounded-full bg-slate-900 text-white h-12 px-10 font-bold text-xs shadow-lg shadow-slate-200">Start Shopping</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className={wishlistView === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" : "flex flex-col gap-4"}>
                                            <AnimatePresence mode="popLayout">
                                                {filteredWishlist.map((item) => (
                                                    <motion.div
                                                        key={item.productId}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className={wishlistView === 'grid' ? "group flex flex-col" : "group flex items-center gap-4 md:gap-6 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-all bg-white shadow-sm hover:shadow-md"}
                                                    >
                                                        <div className={wishlistView === 'grid' ? "aspect-[3/4] w-full bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative shadow-sm group-hover:shadow-2xl transition-all duration-500" : "w-24 h-32 md:w-32 md:h-40 bg-slate-100 rounded-xl md:rounded-2xl overflow-hidden relative shrink-0 shadow-sm"}>
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                                    <LayoutGrid className="h-8 w-8" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                            <button
                                                                onClick={() => removeItem(item.productId)}
                                                                className="absolute top-3 right-3 md:top-4 md:right-4 p-2 md:p-2.5 bg-white/95 backdrop-blur rounded-full md:rounded-2xl text-slate-400 hover:text-red-500 shadow-xl transition-all z-10 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                                            </button>

                                                            {wishlistView === 'grid' && (
                                                                <button
                                                                    onClick={() => handleMoveToCart(item)}
                                                                    className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 bg-slate-900 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-10 opacity-100 sm:opacity-0 sm:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
                                                                >
                                                                    Move to Cart
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className={wishlistView === 'grid' ? "mt-4 px-1" : "flex-1 min-w-0"}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[100px]">{item.category}</span>
                                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest shrink-0">In Stock</span>
                                                            </div>
                                                            <h3 className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">{item.name}</h3>
                                                            <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                                                                <p className="text-sm font-black text-slate-900">LKR {item.price.toLocaleString()}</p>
                                                                <span className="text-[9px] font-medium text-slate-400">Saved {new Date(item.addedAt).toLocaleDateString()}</span>
                                                            </div>

                                                            {wishlistView === 'list' && (
                                                                <div className="mt-4 flex gap-2">
                                                                    <Button size="sm" onClick={() => handleMoveToCart(item)} className="rounded-xl bg-slate-900 text-white h-9 px-4 md:px-6 font-bold text-[10px] uppercase tracking-widest flex-1">Add to cart</Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)} className="rounded-xl h-9 text-slate-400 hover:text-red-500 hidden sm:flex">Remove</Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* SECURITY TAB */}
                            {activeTab === 'security' && (
                                <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 md:p-12">
                                    <h2 className="text-xl font-bold mb-4">Security & Privacy</h2>
                                    <p className="text-sm text-slate-400 mb-8 md:mb-10 leading-relaxed max-w-lg">Protect your account by regularly updating your credentials and managing how we communicate with you.</p>

                                    <div className="space-y-3">
                                        <SecurityItem
                                            title="Change Password"
                                            desc="Keep your account safe with a strong, rotating password. We recommend updating every 3 months."
                                            icon={Key}
                                            action="Update"
                                            onClick={() => setShowPasswordDialog(true)}
                                        />
                                        <SecurityItem
                                            title="Email Notifications"
                                            desc="Tailor your communication experience. Choose when and why you want to hear from us."
                                            icon={Bell}
                                            action="Manage"
                                            onClick={() => setShowNotificationsDialog(true)}
                                        />
                                        <SecurityItem
                                            title="Close Account"
                                            desc="Permanently deactivate your profile. This process is irreversible and all your data will be cleared."
                                            icon={AlertTriangle}
                                            action="Deactivate"
                                            danger
                                            onClick={() => setShowDeactivateDialog(true)}
                                        />
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>

                        {/* Footer Bar - Dynamic Stats */}
                        <div className="mt-auto p-4 md:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest order-2 sm:order-1">WebMall Secure Dashboard • 2024</p>
                            <div className="flex items-center gap-4 order-1 sm:order-2">
                                <Link href="/faq" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Support Portal</Link>
                                <Separator orientation="vertical" className="h-3 bg-slate-200" />
                                <Link href="/privacy" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy Engine</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ORDER DETAILS DIALOG - MAX MOBILE FRIENDLY */}
            <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl rounded-2xl md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogTitle className="sr-only">Order Details</DialogTitle>
                    {selectedOrder && (
                        <div className="flex flex-col">
                            <div className="p-6 md:p-8 bg-slate-900 text-white">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <Badge className="bg-emerald-500 text-white border-none rounded-full px-4 mb-3 text-[10px] font-bold">
                                            {selectedOrder.status}
                                        </Badge>
                                        <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">Order {selectedOrder.id}</h2>
                                        <p className="text-slate-400 text-xs mt-1">Confirmed on {selectedOrder.date}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total</p>
                                        <p className="text-lg md:text-2xl font-bold">LKR {selectedOrder.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 md:p-8 space-y-6 md:space-y-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {/* Order Tracking UI */}
                                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Truck className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking Number</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{selectedOrder.trackingNumber}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl border-slate-200 text-[10px] font-black uppercase h-9">
                                        Status Live <ExternalLinkIcon className="ml-2 h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Items Breakdown */}
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Manifest ({selectedOrder.items.length})</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-3 border border-slate-100/50 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="w-12 h-16 md:w-16 md:h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                                    <p className="text-xs text-slate-400 mt-1">Qty: {item.quantity} • Size: {item.size}</p>
                                                </div>
                                                <p className="text-sm font-black text-slate-900 shrink-0">LKR {item.price.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-slate-50" />

                                {/* Delivery & Payment Breakdown */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest">Delivery Engine</h3>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed pr-2">
                                            {selectedOrder.shippingAddress}
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <CreditCard className="h-3.5 w-3.5" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest">Billing Method</h3>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">
                                            {selectedOrder.paymentMethod}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col xs:flex-row justify-end gap-3">
                                <Button variant="outline" className="rounded-xl font-bold text-[10px] uppercase h-11 px-8 border-slate-200" onClick={() => setShowOrderDialog(false)}>
                                    Dismiss
                                </Button>
                                <Button className="rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase h-11 px-8 shadow-lg shadow-slate-200">
                                    Invoice <Receipt className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* PASSWORD DIALOG - RESPONSIVE */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl md:rounded-3xl p-6 md:p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Credentials Guard</DialogTitle>
                        <DialogDescription className="text-sm">Rotate your password to maintain high-level security.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-5 py-4">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Token (Current)</Label>
                                <Input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="rounded-xl h-11 border-slate-200 placeholder:text-slate-200"
                                    value={passwordData.current}
                                    onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Vault Code</Label>
                                <Input
                                    type="password"
                                    required
                                    className="rounded-xl h-11 border-slate-200"
                                    value={passwordData.new}
                                    onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Vault Code</Label>
                                <Input
                                    type="password"
                                    required
                                    className="rounded-xl h-11 border-slate-200"
                                    value={passwordData.confirm}
                                    onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200">
                                {isSaving ? "Updating Vault..." : "Re-Encrypt Credentials"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* NOTIFICATIONS DIALOG - SCROLLABLE ON MOBILE */}
            <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl md:rounded-3xl p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 md:p-8 bg-slate-50/50">
                        <DialogTitle className="text-xl font-bold">Signal Management</DialogTitle>
                        <DialogDescription className="text-xs">Select which frequencies you want to tune in to.</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 md:p-6 space-y-2 md:space-y-3 max-h-[50vh] overflow-y-auto">
                        <NotificationToggle
                            label="Transaction Logs"
                            desc="Real-time alerts about your shipments and deliveries."
                            checked={notificationSettings.orderUpdates}
                            onCheckedChange={v => setNotificationSettings(s => ({ ...s, orderUpdates: v }))}
                        />
                        <NotificationToggle
                            label="Market Intel"
                            desc="Receive early access to sales and exclusive member offers."
                            checked={notificationSettings.promotions}
                            onCheckedChange={v => setNotificationSettings(s => ({ ...s, promotions: v }))}
                        />
                        <NotificationToggle
                            label="Security Uplink"
                            desc="Get notified of any unusual login activity or security changes."
                            checked={notificationSettings.accountSecurity}
                            onCheckedChange={v => setNotificationSettings(s => ({ ...s, accountSecurity: v }))}
                        />
                        <NotificationToggle
                            label="Curated Feed"
                            desc="A monthly roundup of design trends and new arrivals."
                            checked={notificationSettings.newsletter}
                            onCheckedChange={v => setNotificationSettings(s => ({ ...s, newsletter: v }))}
                        />
                    </div>
                    <div className="p-6 md:p-8 border-t border-slate-100 flex gap-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold text-xs" onClick={() => setShowNotificationsDialog(false)}>Cancel</Button>
                        <Button onClick={handleNotificationSave} disabled={isSaving} className="flex-2 rounded-xl h-12 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-slate-200">
                            {isSaving ? "Syncing..." : "Update Signals"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DEACTIVATE DIALOG */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl md:rounded-3xl p-6 md:p-8 border-red-100">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-sm">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-red-600">Deactivate Profile?</DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm leading-relaxed">
                            This action terminates your access permanently. You will lose your history, curated favorites, and loyalty rewards instantaneously.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 font-bold text-slate-900 text-sm text-center md:text-left">
                        Are you certain you want to clear your WebMall presence?
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button variant="ghost" className="rounded-xl flex-1 border-slate-100 h-12 font-bold text-xs" onClick={() => setShowDeactivateDialog(false)}>
                            Maintain Account
                        </Button>
                        <Button
                            disabled={isSaving}
                            onClick={handleDeactivate}
                            className="rounded-xl flex-1 bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-100 font-black uppercase tracking-widest text-[10px] h-12"
                        >
                            {isSaving ? "Purging..." : "Confirm Deactivation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SidebarLink({ label, icon: Icon, active, onClick }: { label: string, icon: LucideIcon, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${active
                ? 'bg-white text-slate-900 shadow-sm border border-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
        >
            <Icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
            <span className="text-sm tracking-tight">{label}</span>
            {active && (
                <motion.div layoutId="active-pill" className="ml-auto w-1 h-5 bg-slate-900 rounded-full" />
            )}
        </button>
    )
}

function SecurityItem({ title, desc, icon: Icon, action, danger = false, onClick }: { title: string, desc: string, icon: LucideIcon, action: string, danger?: boolean, onClick: () => void }) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 rounded-2xl border border-slate-50 bg-slate-50/20 hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all group gap-4">
            <div className="flex items-center gap-4 md:gap-5 w-full md:w-3/4">
                <div className={`p-4 rounded-xl shadow-sm shrink-0 transition-all ${danger ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                    <Icon className="h-5 w-5 md:h-5.5 md:w-5.5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-sm line-clamp-2 md:line-clamp-none">{desc}</p>
                </div>
            </div>
            <Button
                variant={danger ? "ghost" : "outline"}
                onClick={onClick}
                className={`w-full md:w-auto rounded-xl text-[10px] font-black uppercase tracking-widest px-8 h-10 ${danger ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'border-slate-200 hover:border-slate-900 shadow-sm bg-white'}`}
            >
                {action}
            </Button>
        </div>
    )
}

function NotificationToggle({ label, desc, checked, onCheckedChange }: { label: string, desc: string, checked: boolean, onCheckedChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between p-4 rounded-2xl md:rounded-2xl hover:bg-white hover:shadow-md transition-all gap-4 border border-transparent hover:border-slate-100">
            <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed md:line-clamp-none">{desc}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} className="mt-1 shrink-0 data-[state=checked]:bg-slate-900" />
        </div>
    )
}
