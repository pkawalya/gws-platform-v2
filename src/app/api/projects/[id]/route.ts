import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const projectId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['title', 'project_type', 'status', 'priority', 'district', 'sub_county', 'parish', 'village', 'description', 'assigned_to', 'due_date', 'completed_at', 'boundary_geojson', 'area_hectares']
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Handle date fields
    if (data.due_date) data.due_date = new Date(data.due_date as string)
    if (data.completed_at) data.completed_at = new Date(data.completed_at as string)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const project = await db.surveyProject.update({
      where: { id: projectId },
      data,
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
        approvalSteps: { orderBy: { step_order: 'asc' } },
        fieldObservations: { select: { id: true, title: true, observation_type: true, status: true } },
        _count: { select: { approvalSteps: true, fieldObservations: true, progressRecords: true } },
      },
    })
    return NextResponse.json(serialize(project))
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = BigInt(id)

    await db.surveyProject.delete({ where: { id: projectId } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
