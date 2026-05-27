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
    const commId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['status', 'subject', 'body', 'channel', 'direction']

    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Auto-set sent_at when status changes to sent or delivered
    if (body.status === 'sent' || body.status === 'delivered') {
      data.sent_at = new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const communication = await db.communication.update({
      where: { id: commId },
      data,
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(communication))
  } catch (error) {
    console.error('Update communication error:', error)
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 })
  }
}
