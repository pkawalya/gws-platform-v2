import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = await db.surveyProject.findMany({
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
        approvalSteps: { orderBy: { step_order: 'asc' } },
        progressRecords: { orderBy: { recorded_at: 'desc' } },
        fieldObservations: { select: { id: true, title: true, observation_type: true, status: true } },
        _count: { select: { approvalSteps: true, fieldObservations: true, progressRecords: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(serialize(projects))
  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
