import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        organization: { select: { name: true, slug: true } },
        branch: { select: { name: true, slug: true } },
        surveyProjects: { select: { id: true, project_ref: true, title: true, status: true } },
        invoices: { select: { id: true, invoice_number: true, total_amount: true, status: true } },
        _count: { select: { surveyProjects: true, invoices: true, documents: true, communications: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(serialize(clients))
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
