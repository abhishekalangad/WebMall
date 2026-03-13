import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthToken } from '@/lib/auth-server'

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const user = await verifyAuthToken(token)
  if (!user || user.role !== 'admin') return null
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') === 'true'

    // Single query — fetch all items, then filter in-memory for the response
    const all = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } })

    // Apply optional filters in-memory (avoids a second DB round-trip)
    let result = all
    if (category) result = result.filter((i: any) => i.category === category)
    if (lowStock) result = result.filter((i: any) => i.quantity <= i.lowStockAlert)

    // Summary stats derived from the same dataset
    const totalItems = all.length
    const lowStockCount = all.filter((i: any) => i.quantity <= i.lowStockAlert).length
    const totalValue = all.reduce((sum: number, i: any) => {
      const cost = i.costPerUnit ? parseFloat(i.costPerUnit.toString()) : 0
      return sum + (i.quantity * cost)
    }, 0)
    const uniqueCategories = Array.from(new Set(all.map((i: any) => String(i.category))))
    const categoriesCount = uniqueCategories.length

    return NextResponse.json({ items: result, stats: { totalItems, lowStockCount, totalValue, categoriesCount } })
  } catch (error: any) {
    console.error('[Inventory GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, category = 'General', quantity = 0, unit = 'pcs', lowStockAlert = 5, costPerUnit, supplier, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        quantity: parseInt(quantity),
        unit: unit.trim(),
        lowStockAlert: parseInt(lowStockAlert),
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
        supplier: supplier?.trim() || null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('[Inventory POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
