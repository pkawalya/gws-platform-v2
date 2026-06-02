import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const template_id = searchParams.get('template_id')
    const project_id = searchParams.get('project_id')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (template_id) where.template_id = template_id
    if (project_id) where.project_id = BigInt(project_id)

    const reports = await db.surveyReport.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        template: { select: { name: true, report_type: true, primary_color: true } },
      },
    })

    return NextResponse.json(serialize(reports))
  } catch (error) {
    console.error('Survey reports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_id, project_id, client_id, title, data, notes, prepared_by } = body

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    // Verify template exists
    const template = await db.surveyReportTemplate.findUnique({ where: { id: template_id } })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Generate unique report number
    const count = await db.surveyReport.count()
    const report_number = `SR-${String(count + 1).padStart(6, '0')}-${new Date().getFullYear()}`

    const report = await db.surveyReport.create({
      data: {
        template_id,
        project_id: project_id ? BigInt(project_id) : null,
        client_id: client_id ? BigInt(client_id) : null,
        title: title || `${template.name} - ${report_number}`,
        report_number,
        data: data || {},
        notes: notes || null,
        prepared_by: prepared_by || null,
      },
      include: {
        template: { select: { name: true, report_type: true, primary_color: true } },
      },
    })

    return NextResponse.json(serialize(report), { status: 201 })
  } catch (error) {
    console.error('Create survey report error:', error)
    return NextResponse.json({ error: 'Failed to create survey report' }, { status: 500 })
  }
}
