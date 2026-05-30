import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

// Launch a new workflow instance
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflow_definition_id, subject_type, subject_id, organization_id, branch_id, metadata } = body

    if (!workflow_definition_id || !subject_type || !subject_id) {
      return NextResponse.json(
        { error: 'workflow_definition_id, subject_type, and subject_id are required' },
        { status: 400 }
      )
    }

    const definition = await db.workflowDefinition.findUnique({
      where: { id: workflow_definition_id },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    })

    if (!definition) {
      return NextResponse.json({ error: 'Workflow definition not found' }, { status: 404 })
    }

    if (!definition.is_active) {
      return NextResponse.json({ error: 'Cannot start an inactive workflow' }, { status: 400 })
    }

    if (definition.steps.length === 0) {
      return NextResponse.json({ error: 'Workflow has no steps defined' }, { status: 400 })
    }

    const firstStep = definition.steps[0]

    const instance = await db.workflowInstance.create({
      data: {
        workflow_definition_id,
        organization_id: organization_id || null,
        branch_id: branch_id || null,
        subject_type,
        subject_id,
        status: 'pending',
        current_step_id: firstStep.id,
        current_step_order: firstStep.step_order,
        metadata: metadata || null,
      },
      include: {
        workflowDefinition: true,
        transitions: { include: { fromStep: true, toStep: true } },
      },
    })

    return NextResponse.json(serialize(instance), { status: 201 })
  } catch (error) {
    console.error('Instance POST error:', error)
    return NextResponse.json({ error: 'Failed to create workflow instance' }, { status: 500 })
  }
}

// Get all instances
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const subject_type = url.searchParams.get('subject_type')
    const subject_id = url.searchParams.get('subject_id')

    const where: any = {}
    if (status) where.status = status
    if (subject_type) where.subject_type = subject_type
    if (subject_id) where.subject_id = subject_id

    const instances = await db.workflowInstance.findMany({
      where,
      include: {
        workflowDefinition: { include: { steps: { orderBy: { step_order: 'asc' } } } },
        transitions: { include: { fromStep: true, toStep: true }, orderBy: { performed_at: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(serialize(instances))
  } catch (error) {
    console.error('Instances GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 })
  }
}
