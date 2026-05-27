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
    const approvalId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['status', 'approved_by', 'assigned_to', 'notes']

    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Auto-set approved_at when status changes to approved
    if (body.status === 'approved') {
      data.approved_at = new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const approval = await db.approvalStep.update({
      where: { id: approvalId },
      data,
      include: {
        surveyProject: {
          include: {
            client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
          },
        },
      },
    })
    return NextResponse.json(serialize(approval))
  } catch (error) {
    console.error('Update approval error:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
