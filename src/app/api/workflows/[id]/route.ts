import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const definition = await db.workflowDefinition.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { step_order: 'asc' } },
        instances: {
          include: {
            transitions: {
              include: { fromStep: true, toStep: true },
              orderBy: { performed_at: 'asc' },
            },
          },
        },
      },
    })

    if (!definition) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(serialize(definition))
  } catch (error) {
    console.error('Workflow GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, trigger_type, trigger_config, is_active, version } = body

    const existing = await db.workflowDefinition.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type
    if (trigger_config !== undefined) updateData.trigger_config = trigger_config
    if (is_active !== undefined) updateData.is_active = is_active
    if (version !== undefined) updateData.version = version

    const definition = await db.workflowDefinition.update({
      where: { id },
      data: updateData,
      include: {
        steps: { orderBy: { step_order: 'asc' } },
        instances: true,
      },
    })

    return NextResponse.json(serialize(definition))
  } catch (error) {
    console.error('Workflow PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.workflowDefinition.findUnique({
      where: { id },
      include: { instances: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check for active instances
    const activeInstances = existing.instances.filter(
      (i: any) => i.status === 'pending' || i.status === 'in_progress'
    )
    if (activeInstances.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow with active instances. Cancel them first.' },
        { status: 409 }
      )
    }

    await db.workflowDefinition.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workflow DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
