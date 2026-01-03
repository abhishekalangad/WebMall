import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
    try {
        // Authenticated check (simplified for now but assume admin middleware/check)
        // const session = await getSession();
        // if (!session || session.user.role !== 'admin') ...

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
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Items', key: 'items', width: 50 },
            { header: 'Notes', key: 'notes', width: 20 },
        ]

        orders.forEach(order => {
            const shipping = order.shippingAddress as any // Assuming standard structure or casting

            // Format items string
            const itemsString = order.items.map(item =>
                `${item.product?.name || 'Unknown Product'} (x${item.quantity})`
            ).join(', ')

            worksheet.addRow({
                orderNumber: order.orderNumber,
                status: order.status,
                createdAt: order.createdAt.toLocaleString(),
                customerName: shipping?.name || order.user?.name || 'N/A',
                email: shipping?.email || order.user?.email || 'N/A',
                phone: shipping?.phone || order.user?.phone || 'N/A',
                address: shipping ? `${shipping.address}, ${shipping.city}, ${shipping.postalCode}` : 'N/A',
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                items: itemsString,
                notes: order.notes
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

    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
