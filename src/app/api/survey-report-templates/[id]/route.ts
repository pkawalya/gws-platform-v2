import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await db.surveyReportTemplate.findUnique({
      where: { id },
      include: { _count: { select: { reports: true } } },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(serialize(template))
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
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
      'name', 'slug', 'description', 'report_type', 'category',
      'sections', 'variables', 'header_text', 'footer_text', 'logo_position',
      'page_size', 'orientation', 'font_family', 'primary_color',
      'is_active', 'is_default', 'version',
    ]
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const template = await db.surveyReportTemplate.update({
      where: { id },
      data,
    })

    return NextResponse.json(serialize(template))
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.surveyReportTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
