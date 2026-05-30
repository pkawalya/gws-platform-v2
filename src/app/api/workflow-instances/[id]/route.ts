import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

// Advance, reject, or cancel an instance
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, to_step_id, notes, performed_by, cancellation_reason } = body

    const instance = await db.workflowInstance.findUnique({
      where: { id },
      include: {
        workflowDefinition: { include: { steps: { orderBy: { step_order: 'asc' } } } },
        transitions: { include: { fromStep: true, toStep: true }, orderBy: { performed_at: 'asc' } },
      },
    })

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    if (action === 'cancel') {
      const updated = await db.workflowInstance.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: cancellation_reason || null,
        },
        include: {
          workflowDefinition: true,
          transitions: { include: { fromStep: true, toStep: true }, orderBy: { performed_at: 'asc' } },
        },
      })
      return NextResponse.json(serialize(updated))
    }

    if (action === 'advance' || action === 'transition') {
      if (instance.status === 'completed' || instance.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot advance a completed or cancelled workflow' }, { status: 400 })
      }

      const steps = instance.workflowDefinition.steps
      const currentStep = steps.find((s: any) => s.id === instance.current_step_id)
      let nextStep: any = null

      if (to_step_id) {
        nextStep = steps.find((s: any) => s.id === to_step_id)
        if (!nextStep) {
          return NextResponse.json({ error: 'Target step not found in workflow' }, { status: 400 })
        }
      } else {
        if (currentStep) {
          nextStep = steps.find((s: any) => s.step_order === currentStep.step_order + 1)
        }
      }

      await db.workflowTransition.create({
        data: {
          workflow_instance_id: id,
          from_step_id: instance.current_step_id,
          to_step_id: nextStep?.id || instance.current_step_id,
          action: action === 'advance' ? 'approved' : 'transitioned',
          performed_by: performed_by || null,
          notes: notes || null,
        },
      })

      const isCompleted = !nextStep || (currentStep && currentStep.step_order === steps.length && !to_step_id)
      const updateData: any = {
        current_step_id: nextStep?.id || instance.current_step_id,
        current_step_order: nextStep?.step_order || instance.current_step_order,
        status: isCompleted ? 'completed' : 'in_progress',
      }
      if (isCompleted) {
        updateData.completed_at = new Date()
      }

      const updated = await db.workflowInstance.update({
        where: { id },
        data: updateData,
        include: {
          workflowDefinition: { include: { steps: { orderBy: { step_order: 'asc' } } } },
          transitions: { include: { fromStep: true, toStep: true }, orderBy: { performed_at: 'asc' } },
        },
      })

      return NextResponse.json(serialize(updated))
    }

    if (action === 'reject') {
      await db.workflowTransition.create({
        data: {
          workflow_instance_id: id,
          from_step_id: instance.current_step_id,
          to_step_id: instance.current_step_id,
          action: 'rejected',
          performed_by: performed_by || null,
          notes: notes || null,
        },
      })

      const updated = await db.workflowInstance.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: notes || 'Rejected',
        },
        include: {
          workflowDefinition: true,
          transitions: { include: { fromStep: true, toStep: true }, orderBy: { performed_at: 'asc' } },
        },
      })

      return NextResponse.json(serialize(updated))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Instance PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update instance' }, { status: 500 })
  }
}
