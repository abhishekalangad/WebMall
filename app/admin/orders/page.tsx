'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Package2, Eye, Loader2, X, Download, FileSpreadsheet, FileText, KanbanSquare, List } from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    images: { url: string }[]
  }
  variant?: {
    name: string
    image?: string
  }
  variantName?: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  user?: {
    id: string
    name?: string
    email: string
    phone?: string
  }
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  paymentMethod: string
  shippingAddress: any
  notes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  couponUsage?: {
    discountAmount: number
    coupon: {
      code: string
      discountType: string
      discountValue: number
    }
  }
}

// ─── Shared watermark helper ─────────────────────────────────────────────────

async function getWatermarkImageId(wb: any): Promise<number | null> {
  try {
    const res = await fetch('/logo-no-bg.png')
    if (!res.ok) return null
    // Draw logo at 15% opacity by converting to a faded canvas image
    const origBuffer = await res.arrayBuffer()
    const blob = new Blob([origBuffer], { type: 'image/png' })
    const url = URL.createObjectURL(blob)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    URL.revokeObjectURL(url)
    const canvas = document.createElement('canvas')
    // Shrink to ~200px to keep it small
    const SIZE = 200
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.globalAlpha = 0.12 // 12% opacity = very transparent
    ctx.drawImage(img, 0, 0, SIZE, SIZE)
    const dataUrl = canvas.toDataURL('image/png')
    const b64 = dataUrl.split(',')[1]
    const bstr = atob(b64)
    const u8 = new Uint8Array(bstr.length)
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
    return wb.addImage({ buffer: u8.buffer, extension: 'png' })
  } catch (e) {
    console.warn('Watermark failed', e)
    return null
  }
}

// ─── Excel helpers ────────────────────────────────────────────────────────────

async function exportSingleOrderToExcel(order: Order, shippingBaseRate: number) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WebMall Admin'
  wb.created = new Date()

  const ws = wb.addWorksheet('Order Details')

  const wmId = await getWatermarkImageId(wb)
  if (wmId !== null) ws.addBackgroundImage(wmId)

  // ---- Header section ---- (light pink: #FCE7F3 = pink-100)
  const addSection = (title: string) => {
    const row = ws.addRow([title])
    row.font = { bold: true, size: 11, color: { argb: 'FF9D174D' } } // dark pink text
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE7F3' } } // pink-100
    ws.mergeCells(`A${row.number}:F${row.number}`)
    return row
  }

  const addKV = (key: string, value: string | number) => {
    const row = ws.addRow([key, String(value)])
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
  }

  // Order info
  addSection('ORDER INFORMATION')
  addKV('Order Number', order.orderNumber)
  addKV('Status', order.status.toUpperCase())
  addKV('Payment Method', order.paymentMethod.toUpperCase())
  addKV('Date', new Date(order.createdAt).toLocaleString())
  addKV('Currency', order.currency)
  ws.addRow([])

  // Customer info
  addSection('CUSTOMER INFORMATION')
  addKV('Name', order.user?.name || 'N/A')
  addKV('Email', order.user?.email || 'N/A')
  addKV('Phone', order.user?.phone || 'N/A')
  ws.addRow([])

  // Shipping address
  if (order.shippingAddress) {
    addSection('SHIPPING ADDRESS')
    const sa = order.shippingAddress
    addKV('Full Name', `${sa.firstName || ''} ${sa.lastName || ''}`.trim())
    addKV('Address', sa.address || '')
    addKV('City', sa.city || '')
    addKV('District', sa.district || '')
    addKV('Postal Code', sa.postalCode || '')
    addKV('Phone', sa.phone || '')
    addKV('Email', sa.email || '')
    ws.addRow([])
  }

  // Notes
  if (order.notes) {
    addSection('NOTES')
    ws.addRow([order.notes])
    ws.addRow([])
  }

  // Items table
  addSection('ORDER ITEMS')
  const headerRow = ws.addRow(['S.No', 'Product', 'Variant', 'Quantity', 'Unit Price (LKR)', 'Total (LKR)'])
  headerRow.font = { bold: true, color: { argb: 'FF9D174D' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F8' } } // very light pink
  headerRow.alignment = { horizontal: 'center' }

  const subtotal = order.items.reduce((acc, i) => acc + Number(i.total), 0)

  order.items.forEach((item, index) => {
    const row = ws.addRow([
      index + 1,
      item.product.name,
      item.variantName || item.variant?.name || '—',
      item.quantity,
      Number(item.price),
      Number(item.total),
    ])
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(4).alignment = { horizontal: 'center' }
    row.getCell(5).numFmt = '#,##0.00'
    row.getCell(6).numFmt = '#,##0.00'
  })

  ws.addRow([])

  // Totals
  const discount = Number(order.couponUsage?.discountAmount || 0)
  const shipping = Math.max(0, Number(order.totalAmount) - (subtotal - discount))
  const totalQty = order.items.reduce((acc, i) => acc + i.quantity, 0)

  const addTotal = (label: string, value: number, bold = false) => {
    const row = ws.addRow(['', '', '', '', label, value])
    row.getCell(5).font = { bold }
    row.getCell(6).font = { bold: bold, color: bold ? { argb: 'FFFF0000' } : undefined } // Highlight total value differently? Actually user said "just highlight it its value also". Let's use blue/red or just bold
    if (bold) {
        row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } // Highlight yellow background
    }
    row.getCell(6).numFmt = '#,##0.00'
  }

  addTotal('Subtotal (LKR)', subtotal)
  if (discount > 0) {
    addTotal(`Discount (${order.couponUsage?.coupon.code || 'COUPON'}) (LKR)`, -discount)
  }
  addTotal(shipping === 0 ? 'Shipping (FREE)' : 'Shipping (LKR)', shipping)

  // Append a dedicated Total Qty row right under the items, but exactly alongside the final total row
  const finalRow = ws.addRow(['', '', 'Total Qty:', totalQty, 'TOTAL (LKR)', Number(order.totalAmount)])
  
  // Format the Qty block
  finalRow.getCell(3).font = { bold: true }
  finalRow.getCell(3).alignment = { horizontal: 'right' }
  finalRow.getCell(4).font = { bold: true, color: { argb: 'FFDB2777' } } // pink-600
  finalRow.getCell(4).alignment = { horizontal: 'center' }
  finalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE7F3' } } // pink-100
  
  // Format the Money block
  finalRow.getCell(5).font = { bold: true }
  finalRow.getCell(6).font = { bold: true, color: { argb: 'FFB91C1C' } } // Red text
  finalRow.getCell(6).numFmt = '#,##0.00'
  finalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } } // Light red BG

  // Column widths
  ws.columns = [
    { width: 8 },  // S.No
    { width: 35 }, // Product
    { width: 20 }, // Variant
    { width: 12 }, // Qty
    { width: 22 }, // Unit price
    { width: 22 }, // Total
  ]

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, `Order_${order.orderNumber}.xlsx`)
}

async function exportSingleOrderToPDF(order: Order, shippingBaseRate: number) {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Watermark ──────────────────────────────────────────────────────────
  let watermarkDataUrl: string | null = null
  try {
    const res = await fetch('/logo-no-bg.png')
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url
      })
      URL.revokeObjectURL(url)
      const c = document.createElement('canvas'); c.width = 400; c.height = 400
      const ctx = c.getContext('2d')!
      ctx.globalAlpha = 0.10
      ctx.drawImage(img, 0, 0, 400, 400)
      watermarkDataUrl = c.toDataURL('image/png')
    }
  } catch (e) { /* skip */ }

  const PINK       = [219, 39, 119]  as [number, number, number]
  const DARK_PINK  = [157, 23, 77]   as [number, number, number]
  const LIGHT_PINK = [252, 231, 243] as [number, number, number]
  const W = 210
  const H = 297

  const drawWatermark = () => {
    if (!watermarkDataUrl) return
    const size = 130
    doc.addImage(watermarkDataUrl, 'PNG', (W - size) / 2, (H - size) / 2, size, size)
  }

  // ── Page 1 watermark ──────────────────────────────────────────────────
  drawWatermark()

  // ── Company header block ───────────────────────────────────────────────
  // Full-width pink top bar
  doc.setFillColor(...PINK)
  doc.rect(0, 0, W, 26, 'F')

  // Company name — large centred
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('WEB MALL Pvt Ltd', W / 2, 11, { align: 'center' })

  // Sub-line: document title left, metadata right
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('Order Report', 14, 20)
  doc.text(`Order: ${order.orderNumber}  |  ${new Date(order.createdAt).toLocaleDateString()}`, W - 14, 20, { align: 'right' })

  let y = 32

  // ── ORDER INFORMATION ─────────────────────────────────────────────────
  const sectionBar = (title: string, full = true, x2?: number) => {
    const rx = full ? 14 : (x2 ?? 14)
    const rw = full ? W - 28 : W / 2 - 18
    doc.setFillColor(...LIGHT_PINK)
    doc.rect(rx, y, rw, 7, 'F')
    doc.setTextColor(...DARK_PINK); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold')
    doc.text(title, rx + 2, y + 5)
  }

  sectionBar('ORDER INFORMATION')
  y += 10
  doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)

  const kvFull = (k: string, v: string) => {
    doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 16, y)
    doc.setFont('helvetica', 'normal'); doc.text(v, 58, y)
    y += 5.5
  }
  kvFull('Order Number', order.orderNumber)
  kvFull('Status', order.status.toUpperCase())
  kvFull('Payment', order.paymentMethod.toUpperCase())
  kvFull('Date', new Date(order.createdAt).toLocaleString())
  y += 4

  // ── CUSTOMER INFO + SHIPPING ADDRESS (side by side) ───────────────────
  const colLeft  = 14
  const colRight = W / 2 + 3
  const colW     = W / 2 - 17

  // Two section bars at same y
  doc.setFillColor(...LIGHT_PINK)
  doc.rect(colLeft,  y, colW, 7, 'F')
  doc.rect(colRight, y, colW, 7, 'F')
  doc.setTextColor(...DARK_PINK); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold')
  doc.text('CUSTOMER INFORMATION', colLeft + 2, y + 5)
  doc.text('SHIPPING ADDRESS', colRight + 2, y + 5)
  y += 10

  doc.setTextColor(30, 30, 30); doc.setFontSize(8)

  // kv helpers that WRAP long values instead of truncating
  const maxValW = colW - 22  // available width for value text in mm

  const kvL = (k: string, v: string, rowOffset: number) => {
    const baseY = y + rowOffset * 5.5
    doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, colLeft + 2, baseY)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(v, maxValW)
    doc.text(lines, colLeft + 20, baseY)
  }
  const kvR = (k: string, v: string, rowOffset: number) => {
    const baseY = y + rowOffset * 5.5
    doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, colRight + 2, baseY)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(v, maxValW)
    doc.text(lines, colRight + 20, baseY)
  }

  kvL('Name',  order.user?.name  || 'N/A', 0)
  kvL('Email', order.user?.email || 'N/A', 1)
  kvL('Phone', order.user?.phone || 'N/A', 2)

  const sa = order.shippingAddress || {}
  const saName = `${sa.firstName || ''} ${sa.lastName || ''}`.trim() || 'N/A'
  kvR('Name',    saName, 0)
  kvR('Address', sa.address || 'N/A', 1)
  kvR('City',    `${sa.city || ''}, ${sa.district || ''} ${sa.postalCode || ''}`.trim() || 'N/A', 2)
  kvR('Phone',   sa.phone || 'N/A', 3)

  // Give enough vertical space — address may wrap to 2 lines, so add extra padding
  y += 4 * 5.5 + 10

  const subtotal = order.items.reduce((a, i) => a + Number(i.total), 0)
  const discount = Number(order.couponUsage?.discountAmount || 0)
  const shipping = Math.max(0, Number(order.totalAmount) - (subtotal - discount))

  // ── Table ──────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['Sl No.', 'Product', 'Variant', 'Qty', 'Unit Price (LKR)', 'Total (LKR)']],
    body: order.items.map((item, idx) => [
      idx + 1,
      item.product.name,
      item.variantName || item.variant?.name || '—',
      item.quantity,
      Number(item.price).toLocaleString('en-LK'),
      Number(item.total).toLocaleString('en-LK'),
    ]),
    // NO foot here — we draw totals manually below so they only appear once (last page)
    headStyles: {
      fillColor: PINK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [255, 249, 253] },
    // top: 14 reserves space for the compact header on continuation pages (pages 2+)
    margin: { left: 14, right: 14, top: 14 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { cellWidth: 70 },
      2: { cellWidth: 28 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'right',  cellWidth: 30 },
      5: { halign: 'right',  cellWidth: 30 },
      // 14+70+28+10+30+30 = 182 = 210-14-14 ✓
    },
    didDrawPage: (data) => {
      // Watermark on every page
      drawWatermark()

      // Page number at bottom centre — every page
      const totalPages = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(130, 130, 130)
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, W / 2, H - 5, { align: 'center' })
    },
  })

  // ── Totals block — drawn ONCE after table ends (last page only) ─────────
  const finalY = (doc as any).lastAutoTable.finalY + 4
  const totalsX = 14 + 12 + 60 + 28 + 10  // start at column 5 (Unit Price col start)
  const labelX  = totalsX                   // label column
  const valueX  = W - 14                    // right edge

  const totalRows: [string, string][] = [
    ['Subtotal (LKR)', subtotal.toLocaleString('en-LK')],
    ...(discount > 0
      ? [[`Discount (${order.couponUsage?.coupon.code || ''})`, `- ${discount.toLocaleString('en-LK')}`] as [string, string]]
      : []),
    ['Shipping (LKR)', shipping === 0 ? 'FREE' : shipping.toLocaleString('en-LK')],
  ]

  doc.setFontSize(8.5)
  let ty = finalY
  totalRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
    doc.text(label, labelX, ty)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK_PINK)
    doc.text(value, valueX, ty, { align: 'right' })
    ty += 6
  })

  // TOTAL row — bigger, with a top border line
  ty += 1
  doc.setDrawColor(...DARK_PINK)
  doc.setLineWidth(0.4)
  doc.line(labelX, ty - 2, W - 14, ty - 2)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK_PINK)
  doc.text('TOTAL (LKR)', labelX, ty + 4)
  doc.text(Number(order.totalAmount).toLocaleString('en-LK'), valueX, ty + 4, { align: 'right' })

  doc.save(`Order_${order.orderNumber}.pdf`)
}

async function exportAllOrdersToExcel(orders: Order[]) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WebMall Admin'
  wb.created = new Date()

  const ws = wb.addWorksheet('All Orders')

  const wmId = await getWatermarkImageId(wb)
  if (wmId !== null) ws.addBackgroundImage(wmId)

  // Header row — light pink
  const headerRow = ws.addRow([
    'Order Number', 'Date', 'Status', 'Payment',
    'Customer Name', 'Customer Email', 'Customer Phone',
    'Shipping Name', 'Shipping Address', 'Shipping City', 'Shipping District', 'Shipping Phone',
    'Items (Summary)', 'Subtotal (LKR)', 'Discount (LKR)', 'Shipping (LKR)', 'Total (LKR)',
    'Coupon Code', 'Notes'
  ])
  headerRow.font = { bold: true, color: { argb: 'FF9D174D' } } // dark pink text
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE7F3' } } // pink-100
  headerRow.alignment = { horizontal: 'center', wrapText: true }

  orders.forEach(order => {
    const sa = order.shippingAddress || {}
    const subtotal = order.items.reduce((acc, i) => acc + Number(i.total), 0)
    const discount = Number(order.couponUsage?.discountAmount || 0)
    const shipping = Math.max(0, Number(order.totalAmount) - (subtotal - discount))
    const itemsSummary = order.items
      .map(i => `${i.product.name}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`)
      .join('; ')

    const row = ws.addRow([
      order.orderNumber,
      new Date(order.createdAt).toLocaleString(),
      order.status,
      order.paymentMethod,
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.user?.phone || '',
      `${sa.firstName || ''} ${sa.lastName || ''}`.trim(),
      sa.address || '',
      sa.city || '',
      sa.district || '',
      sa.phone || '',
      itemsSummary,
      subtotal,
      discount,
      shipping,
      Number(order.totalAmount),
      order.couponUsage?.coupon.code || '',
      order.notes || '',
    ])

    // Colour by status
    const statusColors: Record<string, string> = {
      pending: 'FFFFF9C4',
      confirmed: 'FFE3F2FD',
      shipped: 'FFF3E5F5',
      delivered: 'FFE8F5E9',
      cancelled: 'FFFFEBEE',
    }
    const bg = statusColors[order.status] || 'FFFFFFFF'
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }

    // Number formats
    ;[14, 15, 16, 17].forEach(c => { row.getCell(c).numFmt = '#,##0.00' })
  })

  // Auto-fit column widths
  ws.columns = [
    { width: 22 }, { width: 20 }, { width: 12 }, { width: 12 },
    { width: 20 }, { width: 28 }, { width: 16 },
    { width: 22 }, { width: 35 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 50 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 14 }, { width: 30 },
  ]

  ws.autoFilter = { from: 'A1', to: 'S1' }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, `WebMall_Orders_${new Date().toISOString().split('T')[0]}.xlsx`)
}

async function exportAllOrdersToPDF(orders: Order[], periodLabel: string) {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Load watermark once
  let watermarkDataUrl: string | null = null
  try {
    const res = await fetch('/logo-no-bg.png')
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url
      })
      URL.revokeObjectURL(url)
      const c = document.createElement('canvas'); c.width = 400; c.height = 400
      const ctx = c.getContext('2d')!; ctx.globalAlpha = 0.10
      ctx.drawImage(img, 0, 0, 400, 400)
      watermarkDataUrl = c.toDataURL('image/png')
    }
  } catch (e) { /* skip */ }

  const PINK       = [219, 39, 119]  as [number, number, number]
  const DARK_PINK  = [157, 23, 77]   as [number, number, number]
  const LIGHT_PINK = [252, 231, 243] as [number, number, number]
  const W = 210
  const H = 297

  const drawWatermark = () => {
    if (!watermarkDataUrl) return
    const size = 130
    doc.addImage(watermarkDataUrl, 'PNG', (W - size) / 2, (H - size) / 2, size, size)
  }

  // Page 1: watermark + company header
  drawWatermark()
  doc.setFillColor(...PINK)
  doc.rect(0, 0, W, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('WEB MALL Pvt Ltd', W / 2, 11, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('All Orders Report', 14, 20)
  doc.text(`Period: ${periodLabel}  ·  ${orders.length} orders`, W - 14, 20, { align: 'right' })

  autoTable(doc, {
    startY: 32,
    head: [['Sl No.', 'Order No.', 'Date', 'Status', 'Payment', 'Customer', 'Email', 'Total (LKR)']],
    body: orders.map((order, idx) => [
      idx + 1,
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString(),
      order.status.toUpperCase(),
      order.paymentMethod.toUpperCase(),
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      Number(order.totalAmount).toLocaleString('en-LK'),
    ]),
    headStyles: {
      fillColor: PINK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [255, 249, 253] },
    margin: { left: 14, right: 14, top: 14 },
    styles: { fontSize: 8, overflow: 'ellipsize', cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },  // Sl No.      10
      1: { cellWidth: 30 },                     // Order No.   30
      2: { halign: 'center', cellWidth: 20 },   // Date        20
      3: { halign: 'center', cellWidth: 18 },   // Status      18
      4: { halign: 'center', cellWidth: 16 },   // Payment     16
      5: { cellWidth: 24 },                     // Customer    24
      6: { cellWidth: 42 },                     // Email       42
      7: { halign: 'right',  cellWidth: 22 },   // Total       22
      // 10+30+20+18+16+24+42+22 = 182 = 210-14-14 ✓
    },
    didDrawPage: (data) => {
      // Watermark on every page
      drawWatermark()

      // Page number at bottom centre — every page
      const totalPages = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal')
      doc.setTextColor(130, 130, 130)
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, W / 2, H - 5, { align: 'center' })
    },
  })

  doc.save(`WebMall_Orders_${new Date().toISOString().split('T')[0]}.pdf`)
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { user, loading, accessToken } = useAuth()
  const { settings } = useSiteConfig()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportingAllPdf, setExportingAllPdf] = useState(false)
  const [exportingSingle, setExportingSingle] = useState(false)
  const [exportingSinglePdf, setExportingSinglePdf] = useState(false)

  // ── Export date range state (mirrors analytics filter style) ──
  const [rangeType, setRangeType]     = useState<'preset' | 'month' | 'custom'>('preset')
  const [preset, setPreset]           = useState('All Time')
  const [exportMonth, setExportMonth] = useState(() => new Date().toLocaleString('default', { month: 'long' }))
  const [exportYear, setExportYear]   = useState(() => String(new Date().getFullYear()))
  const [customFrom, setCustomFrom]   = useState('')
  const [customTo, setCustomTo]       = useState('')

  const monthList = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const yearList  = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  // Reactive range — recomputed whenever any filter state changes
  const exportRange = useMemo(() => {
    const today = new Date()
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (rangeType === 'preset') {
      if (preset === 'Today') {
        const s = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return { from: s, to: today, label: `Today (${fmt(today)})` }
      } else if (preset === 'Last 7 Days') {
        const s = new Date(today); s.setDate(s.getDate() - 6); s.setHours(0,0,0,0)
        return { from: s, to: today, label: `${fmt(s)} – ${fmt(today)}` }
      } else if (preset === 'Last 30 Days') {
        const s = new Date(today); s.setDate(s.getDate() - 29); s.setHours(0,0,0,0)
        return { from: s, to: today, label: `${fmt(s)} – ${fmt(today)}` }
      } else if (preset === 'This Month') {
        const s = new Date(today.getFullYear(), today.getMonth(), 1)
        return { from: s, to: today, label: `${s.toLocaleString('default',{month:'long'})} ${today.getFullYear()}` }
      } else if (preset === 'This Year') {
        const s = new Date(today.getFullYear(), 0, 1)
        return { from: s, to: today, label: `Year ${today.getFullYear()}` }
      }
      return { from: null, to: null, label: `All Time (as of ${fmt(today)})` }
    } else if (rangeType === 'month') {
      const monthIdx = monthList.indexOf(exportMonth)
      const yr = parseInt(exportYear)
      const s = new Date(yr, monthIdx, 1)
      const e = new Date(yr, monthIdx + 1, 0, 23, 59, 59)
      return { from: s, to: e, label: `${exportMonth} ${exportYear}` }
    } else {
      const s = customFrom ? new Date(customFrom) : null
      const e = customTo   ? new Date(customTo + 'T23:59:59') : null
      const label = s || e
        ? `${s ? fmt(s) : 'Start'} – ${e ? fmt(e) : 'Today'}`
        : `All Time (as of ${fmt(today)})`
      return { from: s, to: e, label }
    }
  }, [rangeType, preset, exportMonth, exportYear, customFrom, customTo])

  const LIMIT = 20
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const lastOrderIdRef = useRef<string | null>(null)
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)

  // Real-time Order Engine
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const interval = setInterval(async () => {
      try {
        const token = await accessToken()
        const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
        const res = await fetch(`/api/orders?page=1&limit=1`, { headers })
        const data = await res.json()
        if (res.ok && data.orders?.length > 0) {
          const newestOrderId = data.orders[0].id
          if (lastOrderIdRef.current && lastOrderIdRef.current !== newestOrderId) {
            toast.success("🚨 New Order Arrived!", {
               description: `Order #${data.orders[0].orderNumber} was just placed.`,
               duration: 8000,
            })
            // Play a soft ding sound if possible
            try { new Audio('/ding.mp3').play().catch(() => {}) } catch(e) {}
            // Refetch to update the board automatically!
            fetchOrders()
          }
          lastOrderIdRef.current = newestOrderId
        }
      } catch (error) {
        // silent fail on polling
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [user, accessToken])

  // Convert a DB ISO date string to local YYYY-MM-DD — respects user's local timezone
  const toLocalDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = (
      order.orderNumber.toLowerCase().includes(q) ||
      (order.user?.name || '').toLowerCase().includes(q) ||
      (order.user?.email || '').toLowerCase().includes(q) ||
      (order.user?.phone || '').includes(q) ||
      (order.shippingAddress?.phone || '').includes(q) ||
      (order.status || '').toLowerCase().includes(q)
    )
    if (!matchesSearch) return false

    // Date range filter — uses local date strings to avoid UTC/IST timezone issues
    const orderDate = toLocalDate(order.createdAt)
    const _ml = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const today = new Date()
    const tStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

    if (rangeType === 'preset') {
      if (preset === 'All Time') return true
      if (preset === 'Today') return orderDate === tStr
      if (preset === 'Last 7 Days') {
        const d = new Date(today); d.setDate(d.getDate() - 6)
        const from = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        return orderDate >= from && orderDate <= tStr
      }
      if (preset === 'Last 30 Days') {
        const d = new Date(today); d.setDate(d.getDate() - 29)
        const from = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        return orderDate >= from && orderDate <= tStr
      }
      if (preset === 'This Month') {
        const from = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
        return orderDate >= from && orderDate <= tStr
      }
      if (preset === 'This Year') {
        return orderDate >= `${today.getFullYear()}-01-01` && orderDate <= tStr
      }
    }

    if (rangeType === 'month') {
      const idx = _ml.indexOf(exportMonth), yr = parseInt(exportYear)
      const lastDay = new Date(yr, idx + 1, 0).getDate()
      const from = `${yr}-${String(idx+1).padStart(2,'0')}-01`
      const to   = `${yr}-${String(idx+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
      return orderDate >= from && orderDate <= to
    }

    if (rangeType === 'custom') {
      if (customFrom && orderDate < customFrom) return false
      if (customTo   && orderDate > customTo)   return false
      return true
    }

    return true
  })

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/')
      } else {
        fetchOrders()
      }
    }
  }, [user, loading, router])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !loading) {
          loadMoreOrders()
        }
      },
      { threshold: 0, rootMargin: '600px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading])

  const fetchOrders = async () => {
    try {
      loadingMoreRef.current = true
      setPage(1)
      setHasMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const response = await fetch(`/api/orders?page=1&limit=${LIMIT}`, { headers })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.orders || [])
        setHasMore(data.pagination ? data.pagination.hasNextPage : false)
        setPage(2)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      loadingMoreRef.current = false
    }
  }

  const loadMoreOrders = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return
    try {
      loadingMoreRef.current = true
      setLoadingMore(true)
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?page=${page}&limit=${LIMIT}`, { headers })
      const data = await res.json()
      if (res.ok) {
        const incoming: Order[] = data.orders || []
        setOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id))
          const fresh = incoming.filter(o => !existingIds.has(o.id))
          return fresh.length > 0 ? [...prev, ...fresh] : prev
        })
        setHasMore(data.pagination ? data.pagination.hasNextPage : false)
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to load more orders:', error)
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [page, hasMore, accessToken])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const token = await accessToken()
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        } as HeadersInit,
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : prev)
        }
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-muted text-foreground/90'
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOrderId(id)
    e.dataTransfer.effectAllowed = 'move'
    // Optional: set a drag image or transparent ghost
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '0.4'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedOrderId(null)
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedOrderId) return
    
    // Optimistic UI Update for Kanban dragging
    const orderToMove = orders.find(o => o.id === draggedOrderId)
    if (orderToMove && orderToMove.status !== newStatus) {
        setOrders(prev => prev.map(o => o.id === draggedOrderId ? { ...o, status: newStatus } : o))
        await handleStatusUpdate(draggedOrderId, newStatus)
    }
    setDraggedOrderId(null)
  }

  const todayStr = () => toLocalDate(new Date().toISOString())
  const offsetDays = (n: number) => {
    const d = new Date(); d.setDate(d.getDate() + n)
    return toLocalDate(d.toISOString())
  }

  // Returns { filterFn, label } — filterFn filters orders by local date
  const computeExportFilter = () => {
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const _ml = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const today = new Date()

    if (rangeType === 'preset') {
      if (preset === 'All Time') {
        return { filterFn: null, label: `All Time (as of ${fmt(today)})` }
      }
      if (preset === 'Today') {
        const d = todayStr()
        return { filterFn: (o: Order) => toLocalDate(o.createdAt) === d, label: `Today (${fmt(today)})` }
      }
      if (preset === 'Last 7 Days') {
        const from = offsetDays(-6), to = todayStr()
        return { filterFn: (o: Order) => toLocalDate(o.createdAt) >= from && toLocalDate(o.createdAt) <= to,
          label: `${fmt(new Date(from))} – ${fmt(today)}` }
      }
      if (preset === 'Last 30 Days') {
        const from = offsetDays(-29), to = todayStr()
        return { filterFn: (o: Order) => toLocalDate(o.createdAt) >= from && toLocalDate(o.createdAt) <= to,
          label: `${fmt(new Date(from))} – ${fmt(today)}` }
      }
      if (preset === 'This Month') {
        const from = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
        const to = todayStr()
        return { filterFn: (o: Order) => toLocalDate(o.createdAt) >= from && toLocalDate(o.createdAt) <= to,
          label: `${today.toLocaleString('default',{month:'long'})} ${today.getFullYear()}` }
      }
      if (preset === 'This Year') {
        const from = `${today.getFullYear()}-01-01`, to = todayStr()
        return { filterFn: (o: Order) => toLocalDate(o.createdAt) >= from && toLocalDate(o.createdAt) <= to,
          label: `Year ${today.getFullYear()}` }
      }
    }

    if (rangeType === 'month') {
      const idx = _ml.indexOf(exportMonth), yr = parseInt(exportYear)
      const from = `${yr}-${String(idx+1).padStart(2,'0')}-01`
      const lastDay = new Date(yr, idx+1, 0).getDate()
      const to   = `${yr}-${String(idx+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`
      return { filterFn: (o: Order) => toLocalDate(o.createdAt) >= from && toLocalDate(o.createdAt) <= to,
        label: `${exportMonth} ${exportYear}` }
    }

    // custom
    const from = customFrom || null
    const to   = customTo   || null
    const label = from || to
      ? `${from ? fmt(new Date(from)) : 'Start'} – ${to ? fmt(new Date(to)) : 'Today'}`
      : `All Time (as of ${fmt(today)})`
    return { filterFn: (o: Order) =>
      (!from || toLocalDate(o.createdAt) >= from) &&
      (!to   || toLocalDate(o.createdAt) <= to), label }
  }

  const handleExportAll = async () => {
    setExportingAll(true)
    try {
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?limit=all`, { headers })
      const data = await res.json()
      const { filterFn, label } = computeExportFilter()
      let allOrders: Order[] = data.orders || orders
      console.log('[ExportExcel] total:', allOrders.length, 'preset:', preset, 'sample:', allOrders[0]?.createdAt, 'local:', allOrders[0] ? toLocalDate(allOrders[0].createdAt) : '-', 'today:', todayStr())
      if (filterFn) allOrders = allOrders.filter(filterFn)
      console.log('[ExportExcel] after filter:', allOrders.length)
      await exportAllOrdersToExcel(allOrders)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingAll(false)
    }
  }

  const handleExportAllPdf = async () => {
    setExportingAllPdf(true)
    try {
      const token = await accessToken()
      const headers = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit
      const res = await fetch(`/api/orders?limit=all`, { headers })
      const data = await res.json()
      const { filterFn, label } = computeExportFilter()
      let allOrders: Order[] = data.orders || orders
      console.log('[ExportPDF] total:', allOrders.length, 'preset:', preset, 'sample:', allOrders[0]?.createdAt, 'local:', allOrders[0] ? toLocalDate(allOrders[0].createdAt) : '-', 'today:', todayStr())
      if (filterFn) allOrders = allOrders.filter(filterFn)
      console.log('[ExportPDF] after filter:', allOrders.length)
      await exportAllOrdersToPDF(allOrders, label)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingAllPdf(false)
    }
  }


  const handleExportSingle = async (order: Order) => {
    setExportingSingle(true)
    try {
      await exportSingleOrderToExcel(order, settings?.shippingBaseRate || 350)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingSingle(false)
    }
  }

  const handleExportSinglePdf = async (order: Order) => {
    setExportingSinglePdf(true)
    try {
      await exportSingleOrderToPDF(order, settings?.shippingBaseRate || 350)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExportingSinglePdf(false)
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return <div className="max-w-7xl mx-auto p-6">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package2 className="h-8 w-8" />
          Manage Orders
        </h1>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted-foreground/80" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-card placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              placeholder="Search orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-muted rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
              title="Kanban Board View"
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
          </div>

          {/* Export All Buttons */}
          <Button
            onClick={handleExportAll}
            disabled={exportingAll || exportingAllPdf || orders.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
            title="Export all orders to Excel"
          >
            {exportingAll
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <FileSpreadsheet className="h-4 w-4" />}
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button
            onClick={handleExportAllPdf}
            disabled={exportingAll || exportingAllPdf || orders.length === 0}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shrink-0"
            title="Export all orders to PDF"
          >
            {exportingAllPdf
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <FileText className="h-4 w-4" />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* ── Export Date Range Filter (analytics-style) ── */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground/70 shrink-0">
          <svg className="h-4 w-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Export Range:
        </div>

        {/* Type selector */}
        <select
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
          value={rangeType}
          onChange={e => setRangeType(e.target.value as 'preset' | 'month' | 'custom')}
        >
          <option value="preset">Preset Range</option>
          <option value="month">Month &amp; Year</option>
          <option value="custom">Custom Dates</option>
        </select>

        {/* Preset picker */}
        {rangeType === 'preset' && (
          <select
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            value={preset}
            onChange={e => setPreset(e.target.value)}
          >
            <option>All Time</option>
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        )}

        {/* Month + Year picker */}
        {rangeType === 'month' && (
          <div className="flex gap-2">
            <select
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
              value={exportMonth}
              onChange={e => setExportMonth(e.target.value)}
            >
              {monthList.map(m => <option key={m}>{m}</option>)}
            </select>
            <select
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground/80 outline-none focus:ring-2 focus:ring-pink-300 transition-all"
              value={exportYear}
              onChange={e => setExportYear(e.target.value)}
            >
              {yearList.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Custom date pickers */}
        {rangeType === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date" value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-card outline-none focus:ring-2 focus:ring-pink-300"
            />
            <span className="text-muted-foreground text-xs font-medium">→</span>
            <input
              type="date" value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-card outline-none focus:ring-2 focus:ring-pink-300"
            />
            {(customFrom || customTo) && (
              <button onClick={() => { setCustomFrom(''); setCustomTo('') }}
                className="text-xs text-muted-foreground hover:text-rose-600 underline transition-colors ml-1">
                Clear
              </button>
            )}
          </div>
        )}

        {/* Live preview label */}
        <span className="ml-auto text-xs text-muted-foreground/70 italic hidden sm:block">
          {exportRange.label}
        </span>
      </div>

      {viewMode === 'list' ? (
        <div className="w-full space-y-6">
          {/* Desktop Table */}
          <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.user?.name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{order.user?.email || 'No email'}</div>
                    {order.user?.phone && (
                      <div className="text-sm text-muted-foreground">{order.user?.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.currency} {order.totalAmount}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      title="View order details"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{order.orderNumber}</div>
                <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
              <Badge className={getStatusBadgeColor(order.status)}>
                {order.status}
              </Badge>
            </div>

            <div className="text-sm">
              <div className="font-medium mb-1">Customer</div>
              <div>{order.user?.name || 'N/A'}</div>
              <div className="text-muted-foreground">{order.user?.email || 'No email'}</div>
            </div>

            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span>{order.currency} {order.totalAmount}</span>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedOrder(order)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <div className="flex-1">
                <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="py-2" />

      {loadingMore && (
        <div className="flex items-center justify-center py-6 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
          <span className="text-sm font-medium">Loading more orders…</span>
        </div>
      )}

      {!hasMore && orders.length > 0 && !loading && (
        <p className="text-center text-xs text-muted-foreground/80 py-4">
          All {orders.length} orders loaded
        </p>
      )}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] w-full">
           {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
               <div
                   key={status}
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDrop(e, status)}
                   className="flex shrink-0 flex-col w-[320px] bg-muted/50 rounded-xl border border-border shadow-inner"
               >
                  <div className="p-4 border-b border-border flex items-center justify-between bg-card rounded-t-xl sticky top-0 z-10">
                     <h3 className="font-bold uppercase text-xs tracking-wider text-foreground/80">{status}</h3>
                     <Badge className={getStatusBadgeColor(status)}>
                        {filteredOrders.filter(o => o.status === status).length}
                     </Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
                     {filteredOrders.filter(o => o.status === status).map(order => (
                         <div
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedOrder(order)}
                            className={`bg-card p-4 rounded-lg shadow-sm border-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all active:scale-95 ${draggedOrderId === order.id ? 'border-pink-500 opacity-50 scale-95' : 'border-transparent hover:border-pink-200'}`}
                         >
                            <div className="flex justify-between items-start mb-2">
                               <span className="font-bold text-foreground text-sm">{order.orderNumber}</span>
                               <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wide">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-3 truncate leading-snug">
                               <span className="font-semibold text-foreground/90">{order.user?.name || 'N/A'}</span><br/>
                               {order.user?.email}
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                               <span className="text-xs font-semibold text-muted-foreground/80 bg-muted px-2 py-1 rounded-md">{order.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                               <span className="font-bold text-foreground">{order.currency} {Number(order.totalAmount).toLocaleString()}</span>
                            </div>
                         </div>
                     ))}
                     {filteredOrders.filter(o => o.status === status).length === 0 && (
                        <div className="h-full flex items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-lg">
                           <span className="text-xs text-muted-foreground/80 font-semibold italic">Drop orders here</span>
                        </div>
                     )}
                  </div>
               </div>
           ))}
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null) }}
        >
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">Order Details</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export single order — Excel + PDF */}
                <Button
                  size="sm"
                  onClick={() => handleExportSingle(selectedOrder)}
                  disabled={exportingSingle || exportingSinglePdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  title="Export to Excel"
                >
                  {exportingSingle
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Excel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleExportSinglePdf(selectedOrder)}
                  disabled={exportingSingle || exportingSinglePdf}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  title="Export to PDF"
                >
                  {exportingSinglePdf
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <FileText className="h-3.5 w-3.5" />}
                  PDF
                </Button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="ml-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground/80 hover:text-foreground/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Top info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground/80 text-sm uppercase tracking-wide mb-3">Customer</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedOrder.user?.name || 'N/A'}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedOrder.user?.email || 'No email'}</span></div>
                    {selectedOrder.user?.phone && (
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedOrder.user.phone}</span></div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground/80 text-sm uppercase tracking-wide mb-3">Order Info</h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Order #:</span> <span className="font-medium">{selectedOrder.orderNumber}</span></div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusBadgeColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                    </div>
                    <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground/80 text-sm uppercase tracking-wide mb-3">Shipping Address</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </div>
                    <div>{selectedOrder.shippingAddress.address}</div>
                    <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</div>
                    <div>{selectedOrder.shippingAddress.district}</div>
                    {selectedOrder.shippingAddress.phone && (
                      <div className="text-muted-foreground">Phone: {selectedOrder.shippingAddress.phone}</div>
                    )}
                    {selectedOrder.shippingAddress.email && (
                      <div className="text-muted-foreground">Email: {selectedOrder.shippingAddress.email}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-700 text-sm uppercase tracking-wide mb-2">Customer Notes</h3>
                  <p className="text-sm text-foreground/80">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Items — Desktop */}
              <div>
                <h3 className="font-semibold text-foreground/80 text-sm uppercase tracking-wide mb-3">Order Items</h3>
                <div className="hidden md:block rounded-xl overflow-hidden border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0">
                                {item.product.images?.[0]?.url && (
                                  <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {item.product.name}
                                  {(item.variantName || item.variant?.name) && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                      ({item.variantName || item.variant?.name})
                                    </span>
                                  )}
                                </div>
                                <a href={`/products/${item.product.slug}`} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline">
                                  View Product
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{selectedOrder.currency} {Number(item.price).toLocaleString('en-LK')}</TableCell>
                          <TableCell>{selectedOrder.currency} {Number(item.total).toLocaleString('en-LK')}</TableCell>
                        </TableRow>
                      ))}

                      {/* Totals */}
                      {(() => {
                        const subtotal = selectedOrder.items.reduce((acc, i) => acc + Number(i.total), 0)
                        const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                        const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                        const shippingBaseRate = settings?.shippingBaseRate || 350
                        return (
                          <>
                            <TableRow className="bg-muted/50/60">
                              <TableCell colSpan={3} className="font-medium text-right text-muted-foreground">Subtotal:</TableCell>
                              <TableCell className="font-medium">{selectedOrder.currency} {subtotal.toLocaleString('en-LK')}</TableCell>
                            </TableRow>
                            {discount > 0 && (
                              <TableRow className="text-green-600 bg-green-50/40">
                                <TableCell colSpan={3} className="font-medium text-right">
                                  Discount ({selectedOrder.couponUsage?.coupon.code}):
                                </TableCell>
                                <TableCell>− {selectedOrder.currency} {discount.toLocaleString('en-LK')}</TableCell>
                              </TableRow>
                            )}
                            <TableRow className="bg-muted/50/60">
                              <TableCell colSpan={3} className="font-medium text-right text-muted-foreground">Shipping:</TableCell>
                              <TableCell>
                                {shipping === 0
                                  ? <span className="text-green-600 font-medium">FREE <span className="line-through text-muted-foreground/80 text-xs font-normal">{selectedOrder.currency} {shippingBaseRate}</span></span>
                                  : `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`}
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-indigo-50">
                              <TableCell colSpan={3} className="font-bold text-right text-base">Final Total:</TableCell>
                              <TableCell className="font-bold text-base text-indigo-700">{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</TableCell>
                            </TableRow>
                          </>
                        )
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Items — Mobile */}
                <div className="md:hidden space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-muted/50">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 rounded-md bg-gray-200 overflow-hidden shrink-0">
                          {item.product.images?.[0]?.url && (
                            <img src={item.product.images[0].url} alt={item.product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.product.name}
                            {(item.variantName || item.variant?.name) && (
                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                ({item.variantName || item.variant?.name})
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>{item.quantity} × {selectedOrder.currency} {Number(item.price).toLocaleString('en-LK')}</span>
                            <span className="font-bold text-foreground">{selectedOrder.currency} {Number(item.total).toLocaleString('en-LK')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Mobile totals */}
                  {(() => {
                    const subtotal = selectedOrder.items.reduce((acc, i) => acc + Number(i.total), 0)
                    const discount = Number(selectedOrder.couponUsage?.discountAmount || 0)
                    const shipping = Math.max(0, Number(selectedOrder.totalAmount) - (subtotal - discount))
                    const shippingBaseRate = settings?.shippingBaseRate || 350
                    return (
                      <div className="border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{selectedOrder.currency} {subtotal.toLocaleString('en-LK')}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({selectedOrder.couponUsage?.coupon.code})</span>
                            <span>- {selectedOrder.currency} {discount.toLocaleString('en-LK')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>
                            {shipping === 0
                              ? <><span className="line-through text-muted-foreground/80 mr-1">{selectedOrder.currency} {shippingBaseRate}</span><span className="text-green-600 font-medium">FREE</span></>
                              : `${selectedOrder.currency} ${shipping.toLocaleString('en-LK')}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-2 text-indigo-700">
                          <span>Total</span>
                          <span>{selectedOrder.currency} {Number(selectedOrder.totalAmount).toLocaleString('en-LK')}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
