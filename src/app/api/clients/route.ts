import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_type, first_name, last_name, company_name, email, phone, district, status } = body

    // Generate a unique client_ref
    const count = await db.client.count()
    const client_ref = `CLT-${String(count + 1).padStart(5, '0')}`

    const client = await db.client.create({
      data: {
        client_ref,
        client_type: client_type || 'individual',
        first_name: client_type === 'company' ? null : (first_name || null),
        last_name: client_type === 'company' ? null : (last_name || null),
        company_name: client_type === 'company' ? company_name : null,
        email: email || null,
        phone: phone || null,
        district: district || null,
        status: status || 'prospect',
      },
      include: {
        organization: { select: { name: true, slug: true } },
        branch: { select: { name: true, slug: true } },
        surveyProjects: { select: { id: true, project_ref: true, title: true, status: true } },
        invoices: { select: { id: true, invoice_number: true, total_amount: true, status: true } },
        _count: { select: { surveyProjects: true, invoices: true, documents: true, communications: true } },
      },
    })
    return NextResponse.json(serialize(client), { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
