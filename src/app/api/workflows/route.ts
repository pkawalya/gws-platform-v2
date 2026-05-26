import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const definitions = await db.workflowDefinition.findMany({
      include: {
        steps: { orderBy: { step_order: 'asc' } },
        instances: {
          include: {
            transitions: {
              include: {
                fromStep: true,
                toStep: true,
              },
              orderBy: { performed_at: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json(serialize(definitions))
  } catch (error) {
    console.error('Workflows API error:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}
