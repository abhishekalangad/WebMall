import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'
import ExcelJS from 'exceljs'

function sanitizeFormulaCell(val: any): any {
    if (val === null || val === undefined) return ''
    if (typeof val !== 'string') return val
    if (['=', '+', '-', '@'].includes(val.charAt(0))) {
        return `'${val}`
    }
    return val
}

function escapeCsvField(val: any): string {
    if (val === null || val === undefined) return '""'
    let str = String(val).replace(/"/g, '""')
    if (['=', '+', '-', '@'].includes(str.charAt(0))) {
        str = `'${str}`
    }
    return `"${str}"`
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        let token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            token = searchParams.get('token') || ''
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyAuthToken(token)
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const range = (searchParams.get('range') || 'all').toLowerCase()
        const format = (searchParams.get('format') || 'xlsx').toLowerCase()

        const now = new Date()
        let gte: Date | undefined
        let lte: Date | undefined
        let reportLabel = 'All Time'

        if (range === 'today') {
            gte = new Date()
            gte.setHours(0, 0, 0, 0)
            lte = new Date()
            lte.setHours(23, 59, 59, 999)
            reportLabel = `Day-Wise (${gte.toISOString().split('T')[0]})`
        } else if (range === 'weekly') {
            gte = new Date()
            gte.setDate(now.getDate() - 7)
            gte.setHours(0, 0, 0, 0)
            lte = new Date()
            lte.setHours(23, 59, 59, 999)
            reportLabel = `Weekly (${gte.toISOString().split('T')[0]} to ${lte.toISOString().split('T')[0]})`
        } else if (range === 'monthly') {
            const selectedYear = parseInt(searchParams.get('year') || now.getFullYear().toString())
            const selectedMonth = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString()) - 1
            gte = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0)
            lte = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)
            const monthName = gte.toLocaleString('default', { month: 'long' })
            reportLabel = `Monthly (${monthName} ${selectedYear})`
        } else if (range === 'quarterly') {
            const selectedYear = parseInt(searchParams.get('year') || now.getFullYear().toString())
            const selectedQuarter = parseInt(searchParams.get('quarter') || (Math.floor(now.getMonth() / 3) + 1).toString())
            const startMonth = (selectedQuarter - 1) * 3
            const endMonth = startMonth + 2
            gte = new Date(selectedYear, startMonth, 1, 0, 0, 0, 0)
            lte = new Date(selectedYear, endMonth + 1, 0, 23, 59, 59, 999)
            reportLabel = `Quarterly (Q${selectedQuarter} ${selectedYear})`
        } else if (range === 'yearly') {
            const selectedYear = parseInt(searchParams.get('year') || now.getFullYear().toString())
            gte = new Date(selectedYear, 0, 1, 0, 0, 0, 0)
            lte = new Date(selectedYear, 11, 31, 23, 59, 59, 999)
            reportLabel = `Yearly (${selectedYear})`
        } else if (range === 'custom') {
            const startStr = searchParams.get('startDate')
            const endStr = searchParams.get('endDate')
            if (startStr) {
                gte = new Date(startStr)
                gte.setHours(0, 0, 0, 0)
            }
            if (endStr) {
                lte = new Date(endStr)
                lte.setHours(23, 59, 59, 999)
            }
            reportLabel = `Custom Range (${startStr || 'Beginning'} to ${endStr || 'Present'})`
        }

        const whereClause: any = {}
        if (gte || lte) {
            whereClause.createdAt = {}
            if (gte) whereClause.createdAt.gte = gte
            if (lte) whereClause.createdAt.lte = lte
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Summary Calculations
        const totalOrders = orders.length
        const validOrders = orders.filter(o => !['cancelled', 'failed'].includes(o.status.toLowerCase()))
        const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        const statusCounts: Record<string, number> = {}
        orders.forEach(o => {
            const s = o.status || 'unknown'
            statusCounts[s] = (statusCounts[s] || 0) + 1
        })

        const dateSuffix = now.toISOString().split('T')[0]
        const filename = `webmall-orders-report-${range}-${dateSuffix}.${format}`

        if (format === 'csv') {
            const csvRows: string[] = []
            // Add Header Info
            csvRows.push(escapeCsvField(`WebMall Orders & Sales Report - ${reportLabel}`))
            csvRows.push(escapeCsvField(`Generated on: ${now.toLocaleString()}`))
            csvRows.push(escapeCsvField(`Total Orders: ${totalOrders} | Gross Revenue: LKR ${totalRevenue.toLocaleString()} | Avg Order Value: LKR ${Math.round(avgOrderValue).toLocaleString()}`))
            csvRows.push('')

            // Table Columns
            const headers = [
                'Order Number',
                'Status',
                'Date & Time',
                'Customer Name',
                'Email',
                'Phone',
                'Shipping Address',
                'Total Amount (LKR)',
                'Total Qty',
                'Payment Method',
                'Items Breakdown',
                'Notes'
            ]
            csvRows.push(headers.map(h => escapeCsvField(h)).join(','))

            orders.forEach(order => {
                const shipping = order.shippingAddress as any
                const itemsString = order.items.map(item =>
                    `${item.product?.name || 'Unknown Product'} (x${item.quantity})`
                ).join('; ')
                const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)

                const row = [
                    order.orderNumber,
                    order.status,
                    order.createdAt.toLocaleString(),
                    shipping?.name || order.user?.name || 'N/A',
                    shipping?.email || order.user?.email || 'N/A',
                    shipping?.phone || order.user?.phone || 'N/A',
                    shipping ? `${shipping.address || ''}, ${shipping.city || ''}, ${shipping.postalCode || ''}` : 'N/A',
                    order.totalAmount,
                    totalQty,
                    order.paymentMethod,
                    itemsString,
                    order.notes || ''
                ]
                csvRows.push(row.map(r => escapeCsvField(r)).join(','))
            })

            const csvBuffer = Buffer.from(csvRows.join('\n'), 'utf-8')
            return new NextResponse(csvBuffer, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            })
        }

        // Default Excel (.xlsx) Generation
        const workbook = new ExcelJS.Workbook()

        // 1. Summary Sheet
        const summarySheet = workbook.addWorksheet('Executive Summary')
        summarySheet.views = [{ showGridLines: true }]

        summarySheet.addRow(['WebMall Orders & Performance Report'])
        summarySheet.getRow(1).font = { size: 16, bold: true, color: { argb: 'FF1E293B' } }
        summarySheet.addRow([`Report Range: ${reportLabel}`])
        summarySheet.addRow([`Generated At: ${now.toLocaleString()}`])
        summarySheet.addRow([])

        summarySheet.addRow(['Metric Key', 'Value'])
        const metricHeaderRow = summarySheet.getRow(5)
        metricHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        metricHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }

        summarySheet.addRow(['Total Orders Placed', totalOrders])
        summarySheet.addRow(['Gross Revenue (LKR)', totalRevenue])
        summarySheet.addRow(['Average Order Value (LKR)', Math.round(avgOrderValue)])
        summarySheet.addRow([])

        summarySheet.addRow(['Order Status Breakdown', 'Count'])
        const statusHeaderRow = summarySheet.getRow(10)
        statusHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        statusHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }

        Object.entries(statusCounts).forEach(([status, count]) => {
            summarySheet.addRow([status.toUpperCase(), count])
        })

        summarySheet.getColumn(1).width = 30
        summarySheet.getColumn(2).width = 25

        // 2. Orders Sheet
        const ordersSheet = workbook.addWorksheet('Orders Breakdown')
        ordersSheet.views = [{ showGridLines: true }]

        ordersSheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 16 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Date & Time', key: 'createdAt', width: 22 },
            { header: 'Customer Name', key: 'customerName', width: 22 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Phone', key: 'phone', width: 16 },
            { header: 'Address', key: 'address', width: 32 },
            { header: 'Total Amount (LKR)', key: 'totalAmount', width: 20 },
            { header: 'Total Qty', key: 'totalQty', width: 12 },
            { header: 'Payment Method', key: 'paymentMethod', width: 16 },
            { header: 'Items Breakdown', key: 'items', width: 48 },
            { header: 'Notes', key: 'notes', width: 24 },
        ]

        const headerRow = ordersSheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' } // Dark slate header
        }

        orders.forEach(order => {
            const shipping = order.shippingAddress as any
            const itemsString = order.items.map(item =>
                `${item.product?.name || 'Unknown Product'} (x${item.quantity})`
            ).join(', ')
            const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)

            ordersSheet.addRow({
                orderNumber: sanitizeFormulaCell(order.orderNumber),
                status: sanitizeFormulaCell(order.status),
                createdAt: order.createdAt.toLocaleString(),
                customerName: sanitizeFormulaCell(shipping?.name || order.user?.name || 'N/A'),
                email: sanitizeFormulaCell(shipping?.email || order.user?.email || 'N/A'),
                phone: sanitizeFormulaCell(shipping?.phone || order.user?.phone || 'N/A'),
                address: sanitizeFormulaCell(shipping ? `${shipping.address || ''}, ${shipping.city || ''}, ${shipping.postalCode || ''}` : 'N/A'),
                totalAmount: order.totalAmount,
                totalQty: totalQty,
                paymentMethod: sanitizeFormulaCell(order.paymentMethod),
                items: sanitizeFormulaCell(itemsString),
                notes: sanitizeFormulaCell(order.notes)
            })
        })

        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error: any) {
        console.error('Export error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate report' },
            { status: 500 }
        )
    }
}
