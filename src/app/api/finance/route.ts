import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { client_id, invoice_number, amount, tax_amount, total_amount, status, due_date } = body

    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Auto-generate invoice_number if not provided
    if (!invoice_number) {
      const count = await db.invoice.count()
      invoice_number = `INV-${String(count + 1).padStart(5, '0')}`
    }

    // Calculate total if not provided
    const amt = Number(amount) || 0
    const tax = Number(tax_amount) || 0
    if (total_amount === undefined) total_amount = amt + tax

    const invoice = await db.invoice.create({
      data: {
        client_id: BigInt(client_id),
        invoice_number,
        amount: amt || total_amount,
        tax_amount: tax,
        total_amount,
        status: status || 'draft',
        due_date: due_date ? new Date(due_date) : null,
      },
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(invoice), { status: 201 })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
