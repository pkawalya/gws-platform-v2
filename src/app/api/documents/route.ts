import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

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
