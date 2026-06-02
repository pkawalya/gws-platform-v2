import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { generateSurveyPdf } from '@/lib/pdf-generator'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const report = await db.surveyReport.findUnique({
      where: { id },
      include: { template: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await generateSurveyPdf(
      serialize(report),
      serialize(report.template)
    )

    // Save PDF to upload/reports directory
    const reportsDir = path.join(process.cwd(), 'upload', 'reports')
    if (!existsSync(reportsDir)) {
      await mkdir(reportsDir, { recursive: true })
    }

    const fileName = `survey-report-${report.report_number}.pdf`
    const filePath = path.join(reportsDir, fileName)
    await writeFile(filePath, pdfBuffer)

    // Update the report with the pdf_path
    await db.surveyReport.update({
      where: { id },
      data: { pdf_path: filePath },
    })

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF GET generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const report = await db.surveyReport.findUnique({
      where: { id },
      include: { template: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // If already has generated content, return it as HTML
    if (report.generated_content) {
      return NextResponse.json({
        html: report.generated_content,
        report_number: report.report_number,
      })
    }

    // Otherwise, generate the content on the fly (HTML for preview)
    const template = report.template
    const reportData = report.data as Record<string, string>
    const primaryColor = template.primary_color || '#059669'
    const sections = template.sections as any[]

    const htmlSections = sections.map((section: any, index: number) => {
      let content = section.content || ''
      if (reportData) {
        for (const [key, value] of Object.entries(reportData)) {
          content = content.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            String(value)
          )
        }
      }

      switch (section.type) {
        case 'cover':
          return `
            <div style="page-break-after: always; text-align: center; padding-top: 120px;">
              <div style="margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: ${primaryColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px; font-weight: bold;">GWS</span>
                </div>
              </div>
              <h1 style="font-size: 28px; color: ${primaryColor}; margin-bottom: 12px; font-weight: 700;">${template.name}</h1>
              <div style="width: 60px; height: 3px; background: ${primaryColor}; margin: 20px auto;"></div>
              <p style="font-size: 16px; color: #374151; white-space: pre-line; margin-top: 24px;">${content}</p>
              <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280;">Prepared by: ${reportData?.organization_name || 'GWS Surveyors Ltd'}</p>
                <p style="font-size: 14px; color: #6b7280;">Date: ${reportData?.preparation_date || new Date().toLocaleDateString()}</p>
              </div>
            </div>`
        case 'certification':
          return `
            <div style="margin-top: 40px; padding: 24px; border: 2px solid ${primaryColor}; border-radius: 8px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; margin-bottom: 16px; text-transform: uppercase;">${section.title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">${content}</div>
            </div>`
        case 'coordinates':
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">${content}</p>
              <div style="font-size: 13px; white-space: pre-line; font-family: monospace; background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">${reportData?.coordinates_list || '[Coordinate data to be entered]'}</div>
            </div>`
        case 'image':
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 40px; text-align: center; color: #9ca3af; font-size: 14px;">${content}</div>
            </div>`
        default:
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">${content}</div>
            </div>`
      }
    }).join('')

    const headerText = (template.header_text || '').replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => reportData?.[key] || ''
    )
    const footerText = (template.footer_text || '').replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => reportData?.[key] || ''
    )

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} - ${report.report_number}</title>
  <style>
    @page { size: ${template.page_size} ${template.orientation}; margin: 2cm; }
    body { font-family: '${template.font_family}', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${headerText ? `<div style="text-align: center; padding: 12px; border-bottom: 2px solid ${primaryColor}; margin-bottom: 20px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${headerText}</div>` : ''}
  ${htmlSections}
  ${footerText ? `<div style="text-align: center; padding: 12px; border-top: 1px solid #e5e7eb; margin-top: 40px; font-size: 11px; color: #9ca3af;">${footerText}</div>` : ''}
</body>
</html>`

    // Save the generated content
    await db.surveyReport.update({
      where: { id },
      data: { generated_content: fullHtml },
    })

    return NextResponse.json({
      html: fullHtml,
      report_number: report.report_number,
    })
  } catch (error) {
    console.error('PDF POST generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report content' },
      { status: 500 }
    )
  }
}
