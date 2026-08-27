import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'
import ExcelJS from 'exceljs'

function sanitizeFormulaCell(val: any): any {
    if (typeof val !== 'string') return val
    if (['=', '+', '-', '@'].includes(val.charAt(0))) {
        return `'${val}`
    }
    return val
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const user = await verifyAuthToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const orders = await prisma.order.findMany({
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

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Orders')

        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Date', key: 'createdAt', width: 20 },
            { header: 'Customer Name', key: 'customerName', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Total Qty', key: 'totalQty', width: 10 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Items', key: 'items', width: 50 },
            { header: 'Notes', key: 'notes', width: 20 },
        ]

        orders.forEach(order => {
            const shipping = order.shippingAddress as any

            // Format items string
            const itemsString = order.items.map(item =>
                `${item.product?.name || 'Unknown Product'} (x${item.quantity})`
            ).join(', ')

            // Calculate total quantity
            const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)

            worksheet.addRow({
                orderNumber: sanitizeFormulaCell(order.orderNumber),
                status: sanitizeFormulaCell(order.status),
                createdAt: order.createdAt.toLocaleString(),
                customerName: sanitizeFormulaCell(shipping?.name || order.user?.name || 'N/A'),
                email: sanitizeFormulaCell(shipping?.email || order.user?.email || 'N/A'),
                phone: sanitizeFormulaCell(shipping?.phone || order.user?.phone || 'N/A'),
                address: sanitizeFormulaCell(shipping ? `${shipping.address}, ${shipping.city}, ${shipping.postalCode}` : 'N/A'),
                totalAmount: order.totalAmount,
                totalQty: totalQty,
                paymentMethod: sanitizeFormulaCell(order.paymentMethod),
                items: sanitizeFormulaCell(itemsString),
                notes: sanitizeFormulaCell(order.notes)
            })
        })

        // Styling header
        worksheet.getRow(1).font = { bold: true }

        const buffer = await workbook.xlsx.writeBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=orders-report.xlsx'
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
