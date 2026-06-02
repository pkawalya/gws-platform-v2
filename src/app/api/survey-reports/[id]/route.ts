import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await db.surveyReport.findUnique({
      where: { id },
      include: {
        template: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(serialize(report))
  } catch (error) {
    console.error('Get survey report error:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'title', 'data', 'generated_content', 'status', 'notes',
      'prepared_by', 'reviewed_by', 'approved_by',
    ]
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    // Handle status transitions with timestamps
    if (body.status === 'review') {
      data.reviewed_at = new Date()
    } else if (body.status === 'approved') {
      data.approved_at = new Date()
    } else if (body.status === 'delivered') {
      data.delivered_at = new Date()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const report = await db.surveyReport.update({
      where: { id },
      data,
      include: {
        template: { select: { name: true, report_type: true, primary_color: true } },
      },
    })

    return NextResponse.json(serialize(report))
  } catch (error) {
    console.error('Update survey report error:', error)
    return NextResponse.json({ error: 'Failed to update survey report' }, { status: 500 })
  }
}
