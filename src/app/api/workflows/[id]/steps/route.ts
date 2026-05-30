import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

// Bulk update steps for a workflow definition (replace all steps)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()
    const { steps } = body

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'Steps must be an array' }, { status: 400 })
    }

    const existing = await db.workflowDefinition.findUnique({ where: { id: workflowId } })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Delete existing steps and recreate
    await db.workflowStep.deleteMany({ where: { workflow_definition_id: workflowId } })

    const createdSteps = await Promise.all(
      steps.map((step: any, idx: number) =>
        db.workflowStep.create({
          data: {
            workflow_definition_id: workflowId,
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
          },
        })
      )
    )

    return NextResponse.json(serialize(createdSteps), { status: 201 })
  } catch (error) {
    console.error('Steps PUT error:', error)
    return NextResponse.json({ error: 'Failed to update steps' }, { status: 500 })
  }
}

// Add a single step
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params
    const body = await request.json()
    const { name, step_type, assignee_type, assignee_id, auto_assign, is_required, sla_hours, config, after_step_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Step name is required' }, { status: 400 })
    }

    const existing = await db.workflowDefinition.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    let stepOrder: number
    if (after_step_id) {
      const afterStep = existing.steps.find((s: any) => s.id === after_step_id)
      if (!afterStep) {
        return NextResponse.json({ error: 'Reference step not found' }, { status: 400 })
      }
      stepOrder = afterStep.step_order + 1
      // Shift subsequent steps
      await db.workflowStep.updateMany({
        where: {
          workflow_definition_id: workflowId,
          step_order: { gte: stepOrder },
        },
        data: { step_order: { increment: 1 } },
      })
    } else {
      stepOrder = existing.steps.length + 1
    }

    const step = await db.workflowStep.create({
      data: {
        workflow_definition_id: workflowId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        step_order: stepOrder,
        step_type: step_type || 'approval',
        assignee_type: assignee_type || 'role',
        assignee_id: assignee_id || null,
        auto_assign: auto_assign || false,
        is_required: is_required !== false,
        sla_hours: sla_hours || null,
        config: config || null,
      },
    })

    return NextResponse.json(serialize(step), { status: 201 })
  } catch (error) {
    console.error('Step POST error:', error)
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
  }
}
