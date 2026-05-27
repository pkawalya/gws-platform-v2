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
    const clientId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['client_type', 'first_name', 'last_name', 'company_name', 'email', 'phone', 'district', 'status', 'notes', 'sub_county', 'parish', 'village', 'address', 'nin']
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const client = await db.client.update({
      where: { id: clientId },
      data,
      include: {
        organization: { select: { name: true, slug: true } },
        branch: { select: { name: true, slug: true } },
        surveyProjects: { select: { id: true, project_ref: true, title: true, status: true } },
        invoices: { select: { id: true, invoice_number: true, total_amount: true, status: true } },
        _count: { select: { surveyProjects: true, invoices: true, documents: true, communications: true } },
      },
    })
    return NextResponse.json(serialize(client))
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = BigInt(id)

    await db.client.delete({ where: { id: clientId } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
