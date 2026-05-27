import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ids, status } = body

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'action and ids array are required' }, { status: 400 })
    }

    const bigIntIds = ids.map((id: string | number) => BigInt(id))

    switch (action) {
      case 'status-change': {
        if (!status) {
          return NextResponse.json({ error: 'status is required for status-change action' }, { status: 400 })
        }
        const result = await db.client.updateMany({
          where: { id: { in: bigIntIds } },
          data: { status },
        })
        return NextResponse.json(serialize({ success: true, action, count: result.count }))
      }

      case 'delete': {
        const result = await db.client.deleteMany({
          where: { id: { in: bigIntIds } },
        })
        return NextResponse.json(serialize({ success: true, action, count: result.count }))
      }

      case 'export': {
        const clients = await db.client.findMany({
          where: { id: { in: bigIntIds } },
          include: {
            organization: { select: { name: true } },
            branch: { select: { name: true } },
            _count: { select: { surveyProjects: true, invoices: true, documents: true, communications: true } },
          },
        })
        return NextResponse.json(serialize({ success: true, action, data: clients }))
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Bulk client action error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 })
  }
}
