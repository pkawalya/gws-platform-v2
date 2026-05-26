import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const approvals = await db.approvalStep.findMany({
      include: { surveyProject: { include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } } } },
      orderBy: { step_order: 'asc' },
    })
    const metrics = {
      total: approvals.length,
      approved: approvals.filter(a => a.status === 'approved').length,
      pending: approvals.filter(a => a.status === 'pending').length,
      deferred: approvals.filter(a => a.status === 'deferred').length,
    }
    return NextResponse.json(serialize({ metrics, approvals }))
  } catch (error) {
    console.error('Approvals API error:', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}
