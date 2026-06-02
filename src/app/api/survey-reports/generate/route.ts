import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_id, project_id, client_id, custom_data } = body

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    // Fetch template
    const template = await db.surveyReportTemplate.findUnique({ where: { id: template_id } })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Build data from sources
    const mergedData: Record<string, string> = {}

    // Start with defaults from template variables
    const variables = (template.variables as any[]) || []
    for (const v of variables) {
      mergedData[v.key] = v.default || ''
    }

    // Merge project data if project_id provided
    if (project_id) {
      const project = await db.surveyProject.findUnique({
        where: { id: BigInt(project_id) },
        include: {
          client: true,
          fieldObservations: { take: 10, orderBy: { created_at: 'desc' } },
        },
      })

      if (project) {
        mergedData.project_ref = project.project_ref || mergedData.project_ref || ''
        mergedData.project_title = project.title || mergedData.project_title || ''
        mergedData.district = project.district || mergedData.district || ''
        mergedData.sub_county = project.sub_county || mergedData.sub_county || ''
        mergedData.parish = project.parish || mergedData.parish || ''
        mergedData.village = project.village || mergedData.village || ''
        mergedData.area_hectares = project.area_hectares ? String(project.area_hectares) : (mergedData.area_hectares || '')

        // Merge client data from project
        if (project.client) {
          const clientName = project.client.client_type === 'company'
            ? (project.client.company_name || '')
            : [project.client.first_name, project.client.last_name].filter(Boolean).join(' ')
          mergedData.client_name = clientName || mergedData.client_name || ''
          mergedData.client_ref = project.client.client_ref || mergedData.client_ref || ''
        }

        // Generate coordinates list from observations
        if (project.fieldObservations.length > 0) {
          const coords = project.fieldObservations
            .filter((o: any) => o.latitude && o.longitude)
            .map((o: any, i: number) => `Point ${i + 1}: ${o.latitude}, ${o.longitude} - ${o.title}`)
            .join('\n')
          mergedData.coordinates_list = coords || mergedData.coordinates_list || ''
        }
      }
    } else if (client_id) {
      // Merge client data directly if only client_id provided
      const client = await db.client.findUnique({ where: { id: BigInt(client_id) } })
      if (client) {
        const clientName = client.client_type === 'company'
          ? (client.company_name || '')
          : [client.first_name, client.last_name].filter(Boolean).join(' ')
        mergedData.client_name = clientName || mergedData.client_name || ''
        mergedData.client_ref = client.client_ref || mergedData.client_ref || ''
        mergedData.district = client.district || mergedData.district || ''
        mergedData.sub_county = client.sub_county || mergedData.sub_county || ''
        mergedData.parish = client.parish || mergedData.parish || ''
        mergedData.village = client.village || mergedData.village || ''
      }
    }

    // Override with any custom data
    if (custom_data && typeof custom_data === 'object') {
      Object.assign(mergedData, custom_data)
    }

    // Set today's date for preparation_date if not set
    if (!mergedData.preparation_date) {
      mergedData.preparation_date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (!mergedData.survey_date) {
      mergedData.survey_date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Generate HTML content
    const sections = template.sections as any[]
    const primaryColor = template.primary_color || '#059669'

    const htmlSections = sections.map((section: any, index: number) => {
      // Replace variables in content
      let content = section.content || ''
      for (const [key, value] of Object.entries(mergedData)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
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
              <h1 style="font-size: 28px; color: ${primaryColor}; margin-bottom: 12px; font-weight: 700; letter-spacing: -0.5px;">${template.name}</h1>
              <div style="width: 60px; height: 3px; background: ${primaryColor}; margin: 20px auto;"></div>
              <p style="font-size: 16px; color: #374151; white-space: pre-line; margin-top: 24px;">${content}</p>
              <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280;">Prepared by: ${mergedData.organization_name || 'GWS Surveyors Ltd'}</p>
                <p style="font-size: 14px; color: #6b7280;">Date: ${mergedData.preparation_date || new Date().toLocaleDateString()}</p>
              </div>
            </div>`

        case 'certification':
          return `
            <div style="margin-top: 40px; padding: 24px; border: 2px solid ${primaryColor}; border-radius: 8px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">${section.title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">${content}</div>
            </div>`

        case 'coordinates':
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <p style="font-size: 14px; color: #374151; margin-bottom: 16px;">${content}</p>
              <div style="font-size: 13px; white-space: pre-line; font-family: monospace; background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">${mergedData.coordinates_list || '[Coordinate data to be entered]'}</div>
            </div>`

        case 'image':
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 40px; text-align: center; color: #9ca3af; font-size: 14px;">
                ${content}
              </div>
            </div>`

        default:
          return `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; margin-bottom: 16px;">${index + 1}. ${section.title}</h2>
              <div style="font-size: 14px; line-height: 1.8; white-space: pre-line;">${content}</div>
            </div>`
      }
    }).join('')

    // Build the full HTML document
    const headerText = (template.header_text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => mergedData[key] || '')
    const footerText = (template.footer_text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => mergedData[key] || '')

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
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

    return NextResponse.json({
      template_id,
      data: mergedData,
      generated_content: fullHtml,
      variables: template.variables,
      sections: template.sections,
    })
  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json({ error: 'Failed to generate report content' }, { status: 500 })
  }
}
