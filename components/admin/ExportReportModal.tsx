'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
    X,
    FileSpreadsheet,
    FileText,
    Download,
    Calendar,
    Check,
    Clock,
    Loader2,
    Eye,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    Users,
    DollarSign,
    BarChart2,
    ArrowLeft,
    Package,
} from 'lucide-react'

interface ExportReportModalProps {
    isOpen: boolean
    onClose: () => void
}

interface ReportPreview {
    metrics: {
        grossRevenue: number
        totalOrders: number
        uniqueVisitors: number
        avgOrderValue: number
        growth: {
            revenue: number
            orders: number
            customers: number
            avgOrderValue: number
        }
    }
    topProducts: { name: string; sales: number; revenue: string; stock: number }[]
    ordersByStatus: { name: string; value: number }[]
    salesByCategory: { name: string; value: number }[]
}

export function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
    const { accessToken } = useAuth()
    const now = new Date()

    const [step, setStep] = useState<'configure' | 'preview'>('configure')
    const [range, setRange] = useState<'today' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly')
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
    const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(now.getMonth() / 3) + 1)

    const past7Days = new Date(now)
    past7Days.setDate(past7Days.getDate() - 7)
    const [startDate, setStartDate] = useState<string>(past7Days.toISOString().split('T')[0])
    const [endDate, setEndDate] = useState<string>(now.toISOString().split('T')[0])

    const [isLoading, setIsLoading] = useState(false)
    const [isDownloading, setIsDownloading] = useState<'xlsx' | 'csv' | null>(null)
    const [preview, setPreview] = useState<ReportPreview | null>(null)

    if (!isOpen) return null

    const monthOptions = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ]
    const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

    const buildParams = (fmt?: string) => {
        const params = new URLSearchParams()
        params.set('range', range)
        if (fmt) params.set('format', fmt)
        if (range === 'monthly') {
            params.set('year', selectedYear.toString())
            params.set('month', selectedMonth.toString())
        } else if (range === 'quarterly') {
            params.set('year', selectedYear.toString())
            params.set('quarter', selectedQuarter.toString())
        } else if (range === 'yearly') {
            params.set('year', selectedYear.toString())
        } else if (range === 'custom') {
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)
        }
        return params
    }

    const handlePreview = async () => {
        setIsLoading(true)
        try {
            const token = await accessToken()
            const params = buildParams()
            // Use sales-report endpoint for preview data
            const res = await fetch(`/api/admin/sales-report?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Preview failed' }))
                throw new Error(err.error || 'Failed to load report preview')
            }
            const data = await res.json()
            setPreview(data)
            setStep('preview')
        } catch (err: any) {
            toast.error(err.message || 'Error loading report preview')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async (fmt: 'xlsx' | 'csv') => {
        setIsDownloading(fmt)
        try {
            const token = await accessToken()
            const params = buildParams(fmt)
            const url = `/api/admin/export/orders?${params.toString()}`
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Export failed' }))
                throw new Error(err.error || 'Failed to download report')
            }
            const blob = await res.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            const disposition = res.headers.get('Content-Disposition')
            let filename = `webmall-report-${range}.${fmt}`
            if (disposition?.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '')
            }
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(downloadUrl)
            toast.success(`Report downloaded as ${fmt.toUpperCase()}!`)
        } catch (err: any) {
            toast.error(err.message || 'Error generating report')
        } finally {
            setIsDownloading(null)
        }
    }

    const handleClose = () => {
        setStep('configure')
        setPreview(null)
        onClose()
    }

    const rangeLabel = {
        today: 'Today',
        weekly: 'Last 7 Days',
        monthly: `${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
        quarterly: `Q${selectedQuarter} ${selectedYear}`,
        yearly: `Full Year ${selectedYear}`,
        custom: `${startDate} → ${endDate}`,
    }[range]

    const GrowthBadge = ({ value }: { value: number }) => (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${value >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
            {value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(value)}%
        </span>
    )

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden my-8 w-full ${step === 'preview' ? 'max-w-2xl' : 'max-w-xl'}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
                        <div className="flex items-center space-x-3">
                            {step === 'preview' && (
                                <button
                                    onClick={() => setStep('configure')}
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors mr-1"
                                    title="Back to configure"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <div className="p-2.5 bg-foreground text-background rounded-xl shadow-sm">
                                {step === 'configure' ? <FileSpreadsheet className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    {step === 'configure' ? 'Business Performance Report' : 'Business Report Overview'}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {step === 'configure' ? 'Select period to analyze revenue & business metrics' : rangeLabel}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── STEP 1: Configure ── */}
                    {step === 'configure' && (
                        <>
                            <div className="p-6 space-y-6">
                                {/* Time Range */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        <Calendar className="w-3.5 h-3.5" /> Select Report Timeframe
                                    </label>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'today', label: 'Day-Wise (Today)' },
                                            { id: 'weekly', label: 'Weekly (7 Days)' },
                                            { id: 'monthly', label: 'Monthly' },
                                            { id: 'quarterly', label: 'Quarterly' },
                                            { id: 'yearly', label: 'Yearly' },
                                            { id: 'custom', label: 'Custom Range' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setRange(tab.id as any)}
                                                className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 ${range === tab.id
                                                    ? 'bg-foreground text-background border-foreground shadow-md'
                                                    : 'bg-card text-foreground/80 border-border hover:border-gray-400 hover:bg-muted/40'
                                                }`}
                                            >
                                                {range === tab.id && <Check className="w-3 h-3" />}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Sub-options */}
                                <div className="p-4 bg-muted/40 rounded-xl border border-border/80">
                                    {range === 'today' && (
                                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-emerald-500" />
                                            Exports order metrics and detailed transactions from midnight today up to now.
                                        </p>
                                    )}
                                    {range === 'weekly' && (
                                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            Exports orders placed within the last 7 trailing days.
                                        </p>
                                    )}
                                    {range === 'monthly' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">Month</label>
                                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground">
                                                    {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">Year</label>
                                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground">
                                                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {range === 'quarterly' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">Quarter</label>
                                                <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground">
                                                    <option value={1}>Q1 (Jan – Mar)</option>
                                                    <option value={2}>Q2 (Apr – Jun)</option>
                                                    <option value={3}>Q3 (Jul – Sep)</option>
                                                    <option value={4}>Q4 (Oct – Dec)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">Year</label>
                                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground">
                                                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {range === 'yearly' && (
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-1">Select Year</label>
                                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground">
                                                {yearOptions.map((y) => <option key={y} value={y}>Full Year {y}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {range === 'custom' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">Start Date</label>
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground mb-1">End Date</label>
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-border bg-muted/30">
                                <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePreview}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading Preview...</span></>
                                    ) : (
                                        <><Eye className="w-4 h-4" /><span>Preview Business Report</span></>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: Preview ── */}
                    {step === 'preview' && preview && (
                        <>
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                {/* KPI Cards */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <BarChart2 className="w-3.5 h-3.5" /> Key Metrics
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
                                                label: 'Gross Revenue',
                                                value: `LKR ${Math.round(preview.metrics.grossRevenue).toLocaleString()}`,
                                                growth: preview.metrics.growth.revenue,
                                                bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                                            },
                                            {
                                                icon: <ShoppingBag className="w-4 h-4 text-blue-500" />,
                                                label: 'Total Orders',
                                                value: preview.metrics.totalOrders.toLocaleString(),
                                                growth: preview.metrics.growth.orders,
                                                bg: 'bg-blue-50 dark:bg-blue-950/20',
                                            },
                                            {
                                                icon: <Users className="w-4 h-4 text-purple-500" />,
                                                label: 'Unique Customers',
                                                value: preview.metrics.uniqueVisitors.toLocaleString(),
                                                growth: preview.metrics.growth.customers,
                                                bg: 'bg-purple-50 dark:bg-purple-950/20',
                                            },
                                            {
                                                icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
                                                label: 'Avg. Order Value',
                                                value: `LKR ${Math.round(preview.metrics.avgOrderValue).toLocaleString()}`,
                                                growth: preview.metrics.growth.avgOrderValue,
                                                bg: 'bg-orange-50 dark:bg-orange-950/20',
                                            },
                                        ].map((m, i) => (
                                            <div key={i} className={`${m.bg} rounded-xl p-4 border border-border/60`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {m.icon}
                                                        <span className="text-xs font-semibold text-muted-foreground">{m.label}</span>
                                                    </div>
                                                    <GrowthBadge value={m.growth} />
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{m.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Status Breakdown */}
                                {preview.ordersByStatus.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-3.5 h-3.5" /> Order Status Breakdown
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {preview.ordersByStatus.map((s, i) => {
                                                const colors: Record<string, string> = {
                                                    Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                                    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                                    Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                                    Shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                                                }
                                                const cls = colors[s.name] || 'bg-muted text-muted-foreground'
                                                return (
                                                    <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cls}`}>
                                                        {s.name} <span className="bg-black/10 dark:bg-white/10 rounded-full px-1.5 py-0.5">{s.value}</span>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Top Products */}
                                {preview.topProducts.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <Package className="w-3.5 h-3.5" /> Top Products
                                        </p>
                                        <div className="rounded-xl border border-border overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">#</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">Product</th>
                                                        <th className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground">Units</th>
                                                        <th className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground">Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {preview.topProducts.map((p, i) => (
                                                        <tr key={i} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">{i + 1}</td>
                                                            <td className="px-4 py-2.5 text-sm font-semibold text-foreground truncate max-w-[180px]">{p.name}</td>
                                                            <td className="px-4 py-2.5 text-right text-sm font-bold text-foreground">{p.sales}</td>
                                                            <td className="px-4 py-2.5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.revenue}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Category Breakdown */}
                                {preview.salesByCategory.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <BarChart2 className="w-3.5 h-3.5" /> Revenue by Category
                                        </p>
                                        <div className="space-y-2">
                                            {preview.salesByCategory.slice(0, 5).map((c, i) => {
                                                const max = preview.salesByCategory[0].value
                                                const pct = max > 0 ? Math.round((c.value / max) * 100) : 0
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="text-xs font-semibold text-muted-foreground w-28 truncate">{c.name}</span>
                                                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-foreground rounded-full"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${pct}%` }}
                                                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground w-24 text-right">LKR {Math.round(c.value).toLocaleString()}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {preview.metrics.totalOrders === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-semibold">No orders found for this period.</p>
                                        <p className="text-xs mt-1">Try selecting a different timeframe.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer with Download Buttons */}
                            <div className="px-6 py-4 border-t border-border bg-muted/30">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Download Report
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload('xlsx')}
                                        disabled={isDownloading !== null}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all disabled:opacity-50"
                                    >
                                        {isDownloading === 'xlsx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                                        Excel (.xlsx)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload('csv')}
                                        disabled={isDownloading !== null}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-400 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50"
                                    >
                                        {isDownloading === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                        CSV (.csv)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
