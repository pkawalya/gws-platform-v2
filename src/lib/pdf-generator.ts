import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

// ── Types ──
interface TemplateSection {
  id: string
  title: string
  type: string
  content: string
  fields: string[]
  required: boolean
}

interface SurveyReportTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  report_type: string
  category: string
  sections: TemplateSection[]
  header_text: string | null
  footer_text: string | null
  logo_position: string | null
  variables: any[] | null
  page_size: string
  orientation: string
  font_family: string
  primary_color: string
  is_active: boolean
  is_default: boolean
  version: number
  created_at: string
  updated_at: string
}

interface SurveyReport {
  id: string
  template_id: string
  project_id: number | null
  client_id: number | null
  title: string
  report_number: string
  status: string
  data: Record<string, string>
  generated_content: string | null
  notes: string | null
  prepared_by: string | null
  reviewed_by: string | null
  approved_by: string | null
  reviewed_at: string | null
  approved_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  template: SurveyReportTemplate
}

// ── Helper: hex to RGB ──
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

// ── Helper: substitute variables ──
function substituteVars(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '')
}

// ── Page size dimensions ──
const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
  Legal: [612, 1008],
}

// ── UGX currency formatter ──
function formatUGX(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return String(amount)
  return `UGX ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ── Main PDF generation function ──
export async function generateSurveyPdf(
  report: SurveyReport,
  template: SurveyReportTemplate
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const reportData = report.data || {}
      const primaryColor = template.primary_color || '#059669'
      const rgb = hexToRgb(primaryColor)
      const sections = template.sections || []

      // Page dimensions
      const isLandscape = template.orientation === 'landscape'
      const pageSize = PAGE_SIZES[template.page_size] || PAGE_SIZES.A4
      const pageWidth = isLandscape ? pageSize[1] : pageSize[0]
      const pageHeight = isLandscape ? pageSize[0] : pageSize[1]

      // Margins
      const marginTop = 80
      const marginBottom = 80
      const marginLeft = 60
      const marginRight = 60
      const contentWidth = pageWidth - marginLeft - marginRight

      // Create document
      const doc = new PDFDocument({
        size: isLandscape ? [pageWidth, pageHeight] : template.page_size as any,
        margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
        bufferPages: true,
        info: {
          Title: report.title,
          Author: report.prepared_by || reportData.surveyor_name || 'GWS Surveyors Ltd',
          Subject: `${template.name} - ${report.report_number}`,
          Creator: 'GWS Platform V2',
          Producer: 'GWS Survey Report Generator',
          CreationDate: new Date(),
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err: Error) => reject(err))

      // ── State for headers/footers ──
      let isFirstPage = true
      let hasCoverPage = false

      // ── Header function ──
      function drawHeader(pageNum: number) {
        if (hasCoverPage && pageNum === 1) return // Skip header on cover page
        if (isFirstPage && !hasCoverPage) return // First page without cover has no header yet

        const headerText = substituteVars(template.header_text || '', reportData)

        doc.save()
        // Header bar
        doc
          .fillColor(rgb)
          .rect(marginLeft, 30, contentWidth, 2)
          .fill()

        // Organization name / logo area
        const logoPos = template.logo_position || 'left'
        const orgName = reportData.organization_name || 'GWS Surveyors Ltd'

        if (logoPos === 'center') {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(rgb)
            .text(orgName, marginLeft, 42, { width: contentWidth, align: 'center' })
        } else if (logoPos === 'right') {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(rgb)
            .text(orgName, marginLeft, 42, { width: contentWidth, align: 'right' })
        } else {
          // Left (default)
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(rgb)
            .text(orgName, marginLeft, 42, { width: contentWidth * 0.5, align: 'left' })

          // Report number on right
          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(report.report_number, marginLeft + contentWidth * 0.5, 42, {
              width: contentWidth * 0.5,
              align: 'right',
            })
        }

        if (headerText) {
          doc
            .fontSize(7)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(headerText, marginLeft, 52, { width: contentWidth, align: 'center' })
        }

        doc
          .fillColor(rgb)
          .rect(marginLeft, 64, contentWidth, 1)
          .fill()

        doc.restore()
      }

      // ── Footer function ──
      function drawFooter(pageNum: number, totalPages: number) {
        if (hasCoverPage && pageNum === 1) return // Skip footer on cover page

        doc.save()
        // Footer line
        doc
          .fillColor('#d1d5db')
          .rect(marginLeft, pageHeight - 55, contentWidth, 0.5)
          .fill()

        // Page number
        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor('#9ca3af')
          .text(
            `Page ${pageNum} of ${totalPages}`,
            marginLeft,
            pageHeight - 48,
            { width: contentWidth, align: 'center' }
          )

        // Date and confidentiality
        const footerText = substituteVars(template.footer_text || '', reportData)
        const dateStr = new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })

        doc
          .fontSize(6)
          .fillColor('#9ca3af')
          .text(dateStr, marginLeft, pageHeight - 38, { width: contentWidth * 0.5, align: 'left' })

        doc
          .fontSize(6)
          .fillColor('#9ca3af')
          .text(
            footerText || 'CONFIDENTIAL - Ministry of Lands, Housing & Urban Development - Republic of Uganda',
            marginLeft + contentWidth * 0.5,
            pageHeight - 38,
            { width: contentWidth * 0.5, align: 'right' }
          )

        doc.restore()
      }

      // ── Helper: ensure space on page ──
      function ensureSpace(needed: number) {
        if (doc.y + needed > pageHeight - marginBottom - 20) {
          doc.addPage()
        }
      }

      // ── Helper: draw section title ──
      function drawSectionTitle(title: string, index: number) {
        ensureSpace(40)
        const y = doc.y
        // Title underline
        doc
          .fillColor(rgb)
          .rect(marginLeft, y + 20, contentWidth, 1.5)
          .fill()

        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .fillColor(rgb)
          .text(`${index + 1}. ${title}`, marginLeft, y, { width: contentWidth })

        doc.moveDown(0.8)
      }

      // ── Helper: draw body text ──
      function drawBodyText(content: string) {
        ensureSpace(30)
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(content, marginLeft, doc.y, {
            width: contentWidth,
            lineGap: 4,
            align: 'justify',
          })
        doc.moveDown(0.5)
      }

      // ── Helper: draw a table ──
      function drawTable(headers: string[], rows: string[][]) {
        const colCount = headers.length
        const colWidth = contentWidth / colCount
        const rowHeight = 24
        const headerHeight = 28

        ensureSpace(headerHeight + rowHeight * Math.min(rows.length, 5) + 10)

        let y = doc.y

        // Table header
        doc
          .fillColor(rgb)
          .rect(marginLeft, y, contentWidth, headerHeight)
          .fill()

        headers.forEach((header, i) => {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(header, marginLeft + i * colWidth + 6, y + 8, {
              width: colWidth - 12,
              align: 'left',
            })
        })

        y += headerHeight

        // Table rows
        rows.forEach((row, rowIdx) => {
          if (y + rowHeight > pageHeight - marginBottom - 20) {
            doc.addPage()
            y = doc.y
            // Redraw header on new page
            doc
              .fillColor(rgb)
              .rect(marginLeft, y, contentWidth, headerHeight)
              .fill()
            headers.forEach((header, i) => {
              doc
                .fontSize(8)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text(header, marginLeft + i * colWidth + 6, y + 8, {
                  width: colWidth - 12,
                  align: 'left',
                })
            })
            y += headerHeight
          }

          // Alternating row bg
          const bgColor = rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff'
          doc
            .fillColor(bgColor)
            .rect(marginLeft, y, contentWidth, rowHeight)
            .fill()

          // Row border
          doc
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .rect(marginLeft, y, contentWidth, rowHeight)
            .stroke()

          row.forEach((cell, i) => {
            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#374151')
              .text(cell, marginLeft + i * colWidth + 6, y + 7, {
                width: colWidth - 12,
                align: 'left',
              })
          })
          y += rowHeight
        })

        doc.y = y + 8
      }

      // ── Helper: draw coordinates table ──
      function drawCoordinatesSection(section: TemplateSection, index: number) {
        drawSectionTitle(section.title, index)

        const content = substituteVars(section.content || '', reportData)
        if (content) {
          drawBodyText(content)
        }

        const coordsList = reportData.coordinates_list || '[Coordinate data to be entered]'
        const coordLines = coordsList.split('\n').filter(l => l.trim())

        if (coordLines.length > 0) {
          // Parse coordinate lines into table
          const headers = ['Point', 'Latitude', 'Longitude', 'Description']
          const rows: string[][] = []

          coordLines.forEach(line => {
            // Format: "Point 1: 0.3475, 32.5825 - Some description"
            const match = line.match(/Point\s+(\d+):\s*([\d.-]+),\s*([\d.-]+)\s*-?\s*(.*)/)
            if (match) {
              rows.push([`PT ${match[1]}`, match[2], match[3], match[4] || '-'])
            } else {
              rows.push(['-', '-', '-', line.trim()])
            }
          })

          drawTable(headers, rows)
        } else {
          // Placeholder box
          ensureSpace(80)
          const y = doc.y
          doc
            .fillColor('#f9fafb')
            .rect(marginLeft, y, contentWidth, 60)
            .fill()
          doc
            .strokeColor('#d1d5db')
            .lineWidth(1)
            .dash(5, { space: 5 })
            .rect(marginLeft, y, contentWidth, 60)
            .stroke()
            .undash()
          doc
            .fontSize(9)
            .fillColor('#9ca3af')
            .text('[Coordinate data to be entered]', marginLeft, y + 25, {
              width: contentWidth,
              align: 'center',
            })
          doc.y = y + 70
        }
      }

      // ── Helper: draw map placeholder ──
      function drawMapPlaceholder(section: TemplateSection, index: number) {
        drawSectionTitle(section.title, index)

        ensureSpace(160)
        const y = doc.y
        const boxHeight = 140

        // Map placeholder box
        doc
          .fillColor('#f0fdf4')
          .rect(marginLeft, y, contentWidth, boxHeight)
          .fill()

        doc
          .strokeColor(rgb)
          .lineWidth(1.5)
          .dash(5, { space: 5 })
          .rect(marginLeft, y, contentWidth, boxHeight)
          .stroke()
          .undash()

        // Map icon placeholder
        doc
          .fontSize(24)
          .fillColor(rgb)
          .text('\u{1F5FA}', marginLeft + contentWidth / 2 - 12, y + 30, {
            width: 24,
            align: 'center',
          })

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(rgb)
          .text('MAP / SPATIAL DATA', marginLeft, y + 65, {
            width: contentWidth,
            align: 'center',
          })

        const content = substituteVars(section.content || '', reportData)
        if (content) {
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(content, marginLeft, y + 85, {
              width: contentWidth,
              align: 'center',
            })
        }

        doc
          .fontSize(7)
          .fillColor('#9ca3af')
          .text(
            'Reference: See attached spatial data file or GIS layer',
            marginLeft,
            y + boxHeight - 20,
            { width: contentWidth, align: 'center' }
          )

        doc.y = y + boxHeight + 12
      }

      // ── Helper: draw signature block ──
      function drawSignatureBlock(section: TemplateSection, index: number) {
        drawSectionTitle(section.title, index)

        const content = substituteVars(section.content || '', reportData)
        if (content) {
          drawBodyText(content)
        }

        const signers = [
          {
            role: 'Prepared by',
            name: report.prepared_by || reportData.surveyor_name || '',
            date: reportData.preparation_date || '',
          },
          {
            role: 'Reviewed by',
            name: report.reviewed_by || '',
            date: report.reviewed_at
              ? new Date(report.reviewed_at).toLocaleDateString('en-GB')
              : '',
          },
          {
            role: 'Approved by',
            name: report.approved_by || '',
            date: report.approved_at
              ? new Date(report.approved_at).toLocaleDateString('en-GB')
              : '',
          },
        ]

        const sigWidth = contentWidth / 3
        const sigGap = 10

        ensureSpace(120)
        let y = doc.y

        signers.forEach((signer, i) => {
          const x = marginLeft + i * sigWidth

          // Role label
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(rgb)
            .text(signer.role, x + sigGap, y, { width: sigWidth - sigGap * 2 })

          // Signature line
          doc
            .strokeColor('#374151')
            .lineWidth(0.5)
            .moveTo(x + sigGap, y + 50)
            .lineTo(x + sigWidth - sigGap, y + 50)
            .stroke()

          // Name
          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(signer.name || '____________________', x + sigGap, y + 55, {
              width: sigWidth - sigGap * 2,
            })

          // Date
          if (signer.date) {
            doc
              .fontSize(7)
              .fillColor('#6b7280')
              .text(`Date: ${signer.date}`, x + sigGap, y + 68, {
                width: sigWidth - sigGap * 2,
              })
          }

          // Stamp area
          doc
            .strokeColor('#d1d5db')
            .lineWidth(0.5)
            .dash(3, { space: 3 })
            .rect(x + sigGap, y + 82, 60, 30)
            .stroke()
            .undash()
          doc
            .fontSize(6)
            .fillColor('#9ca3af')
            .text('[Stamp]', x + sigGap + 15, y + 93, { width: 30, align: 'center' })
        })

        doc.y = y + 120
      }

      // ── Helper: draw certification section ──
      function drawCertificationSection(section: TemplateSection, index: number) {
        ensureSpace(80)
        const content = substituteVars(section.content || '', reportData)

        // Border box
        const y = doc.y

        // Measure text height first
        const textHeight = doc.heightOfString(content, {
          width: contentWidth - 48,
          lineGap: 4,
        })

        const boxHeight = Math.max(textHeight + 60, 80)

        ensureSpace(boxHeight + 10)
        const boxY = doc.y

        // Box background
        doc
          .fillColor('#f0fdf4')
          .rect(marginLeft, boxY, contentWidth, boxHeight)
          .fill()

        // Border
        doc
          .strokeColor(rgb)
          .lineWidth(2)
          .rect(marginLeft, boxY, contentWidth, boxHeight)
          .stroke()

        // Title
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(rgb)
          .text(section.title.toUpperCase(), marginLeft + 24, boxY + 16, {
            width: contentWidth - 48,
            align: 'center',
          })

        // Content
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(content, marginLeft + 24, boxY + 34, {
            width: contentWidth - 48,
            lineGap: 4,
          })

        doc.y = boxY + boxHeight + 12
      }

      // ── Helper: draw land measurements table ──
      function drawMeasurementsSection(section: TemplateSection, index: number) {
        drawSectionTitle(section.title, index)

        const content = substituteVars(section.content || '', reportData)
        if (content) {
          drawBodyText(content)
        }

        // Build measurements table from report data
        const headers = ['Description', 'Value', 'Unit']
        const rows: string[][] = []

        const measurementFields = [
          { key: 'area_hectares', label: 'Total Area', unit: 'Hectares' },
          { key: 'area_sq_meters', label: 'Area (Sq. Meters)', unit: 'm\u00B2' },
          { key: 'perimeter_length', label: 'Perimeter', unit: 'Meters' },
          { key: 'land_value', label: 'Land Value', unit: 'UGX' },
          { key: 'plot_number', label: 'Plot Number', unit: '-' },
          { key: 'block_number', label: 'Block Number', unit: '-' },
        ]

        measurementFields.forEach(field => {
          const value = reportData[field.key]
          if (value) {
            const displayValue =
              field.unit === 'UGX' ? formatUGX(value) : value
            rows.push([field.label, displayValue, field.unit])
          }
        })

        // Always show at least a basic area entry
        if (rows.length === 0) {
          rows.push(
            ['Total Area', reportData.area_hectares || '-', 'Hectares'],
            ['Plot Number', reportData.plot_number || '-', '-'],
            ['District', reportData.district || '-', '-']
          )
        }

        drawTable(headers, rows)
      }

      // ── Helper: draw list section ──
      function drawListSection(section: TemplateSection, index: number) {
        drawSectionTitle(section.title, index)

        const content = substituteVars(section.content || '', reportData)
        const items = content.split('\n').filter(l => l.trim())

        items.forEach(item => {
          ensureSpace(20)
          // Bullet point
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor(rgb)
            .text('\u2022', marginLeft + 8, doc.y, { continued: false })

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#1f2937')
            .text(item.trim().replace(/^[-*]\s*/, ''), marginLeft + 22, doc.y - 14, {
              width: contentWidth - 30,
              lineGap: 3,
            })
          doc.moveDown(0.2)
        })

        doc.moveDown(0.3)
      }

      // ── Helper: draw cover page ──
      function drawCoverPage() {
        hasCoverPage = true

        // Background accent bar at top
        doc
          .fillColor(rgb)
          .rect(0, 0, pageWidth, 8)
          .fill()

        // Logo area
        const logoY = 180
        doc
          .fillColor(rgb)
          .rect(pageWidth / 2 - 35, logoY, 70, 70)
          .fill()

        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('GWS', pageWidth / 2 - 35, logoY + 18, {
            width: 70,
            align: 'center',
          })

        // Report type badge
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(rgb)
          .text(
            template.report_type.toUpperCase() + ' SURVEY REPORT',
            marginLeft,
            logoY + 90,
            { width: contentWidth, align: 'center' }
          )

        // Title
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .fillColor(rgb)
          .text(template.name, marginLeft, logoY + 115, {
            width: contentWidth,
            align: 'center',
          })

        // Decorative line
        doc
          .fillColor(rgb)
          .rect(pageWidth / 2 - 30, logoY + 148, 60, 3)
          .fill()

        // Cover content from section
        const coverSection = sections.find(s => s.type === 'cover')
        if (coverSection) {
          const content = substituteVars(coverSection.content || '', reportData)
          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#374151')
            .text(content, marginLeft + 40, logoY + 170, {
              width: contentWidth - 80,
              align: 'center',
              lineGap: 5,
            })
        }

        // Bottom info
        const bottomY = pageHeight - 200
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .moveTo(marginLeft + 60, bottomY)
          .lineTo(pageWidth - marginRight - 60, bottomY)
          .stroke()

        const orgName = reportData.organization_name || 'GWS Surveyors Ltd'
        const prepDate =
          reportData.preparation_date ||
          new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Prepared by: ${orgName}`, marginLeft, bottomY + 16, {
            width: contentWidth,
            align: 'center',
          })

        doc
          .fontSize(10)
          .text(`Date: ${prepDate}`, marginLeft, bottomY + 32, {
            width: contentWidth,
            align: 'center',
          })

        doc
          .fontSize(9)
          .text(
            `Report No: ${report.report_number}`,
            marginLeft,
            bottomY + 48,
            { width: contentWidth, align: 'center' }
          )

        // Bottom accent bar
        doc
          .fillColor(rgb)
          .rect(0, pageHeight - 8, pageWidth, 8)
          .fill()

        // New page after cover
        doc.addPage()
      }

      // ══════════════════════════════════════
      // ── BUILD THE PDF DOCUMENT ──
      // ══════════════════════════════════════

      // Check if there's a cover section
      const coverSection = sections.find(s => s.type === 'cover')
      if (coverSection) {
        drawCoverPage()
      }

      // Process each section
      sections.forEach((section, index) => {
        switch (section.type) {
          case 'cover':
            // Already handled above
            break

          case 'certification':
            drawCertificationSection(section, index)
            break

          case 'coordinates':
            drawCoordinatesSection(section, index)
            break

          case 'map_placeholder':
          case 'image':
            drawMapPlaceholder(section, index)
            break

          case 'signature':
            drawSignatureBlock(section, index)
            break

          case 'table':
          case 'measurements':
            drawMeasurementsSection(section, index)
            break

          case 'list':
            drawListSection(section, index)
            break

          default:
            // Standard text section
            drawSectionTitle(section.title, index)
            const content = substituteVars(section.content || '', reportData)
            drawBodyText(content)
            break
        }

        doc.moveDown(0.5)
      })

      // ── Add headers and footers to all pages ──
      const totalPages = doc.bufferedPageRange().count
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i)
        drawHeader(i + 1)
        drawFooter(i + 1, totalPages)
      }

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
