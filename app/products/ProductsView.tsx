'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Grid2x2 as Grid, List, Sparkles, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/products/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    images: { url: string; alt?: string | null }[]
    category: { name: string } | null | undefined
    subcategory?: { name: string; slug: string } | null | undefined
    description?: string
    variants?: any[]
    avgRating?: number
    reviewCount?: number
    stock?: number
}

interface Subcategory {
    id: string
    name: string
    slug: string
    description?: string | null
}

interface CategoryWithSub {
    id: string
    name: string
    slug: string
    description?: string | null
    image?: string | null
    subcategories: Subcategory[]
}

interface ProductsViewProps {
    initialProducts: Product[]
    initialCategories: CategoryWithSub[]
}

// Build mandala data at module level (not in render) — avoids SSR/client hydration mismatch.
// Using toFixed(2) rounding ensures identical string output on server and browser.
function buildMandala(cx: number, cy: number) {
    const rings = [16, 30, 44, 58, 72, 88]
    const angles = Array.from({ length: 12 }, (_, i) => i * 30)

    // Spokes: full length from center to outermost ring
    const spokes = angles.map(deg => {
        const a = deg * Math.PI / 180
        return {
            x2: +(cx + 88 * Math.cos(a)).toFixed(2),
            y2: +(cy + 88 * Math.sin(a)).toFixed(2),
        }
    })

    // Petal arcs: quadratic bezier connecting adjacent spoke intersections on each ring.
    // Control point pulled 20% toward center → bows inward like the reference pattern.
    const petalPaths = rings.map(r =>
        angles.map((deg, i) => {
            const a1 = deg * Math.PI / 180
            const a2 = ((deg + 30) % 360) * Math.PI / 180
            const aMid = (deg + 15) * Math.PI / 180
            const x1 = +(cx + r * Math.cos(a1)).toFixed(2)
            const y1 = +(cy + r * Math.sin(a1)).toFixed(2)
            const x2 = +(cx + r * Math.cos(a2)).toFixed(2)
            const y2 = +(cy + r * Math.sin(a2)).toFixed(2)
            const qx = +(cx + 0.8 * r * Math.cos(aMid)).toFixed(2)
            const qy = +(cy + 0.8 * r * Math.sin(aMid)).toFixed(2)
            return `M${x1},${y1} Q${qx},${qy} ${x2},${y2}`
        }).join(' ')
    )

    // Outer petal arcs: connect inner ring to outer ring adjacent spoke (creates teardrop petals)
    const teardrops = rings.slice(0, rings.length - 1).map((r1, ri) => {
        const r2 = rings[ri + 1]
        return angles.map((deg, i) => {
            const a1 = deg * Math.PI / 180
            const a2 = ((deg + 30) % 360) * Math.PI / 180
            const aMid = (deg + 15) * Math.PI / 180
            const x1 = +(cx + r1 * Math.cos(a1)).toFixed(2)
            const y1 = +(cy + r1 * Math.sin(a1)).toFixed(2)
            const x2 = +(cx + r2 * Math.cos(a2)).toFixed(2)
            const y2 = +(cy + r2 * Math.sin(a2)).toFixed(2)
            const rMid = (r1 + r2) / 2
            const qx = +(cx + rMid * Math.cos(aMid)).toFixed(2)
            const qy = +(cy + rMid * Math.sin(aMid)).toFixed(2)
            return `M${x1},${y1} Q${qx},${qy} ${x2},${y2}`
        }).join(' ')
    })

    // Dot accents at every spoke × ring intersection
    const dots = rings.flatMap(r =>
        angles.map(deg => {
            const a = deg * Math.PI / 180
            return {
                cx: +(cx + r * Math.cos(a)).toFixed(2),
                cy: +(cy + r * Math.sin(a)).toFixed(2),
            }
        })
    )

    return { spokes, petalPaths, teardrops, dots, rings, cx, cy }
}

const LM = buildMandala(50, 100)
const RM = buildMandala(150, 100)

export function ProductsView({ initialProducts: products, initialCategories: categories }: ProductsViewProps) {
    const searchParams = useSearchParams()

    const initialCategoryParam = searchParams.get('category')?.toLowerCase().trim()
    
    // Parse category and subcategory from initial URL
    let initialCategory = 'All'
    let initialSubcategory = null

    if (initialCategoryParam) {
        const parentCat = categories.find(c => 
            c.slug.toLowerCase() === initialCategoryParam || 
            c.name.toLowerCase().trim() === initialCategoryParam.replace(/-/g, ' ')
        )
        if (parentCat) {
            initialCategory = parentCat.name
        } else {
            for (const cat of categories) {
                const sub = cat.subcategories?.find(s => 
                    s.slug.toLowerCase() === initialCategoryParam || 
                    s.name.toLowerCase().trim() === initialCategoryParam.replace(/-/g, ' ')
                )
                if (sub) {
                    initialCategory = cat.name
                    initialSubcategory = sub.name
                    break
                }
            }
        }
    }

    const initialSearch = searchParams.get('search') || ''
    const initialSort = searchParams.get('sort') || 'name'
    const initialViewMode = (searchParams.get('view') as 'grid'|'list') || 'grid'

    const [searchQuery, setSearchQuery] = useState(initialSearch)
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(initialSubcategory)
    const [sortBy, setSortBy] = useState(initialSort)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
    const { addItem } = useCart()
    const { addItem: addToWishlist } = useWishlist()
    const { user } = useAuth()

    // Price range filter
    const maxProductPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => p.price), 0)), [products])
    const [priceMin, setPriceMin] = useState(0)
    const [priceMax, setPriceMax] = useState(0)
    const [appliedPriceMin, setAppliedPriceMin] = useState(0)
    const [appliedPriceMax, setAppliedPriceMax] = useState(0)
    // Init price max once products load
    useEffect(() => {
        if (maxProductPrice > 0 && priceMax === 0) {
            setPriceMax(maxProductPrice)
            setAppliedPriceMax(maxProductPrice)
        }
    }, [maxProductPrice, priceMax])

    // Pagination
    const ITEMS_PER_PAGE = 16
    const [currentPage, setCurrentPage] = useState(1)

    // Sync state changes to URL to enable perfect scroll restoration on browser back
    const lastParamsRef = useRef(searchParams.toString())

    // Sync state changes to URL to enable perfect scroll restoration on browser back
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        
        if (selectedSubcategory) {
            const sub = categories
                .flatMap(c => c.subcategories || [])
                .find(s => s.name === selectedSubcategory)
            if (sub) {
                params.set('category', sub.slug)
            } else {
                params.set('category', selectedSubcategory.toLowerCase().replace(/ /g, '-'))
            }
        } else if (selectedCategory !== 'All') {
            const cat = categories.find(c => c.name === selectedCategory)
            if (cat) {
                params.set('category', cat.slug)
            } else {
                params.set('category', selectedCategory.toLowerCase().replace(/ /g, '-'))
            }
        }
        
        if (sortBy !== 'name') params.set('sort', sortBy)
        if (viewMode !== 'grid') params.set('view', viewMode)
        
        const newParamsStr = params.toString()
        const newUrl = newParamsStr ? `?${newParamsStr}` : window.location.pathname
        window.history.replaceState(null, '', newUrl)
        lastParamsRef.current = newParamsStr
    }, [searchQuery, selectedCategory, selectedSubcategory, sortBy, viewMode, categories])

    // Sync state when URL search params change (e.g. from header search or navigation)
    useEffect(() => {
        const currentParamsStr = searchParams.toString()
        if (currentParamsStr === lastParamsRef.current) {
            return
        }
        lastParamsRef.current = currentParamsStr

        const categoryParam = searchParams.get('category')?.toLowerCase().trim()
        const search = searchParams.get('search') || ''
        const sort = searchParams.get('sort') || 'name'
        const view = (searchParams.get('view') as 'grid'|'list') || 'grid'

        setSearchQuery(search)
        setSortBy(sort)
        setViewMode(view)

        if (categoryParam) {
            const parentCat = categories.find(c => 
                c.slug.toLowerCase() === categoryParam || 
                c.name.toLowerCase().trim() === categoryParam.replace(/-/g, ' ')
            )
            if (parentCat) {
                setSelectedCategory(parentCat.name)
                setSelectedSubcategory(null)
                return
            }

            let foundParent: any = null
            let foundSub: any = null
            for (const cat of categories) {
                const sub = cat.subcategories?.find(s => 
                    s.slug.toLowerCase() === categoryParam || 
                    s.name.toLowerCase().trim() === categoryParam.replace(/-/g, ' ')
                )
                if (sub) {
                    foundParent = cat
                    foundSub = sub
                    break
                }
            }

            if (foundSub) {
                setSelectedCategory(foundParent.name)
                setSelectedSubcategory(foundSub.name)
            } else {
                setSelectedCategory('All')
                setSelectedSubcategory(null)
            }
        } else {
            setSelectedCategory('All')
            setSelectedSubcategory(null)
        }
    }, [searchParams, categories])

    // Filter products
    useEffect(() => {
        let filtered = products

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.subcategory?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by category / subcategory
        if (selectedSubcategory) {
            filtered = filtered.filter(product =>
                product.subcategory?.name === selectedSubcategory
            )
        } else if (selectedCategory !== 'All') {
            filtered = filtered.filter(product =>
                product.category?.name === selectedCategory
            )
        }

        // Filter by price range
        if (appliedPriceMax > 0) {
            filtered = filtered.filter(p => p.price >= appliedPriceMin && p.price <= appliedPriceMax)
        }

        // Sort products
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price
                case 'price-high': return b.price - a.price
                case 'name': return a.name.localeCompare(b.name)
                default: return 0
            }
        })

        setFilteredProducts(filtered)
        setCurrentPage(1) // reset to page 1 on any filter change
    }, [searchQuery, selectedCategory, selectedSubcategory, sortBy, products, appliedPriceMin, appliedPriceMax])

    const handleAddToCart = (product: any) => {
        if (!user) {
            window.location.href = '/login'
            return
        }
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images[0]?.url,
            slug: product.slug
        })
    }

    const handleAddToWishlist = (product: any) => {
        if (!user) {
            window.location.href = '/login'
            return
        }
        addToWishlist({
            productId: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.images[0]?.url,
            slug: product.slug,
            category: product.category?.name || 'Uncategorized'
        })
    }

    // Dynamic category product counts
    const getCategoryProductCount = useMemo(() => {
        return (categoryName: string) => products.filter(p => p.category?.name === categoryName).length
    }, [products])

    const getSubcategoryProductCount = useMemo(() => {
        return (subcategoryName: string) => products.filter(p => p.subcategory?.name === subcategoryName).length
    }, [products])

    const renderFilters = () => {
        const hasActiveFilters = searchQuery || selectedCategory !== 'All' || selectedSubcategory || appliedPriceMin > 0 || appliedPriceMax < maxProductPrice

        return (
            <div className="space-y-8">
                {/* Search Box */}
                <div className="bg-card dark:border dark:border-border rounded-2xl shadow-sm p-5 space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Search</h3>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-muted/40 rounded-full border-gray-200 focus:bg-background focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all font-sans text-sm"
                        />
                    </div>
                </div>

                {/* Price Range Filter */}
                <div className="bg-card border border-gray-100/80 dark:border-gray-800/60 rounded-[24px] shadow-sm p-6 space-y-5">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price Range</h3>
                    
                    {/* Dual range slider using Radix UI Slider */}
                    <div className="px-1.5">
                        <Slider
                            value={[priceMin, priceMax]}
                            onValueChange={(val) => {
                                if (Array.isArray(val) && val.length === 2) {
                                    setPriceMin(val[0])
                                    setPriceMax(val[1])
                                }
                            }}
                            min={0}
                            max={maxProductPrice}
                            step={1}
                            className="my-5"
                        />
                    </div>

                    {/* Min / Max inputs */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <input
                                type="number"
                                min={0}
                                max={priceMax - 1}
                                value={priceMin}
                                onChange={e => setPriceMin(Math.max(0, Math.min(Number(e.target.value), priceMax - 1)))}
                                className="w-full border border-gray-100 dark:border-gray-800 rounded-xl px-2 py-2 text-sm text-center font-medium bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all text-slate-700 dark:text-slate-300"
                            />
                        </div>
                        <span className="text-slate-300 dark:text-slate-700 text-sm">—</span>
                        <div className="flex-1">
                            <input
                                type="number"
                                min={priceMin + 1}
                                max={maxProductPrice}
                                value={priceMax}
                                onChange={e => setPriceMax(Math.min(maxProductPrice, Math.max(Number(e.target.value), priceMin + 1)))}
                                className="w-full border border-gray-100 dark:border-gray-800 rounded-xl px-2 py-2 text-sm text-center font-medium bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => { setAppliedPriceMin(priceMin); setAppliedPriceMax(priceMax) }}
                        className="w-full bg-gradient-to-r from-indigo-400 via-violet-500 to-fuchsia-500 hover:opacity-95 active:scale-[0.98] text-white text-xs font-semibold py-3.5 rounded-xl transition-all shadow-sm shadow-violet-100 dark:shadow-none"
                    >
                        Apply price range
                    </button>
                </div>

                {/* Separate Clear All Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('All')
                            setSelectedSubcategory(null)
                            setPriceMin(0)
                            setPriceMax(maxProductPrice)
                            setAppliedPriceMin(0)
                            setAppliedPriceMax(maxProductPrice)
                        }}
                        className="w-full bg-card border border-gray-100/90 dark:border-gray-800 rounded-[20px] py-3.5 shadow-sm hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99]"
                    >
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors text-sm font-semibold">✕</span>
                        <span className="text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 font-semibold text-sm tracking-wide">Clear all filters</span>
                    </button>
                )}

                {/* Categories List */}
                <div className="bg-card dark:border dark:border-border rounded-2xl shadow-sm p-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Categories</h3>
                    <div className="space-y-4">
                        {/* "All" Category Option */}
                        <button
                            onClick={() => {
                                setSelectedCategory('All')
                                setSelectedSubcategory(null)
                            }}
                            className={`flex items-center justify-between w-full text-left font-sans text-sm font-medium transition-all group/all`}
                        >
                            <span className="flex items-center gap-3">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                    selectedCategory === 'All'
                                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/30'
                                        : 'border-gray-300 dark:border-gray-700 group-hover/all:border-violet-400'
                                }`}>
                                    {selectedCategory === 'All' && <span className="w-2 h-2 rounded-full bg-violet-600 animate-in zoom-in-50 duration-150" />}
                                </span>
                                <span className={`text-sm ${selectedCategory === 'All' ? 'text-violet-600 font-semibold' : 'text-foreground/85 group-hover/all:text-violet-600'}`}>All Products</span>
                            </span>
                            <span className="text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-full font-bold font-sans">
                                {products.length}
                            </span>
                        </button>

                        <div className="h-px bg-gray-100 dark:bg-gray-850 my-3" />

                        {/* Categories Tree */}
                        <div className="space-y-3">
                            {categories.map((cat) => {
                                const count = getCategoryProductCount(cat.name)
                                const isSelected = selectedCategory === cat.name
                                const hasSubs = cat.subcategories && cat.subcategories.length > 0

                                return (
                                    <div key={cat.id} className="space-y-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(cat.name)
                                                setSelectedSubcategory(null)
                                            }}
                                            className={`flex items-center justify-between w-full text-left font-sans text-sm font-medium transition-all group/cat`}
                                        >
                                            <span className="flex items-center gap-3 truncate">
                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                    isSelected
                                                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/30'
                                                        : 'border-gray-300 dark:border-gray-700 group-hover/cat:border-violet-400'
                                                }`}>
                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-violet-600 animate-in zoom-in-50 duration-150" />}
                                                </span>
                                                <span className={`truncate text-sm ${isSelected ? 'text-violet-600 font-semibold' : 'text-foreground/85 group-hover/cat:text-violet-600'}`}>{cat.name}</span>
                                            </span>
                                            <span className="text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 rounded-full font-bold shrink-0 font-sans">
                                                {count}
                                            </span>
                                        </button>

                                        {/* Subcategories */}
                                        {isSelected && hasSubs && (
                                            <div className="pl-4 space-y-3 mt-3 animate-in slide-in-from-top-1 duration-200">
                                                {cat.subcategories.map((sub) => {
                                                    const subCount = getSubcategoryProductCount(sub.name)
                                                    const isSubSelected = selectedSubcategory === sub.name
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => setSelectedSubcategory(sub.name)}
                                                            className={`flex items-center justify-between w-full text-left font-sans text-sm font-medium transition-all group/sub`}
                                                        >
                                                            <span className="truncate flex items-center gap-3">
                                                                <span className="text-gray-300 dark:text-gray-700 font-normal shrink-0">—</span>
                                                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                                    isSubSelected
                                                                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/30'
                                                                        : 'border-gray-300 dark:border-gray-700 group-hover/sub:border-violet-400'
                                                                }`}>
                                                                    {isSubSelected && <span className="w-2 h-2 rounded-full bg-violet-600 animate-in zoom-in-50 duration-150" />}
                                                                </span>
                                                                <span className={`truncate text-xs ${isSubSelected ? 'text-violet-600 font-semibold' : 'text-muted-foreground group-hover/sub:text-violet-600'}`}>{sub.name}</span>
                                                            </span>
                                                            <span className="text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold font-sans shrink-0">
                                                                {subCount}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Elegant Purple Header Banner — floating card with rounded corners matching reference */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 text-white shadow-lg">
                    {/* Decorative mandala — left side */}
                    <div className="absolute left-0 top-0 h-full w-72 pointer-events-none select-none opacity-20">
                        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Center dot */}
                            <circle cx="50" cy="100" r="4" fill="white"/>
                            {/* Concentric rings */}
                            {LM.rings.map((r, i) => (
                                <circle key={i} cx="50" cy="100" r={r} stroke="white" strokeWidth={i < 2 ? 1 : 0.6}/>
                            ))}
                            {/* Spokes */}
                            {LM.spokes.map((s, i) => (
                                <line key={i} x1="50" y1="100" x2={s.x2} y2={s.y2} stroke="white" strokeWidth="0.4"/>
                            ))}
                            {/* Inward petal arcs at each ring */}
                            {LM.petalPaths.map((d, i) => (
                                <path key={i} d={d} stroke="white" strokeWidth="0.5" fill="none"/>
                            ))}
                            {/* Cross-ring teardrop arcs */}
                            {LM.teardrops.map((d, i) => (
                                <path key={i} d={d} stroke="white" strokeWidth="0.4" fill="none" opacity="0.7"/>
                            ))}
                            {/* Dot accents at each spoke×ring intersection */}
                            {LM.dots.map((d, i) => (
                                <circle key={i} cx={d.cx} cy={d.cy} r="1.5" fill="white"/>
                            ))}
                        </svg>
                    </div>
                    {/* Decorative mandala — right side */}
                    <div className="absolute right-0 top-0 h-full w-72 pointer-events-none select-none opacity-20">
                        <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Center dot */}
                            <circle cx="150" cy="100" r="4" fill="white"/>
                            {/* Concentric rings */}
                            {RM.rings.map((r, i) => (
                                <circle key={i} cx="150" cy="100" r={r} stroke="white" strokeWidth={i < 2 ? 1 : 0.6}/>
                            ))}
                            {/* Spokes */}
                            {RM.spokes.map((s, i) => (
                                <line key={i} x1="150" y1="100" x2={s.x2} y2={s.y2} stroke="white" strokeWidth="0.4"/>
                            ))}
                            {/* Inward petal arcs at each ring */}
                            {RM.petalPaths.map((d, i) => (
                                <path key={i} d={d} stroke="white" strokeWidth="0.5" fill="none"/>
                            ))}
                            {/* Cross-ring teardrop arcs */}
                            {RM.teardrops.map((d, i) => (
                                <path key={i} d={d} stroke="white" strokeWidth="0.4" fill="none" opacity="0.7"/>
                            ))}
                            {/* Dot accents at each spoke×ring intersection */}
                            {RM.dots.map((d, i) => (
                                <circle key={i} cx={d.cx} cy={d.cy} r="1.5" fill="white"/>
                            ))}
                        </svg>
                    </div>

                    <div className="relative z-10 px-8 pt-5 pb-10">
                        {/* Breadcrumbs — left-aligned inside banner */}
                        <nav className="text-xs text-violet-200 font-medium flex items-center gap-2 mb-6 select-none">
                            <Link href="/" className="hover:text-white transition-colors opacity-80 hover:opacity-100 min-h-0 min-w-0 h-auto inline-flex items-center">Home</Link>
                            <span className="opacity-50 flex items-center">›</span>
                            <button
                                onClick={() => { setSelectedCategory('All'); setSelectedSubcategory(null); }}
                                className={`p-0 bg-transparent border-none outline-none min-h-0 min-w-0 h-auto inline-flex items-center transition-colors ${selectedCategory === 'All' ? 'text-white font-semibold' : 'opacity-80 hover:opacity-100 hover:text-white'}`}
                            >
                                Shop
                            </button>
                            {selectedCategory !== 'All' && (
                                <>
                                    <span className="opacity-50 flex items-center">›</span>
                                    <button
                                        onClick={() => setSelectedSubcategory(null)}
                                        className={`p-0 bg-transparent border-none outline-none min-h-0 min-w-0 h-auto inline-flex items-center transition-colors ${!selectedSubcategory ? 'text-white font-bold' : 'opacity-80 hover:opacity-100 hover:text-white'}`}
                                    >
                                        {selectedCategory}
                                    </button>
                                </>
                            )}
                            {selectedSubcategory && (
                                <>
                                    <span className="opacity-50 flex items-center">›</span>
                                    <span className="text-white font-bold">{selectedSubcategory}</span>
                                </>
                            )}
                        </nav>

                        {/* Title + subtitle — centered */}
                        <div className="text-center">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                                {selectedSubcategory || (selectedCategory !== 'All' ? selectedCategory : 'Shop')}
                            </h1>
                            <p className="text-violet-100/75 font-sans text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                                {selectedCategory !== 'All'
                                    ? `Discover our complete collection of beautiful ${(selectedSubcategory || selectedCategory).toLowerCase()}`
                                    : 'Sri Lankan fashion accessories — handpicked for you'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* 2-Column Responsive Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Sidebar Column (lg:col-span-3) */}
                    <aside className="hidden lg:block lg:col-span-3 space-y-8 lg:sticky lg:top-24 h-fit">
                        {renderFilters()}
                    </aside>

                    {/* Right Main Content Column (lg:col-span-9) */}
                    <main className="lg:col-span-9 space-y-6">
    

                        {/* Results Header Row */}
                        <div className="bg-card dark:border dark:border-border rounded-xl shadow-sm px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground font-medium text-center sm:text-left">
                                Showing <span className="font-semibold text-foreground">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span className="font-semibold text-foreground">{filteredProducts.length}</span> results
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                                {/* Mobile Filter Drawer */}
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="lg:hidden flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold px-4 h-10 shadow-sm active:scale-95 transition-all select-none"
                                        >
                                            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                            Filters
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6 overflow-y-auto bg-card border-r dark:border-gray-800">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-left text-lg font-bold">Filters</SheetTitle>
                                        </SheetHeader>
                                        {renderFilters()}
                                    </SheetContent>
                                </Sheet>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-full sm:w-[160px] border-none bg-muted/50 rounded-full px-4 text-foreground font-sans text-xs sm:text-sm">
                                        <SelectValue placeholder="Sort" />
                                    </SelectTrigger>
                                    <SelectContent className="font-sans text-sm">
                                        <SelectItem value="name">Sort by: Relevance</SelectItem>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 h-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 h-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Products List Grid */}
                        <div className={`grid gap-3 sm:gap-5 items-stretch ${
                            viewMode === 'grid'
                                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                : 'grid-cols-1'
                        }`}>
                            {filteredProducts
                                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                .map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onAddToWishlist={handleAddToWishlist}
                                    showAddToCart={!!user}
                                    showWishlist={!!user}
                                    layout={viewMode}
                                />
                            ))}
                        </div>

                        {/* No Results */}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16 bg-card rounded-2xl shadow-sm border border-transparent dark:border-border">
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                                <p className="text-muted-foreground mb-6">
                                    Try adjusting your search or filter criteria
                                </p>
                                <Button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSelectedCategory('All')
                                        setSelectedSubcategory(null)
                                        setPriceMin(0); setPriceMax(maxProductPrice)
                                        setAppliedPriceMin(0); setAppliedPriceMax(maxProductPrice)
                                    }}
                                    variant="outline"
                                    className="dark:border-border dark:text-foreground"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredProducts.length > ITEMS_PER_PAGE && (() => {
                            const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
                            const getPages = () => {
                                const pages: (number | '...')[] = []
                                if (totalPages <= 7) {
                                    return Array.from({ length: totalPages }, (_, i) => i + 1)
                                }
                                pages.push(1)
                                if (currentPage > 3) pages.push('...')
                                for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
                                    pages.push(p)
                                }
                                if (currentPage < totalPages - 2) pages.push('...')
                                pages.push(totalPages)
                                return pages
                            }
                            return (
                                <div className="flex items-center justify-center gap-1.5 pt-4 flex-wrap">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border border-border hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >‹</button>
                                    {getPages().map((page, idx) =>
                                        page === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm">…</span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page as number)}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                                    currentPage === page
                                                        ? 'bg-violet-600 text-white shadow-sm'
                                                        : 'border border-border hover:bg-violet-50 hover:border-violet-300 text-foreground'
                                                }`}
                                            >{page}</button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border border-border hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >›</button>
                                </div>
                            )
                        })()}
                    </main>
                </div>
            </div>
        </div>
    )
}
