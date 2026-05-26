import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [invoices, quotations] = await Promise.all([
      db.invoice.findMany({
        include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
        orderBy: { created_at: 'desc' },
      }),
      db.quotation.findMany({
        include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ])

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total_amount), 0)
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
    const totalOutstanding = totalInvoiced - totalPaid
    const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date())

    return NextResponse.json(serialize({
      metrics: { totalInvoiced, totalPaid, totalOutstanding, invoiceCount: invoices.length, overdueCount: overdueInvoices.length, quotationCount: quotations.length },
      invoices, quotations, overdueInvoices,
    }))
  } catch (error) {
    console.error('Finance API error:', error)
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 })
  }
}
