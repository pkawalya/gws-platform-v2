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
    const documentId = BigInt(id)

    const data: Record<string, unknown> = {}
    const allowedFields = ['title', 'document_type', 'description', 'is_verified', 'file_path', 'mime_type', 'file_size']

    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const document = await db.clientDocument.update({
      where: { id: documentId },
      data,
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(document))
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = BigInt(id)

    await db.clientDocument.delete({ where: { id: documentId } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
