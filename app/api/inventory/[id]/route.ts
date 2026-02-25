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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, category, quantity, unit, lowStockAlert, costPerUnit, supplier, notes } = body

    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(quantity !== undefined ? { quantity: parseInt(quantity) } : {}),
        ...(unit !== undefined ? { unit: unit.trim() } : {}),
        ...(lowStockAlert !== undefined ? { lowStockAlert: parseInt(lowStockAlert) } : {}),
        ...(costPerUnit !== undefined ? { costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null } : {}),
        ...(supplier !== undefined ? { supplier: supplier?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {})
      }
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error('[Inventory PUT]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Quick quantity adjustment (restock / use)
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { delta } = await request.json() // positive = add, negative = use/consume
    const current = await prisma.inventoryItem.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const newQty = Math.max(0, current.quantity + parseInt(delta))
    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: { quantity: newQty }
    })
    return NextResponse.json(item)
  } catch (error: any) {
    console.error('[Inventory PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.inventoryItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Inventory DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
