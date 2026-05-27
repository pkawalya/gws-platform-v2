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
    const invoiceId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['status', 'notes']

    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Auto-set paid_at when status changes to paid
    if (body.status === 'paid') {
      data.paid_at = new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const invoice = await db.invoice.update({
      where: { id: invoiceId },
      data,
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(invoice))
  } catch (error) {
    console.error('Update invoice error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}
