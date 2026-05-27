import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const documents = await db.clientDocument.findMany({
      include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
      orderBy: { created_at: 'desc' },
    })
    const metrics = {
      total: documents.length,
      verified: documents.filter(d => d.is_verified).length,
      unverified: documents.filter(d => !d.is_verified).length,
      byType: documents.reduce((acc, d) => { acc[d.document_type] = (acc[d.document_type] || 0) + 1; return acc }, {} as Record<string, number>),
    }
    return NextResponse.json(serialize({ metrics, documents }))
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, document_type, client_id, file_path, description, mime_type, file_size, uploaded_by } = body

    if (!title || !document_type || !client_id) {
      return NextResponse.json({ error: 'title, document_type, and client_id are required' }, { status: 400 })
    }

    const document = await db.clientDocument.create({
      data: {
        title,
        document_type,
        client_id: BigInt(client_id),
        file_path: file_path || `/uploads/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}`,
        mime_type: mime_type || 'application/pdf',
        file_size: file_size || null,
        description: description || null,
        uploaded_by: uploaded_by || null,
      },
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(document), { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
