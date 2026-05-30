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
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(serialize(definitions))
  } catch (error) {
    console.error('Workflows GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, trigger_type, trigger_config, steps } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existing = await db.workflowDefinition.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'A workflow with this name already exists' }, { status: 409 })
    }

    const definition = await db.workflowDefinition.create({
      data: {
        name,
        slug,
        description: description || null,
        trigger_type: trigger_type || 'manual',
        trigger_config: trigger_config || null,
        steps: steps && steps.length > 0 ? {
          create: steps.map((step: any, idx: number) => ({
            name: step.name,
            slug: step.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            step_order: idx + 1,
            step_type: step.step_type || 'approval',
            assignee_type: step.assignee_type || 'role',
            assignee_id: step.assignee_id || null,
            auto_assign: step.auto_assign || false,
            is_required: step.is_required !== false,
            sla_hours: step.sla_hours || null,
            config: step.config || null,
          })),
        } : undefined,
      },
      include: {
        steps: { orderBy: { step_order: 'asc' } },
        instances: true,
      },
    })

    return NextResponse.json(serialize(definition), { status: 201 })
  } catch (error) {
    console.error('Workflows POST error:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
