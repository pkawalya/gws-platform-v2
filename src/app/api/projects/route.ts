import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, project_type, client_id, district, priority, status } = body

    if (!title || !client_id) {
      return NextResponse.json({ error: 'Title and client_id are required' }, { status: 400 })
    }

    // Generate a unique project_ref
    const count = await db.surveyProject.count()
    const project_ref = `PRJ-${String(count + 1).padStart(5, '0')}`

    const project = await db.surveyProject.create({
      data: {
        project_ref,
        project_type: project_type || 'cadastral',
        title,
        client_id: BigInt(client_id),
        district: district || null,
        priority: priority || 'normal',
        status: status || 'intake',
      },
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
        approvalSteps: { orderBy: { step_order: 'asc' } },
        fieldObservations: { select: { id: true, title: true, observation_type: true, status: true } },
        _count: { select: { approvalSteps: true, fieldObservations: true, progressRecords: true } },
      },
    })
    return NextResponse.json(serialize(project), { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
