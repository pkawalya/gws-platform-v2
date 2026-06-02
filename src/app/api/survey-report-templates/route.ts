import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

// Default templates to seed
const DEFAULT_TEMPLATES = [
  {
    name: 'Cadastral Survey Report',
    slug: 'cadastral-survey-report',
    description: 'Standard cadastral survey report for land boundary determination and property registration in Uganda. Complies with the Survey Act and Land Act requirements.',
    report_type: 'cadastral',
    category: 'survey',
    sections: [
      { id: 's1', title: 'Cover Page', type: 'cover', content: 'Cadastral Survey Report\n{{project_title}}\n{{district}}, {{sub_county}}, {{parish}}, {{village}}', fields: [], required: true },
      { id: 's2', title: 'Executive Summary', type: 'text', content: 'This report presents the findings of a cadastral survey conducted on {{survey_date}} for {{client_name}} (Ref: {{client_ref}}). The survey covers approximately {{area_hectares}} hectares of land situated at {{village}}, {{parish}}, {{sub_county}}, {{district}}.', fields: [], required: true },
      { id: 's3', title: 'Property Description', type: 'text', content: 'The subject property is located at {{village}}, {{parish}} Sub-county, {{district}} District, Uganda. The land is described as follows:\n\nLand Reference: {{project_ref}}\nApproximate Area: {{area_hectares}} Hectares\nCurrent Land Use: [To be completed]\nTitle Reference: [To be completed]', fields: [], required: true },
      { id: 's4', title: 'Survey Methodology', type: 'text', content: 'The survey was carried out using the following methodology and equipment:\n\n1. Control Survey: Establishment of survey control points using GNSS/GPS receivers\n2. Detail Survey: Measurement of boundary features using Total Station\n3. Data Processing: Computation and adjustment of survey observations\n4. Boundary Determination: Verification of boundary beacons and marks\n\nEquipment Used: [To be completed]\nDatum: WGS84 / UTM Zone 36N', fields: [], required: true },
      { id: 's5', title: 'Boundary Description', type: 'text', content: 'The boundaries of the subject property are described as follows:\n\nNorth: [Boundary description]\nEast: [Boundary description]\nSouth: [Boundary description]\nWest: [Boundary description]\n\n{{beacons_list}}', fields: [], required: true },
      { id: 's6', title: 'Coordinates & Beacons', type: 'coordinates', content: 'The following coordinates define the boundary of the subject property:', fields: ['point', 'northing', 'easting', 'beacon_type', 'description'], required: true },
      { id: 's7', title: 'Area Computation', type: 'table', content: 'The area of the subject property has been computed from the surveyed coordinates as follows:\n\nTotal Area: {{area_hectares}} Hectares\nComputation Method: Coordinate Geometry (Area by coordinates)\nPerimeter: [To be computed]', fields: [], required: true },
      { id: 's8', title: 'Sketch Plan', type: 'image', content: '[Survey sketch plan to be attached showing the boundary, beacons, and adjoining properties]', fields: [], required: false },
      { id: 's9', title: 'Recommendations', type: 'text', content: 'Based on the survey findings, the following recommendations are made:\n\n1. The surveyed boundaries should be confirmed and accepted for registration purposes\n2. Boundary beacons should be maintained and protected\n3. Any encroachments identified should be resolved through the appropriate legal channels\n4. A title deed should be processed based on the surveyed area', fields: [], required: false },
      { id: 's10', title: 'Certification', type: 'certification', content: 'I hereby certify that this survey was carried out under my direct supervision and that the information contained in this report is true and accurate to the best of my knowledge and belief.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}', fields: [], required: true },
    ],
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'text', source: 'client', default: '' },
      { key: 'client_ref', label: 'Client Reference', type: 'text', source: 'client', default: '' },
      { key: 'project_ref', label: 'Project Reference', type: 'text', source: 'project', default: '' },
      { key: 'project_title', label: 'Project Title', type: 'text', source: 'project', default: '' },
      { key: 'district', label: 'District', type: 'text', source: 'project', default: '' },
      { key: 'sub_county', label: 'Sub-County', type: 'text', source: 'project', default: '' },
      { key: 'parish', label: 'Parish', type: 'text', source: 'project', default: '' },
      { key: 'village', label: 'Village', type: 'text', source: 'project', default: '' },
      { key: 'area_hectares', label: 'Area (Hectares)', type: 'number', source: 'project', default: '' },
      { key: 'survey_date', label: 'Survey Date', type: 'date', source: 'manual', default: '' },
      { key: 'surveyor_name', label: 'Surveyor Name', type: 'text', source: 'manual', default: '' },
      { key: 'surveyor_license', label: 'Surveyor License No.', type: 'text', source: 'manual', default: '' },
      { key: 'organization_name', label: 'Organization Name', type: 'text', source: 'manual', default: 'GWS Surveyors Ltd' },
      { key: 'coordinates_list', label: 'Coordinates List', type: 'text', source: 'project', default: '' },
      { key: 'beacons_list', label: 'Beacons Description', type: 'text', source: 'project', default: '' },
      { key: 'preparation_date', label: 'Preparation Date', type: 'date', source: 'manual', default: '' },
    ],
    header_text: 'CADASTRAL SURVEY REPORT — {{project_ref}}',
    footer_text: 'Confidential — Prepared by {{organization_name}} — {{preparation_date}}',
    logo_position: 'left',
    primary_color: '#059669',
    is_default: true,
  },
  {
    name: 'Topographic Survey Report',
    slug: 'topographic-survey-report',
    description: 'Comprehensive topographic survey report for engineering design, site planning, and development projects. Includes contour mapping and feature surveys.',
    report_type: 'topographic',
    category: 'survey',
    sections: [
      { id: 's1', title: 'Cover Page', type: 'cover', content: 'Topographic Survey Report\n{{project_title}}\n{{district}}, Uganda', fields: [], required: true },
      { id: 's2', title: 'Project Overview', type: 'text', content: 'This topographic survey was commissioned by {{client_name}} (Ref: {{client_ref}}) for the purpose of {{project_title}}. The survey was conducted on {{survey_date}} covering an area of approximately {{area_hectares}} hectares.', fields: [], required: true },
      { id: 's3', title: 'Site Description', type: 'text', content: 'The survey site is located at {{village}}, {{parish}}, {{sub_county}}, {{district}} District, Uganda.\n\nGeneral Description: [To be completed]\nAccess: [To be completed]\nVegetation: [To be completed]\nTerrain: [To be completed]', fields: [], required: true },
      { id: 's4', title: 'Control Survey', type: 'text', content: 'The following control points were established or used for this survey:\n\n[Control point table to be completed]\n\nDatum: WGS84\nProjection: UTM Zone 36N\nVertical Datum: Mean Sea Level (MSL)', fields: [], required: true },
      { id: 's5', title: 'Topographic Features', type: 'text', content: 'The following topographic features were surveyed and mapped:\n\n1. Natural Features: [Rivers, hills, valleys, etc.]\n2. Man-made Features: [Buildings, roads, fences, etc.]\n3. Vegetation: [Trees, bushes, cultivated areas]\n4. Water Features: [Streams, ponds, drainage channels]', fields: [], required: true },
      { id: 's6', title: 'Contour Information', type: 'text', content: 'Contour Interval: [To be specified] meters\nRange of Elevations:\n- Minimum: [To be completed] m\n- Maximum: [To be completed] m\n\nDigital Terrain Model (DTM) has been generated from the survey data.', fields: [], required: true },
      { id: 's7', title: 'Utilities & Infrastructure', type: 'text', content: 'The following utilities and infrastructure were identified within the survey area:\n\n1. Electricity: [Power lines, transformers]\n2. Water Supply: [Pipes, hydrants]\n3. Sewerage: [Sewer lines, manholes]\n4. Telecommunications: [Cables, poles]\n5. Roads: [Type, condition, width]', fields: [], required: false },
      { id: 's8', title: 'Deliverables', type: 'text', content: 'The following deliverables are provided as part of this survey:\n\n1. Topographic Survey Plan (Scale 1:1000 / 1:2000)\n2. Digital Terrain Model\n3. Contour Plan\n4. Coordinate Schedule\n5. Digital Data (AutoCAD / GIS formats)', fields: [], required: true },
      { id: 's9', title: 'Certification', type: 'certification', content: 'I hereby certify that this topographic survey was carried out under my direct supervision in accordance with the Survey Act and relevant regulations.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}', fields: [], required: true },
    ],
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'text', source: 'client', default: '' },
      { key: 'client_ref', label: 'Client Reference', type: 'text', source: 'client', default: '' },
      { key: 'project_ref', label: 'Project Reference', type: 'text', source: 'project', default: '' },
      { key: 'project_title', label: 'Project Title', type: 'text', source: 'project', default: '' },
      { key: 'district', label: 'District', type: 'text', source: 'project', default: '' },
      { key: 'sub_county', label: 'Sub-County', type: 'text', source: 'project', default: '' },
      { key: 'parish', label: 'Parish', type: 'text', source: 'project', default: '' },
      { key: 'village', label: 'Village', type: 'text', source: 'project', default: '' },
      { key: 'area_hectares', label: 'Area (Hectares)', type: 'number', source: 'project', default: '' },
      { key: 'survey_date', label: 'Survey Date', type: 'date', source: 'manual', default: '' },
      { key: 'surveyor_name', label: 'Surveyor Name', type: 'text', source: 'manual', default: '' },
      { key: 'surveyor_license', label: 'Surveyor License No.', type: 'text', source: 'manual', default: '' },
      { key: 'organization_name', label: 'Organization Name', type: 'text', source: 'manual', default: 'GWS Surveyors Ltd' },
      { key: 'preparation_date', label: 'Preparation Date', type: 'date', source: 'manual', default: '' },
    ],
    header_text: 'TOPOGRAPHIC SURVEY REPORT — {{project_ref}}',
    footer_text: 'Confidential — Prepared by {{organization_name}} — {{preparation_date}}',
    logo_position: 'left',
    primary_color: '#0284c7',
    is_default: true,
  },
  {
    name: 'Boundary Dispute Report',
    slug: 'boundary-dispute-report',
    description: 'Professional boundary dispute resolution report for contested land boundaries. Suitable for legal proceedings and mediation in Uganda.',
    report_type: 'boundary',
    category: 'compliance',
    sections: [
      { id: 's1', title: 'Cover Page', type: 'cover', content: 'Boundary Dispute Investigation Report\n{{project_title}}\n{{district}}, Uganda', fields: [], required: true },
      { id: 's2', title: 'Background', type: 'text', content: 'This report has been prepared following a boundary dispute between the parties regarding land situated at {{village}}, {{parish}}, {{sub_county}}, {{district}} District.\n\nThe dispute was referred to the surveyor for professional determination of the correct boundary position based on available evidence and field investigation.', fields: [], required: true },
      { id: 's3', title: 'Claimant Details', type: 'text', content: 'Claimant: {{client_name}} (Ref: {{client_ref}})\n\nRespondent: [To be completed]\n\nProperty in Dispute: {{project_title}}\nApproximate Area: {{area_hectares}} Hectares\nLocation: {{village}}, {{parish}}, {{sub_county}}, {{district}}', fields: [], required: true },
      { id: 's4', title: 'Disputed Area Description', type: 'text', content: 'The disputed area is described as follows:\n\n[Detailed description of the disputed boundary and area]\n\nCurrent occupation and use of the disputed area: [To be completed]', fields: [], required: true },
      { id: 's5', title: 'Evidence Review', type: 'text', content: 'The following evidence was examined as part of this investigation:\n\n1. Title Documents: [To be listed]\n2. Survey Plans: [To be listed]\n3. Physical Evidence: Beacons, marks, fences, walls\n4. Oral Evidence: Testimony from adjacent landowners\n5. Historical Records: [To be listed]\n\nSummary of Evidence Findings: [To be completed]', fields: [], required: true },
      { id: 's6', title: 'Survey Findings', type: 'text', content: 'A resurvey of the disputed boundary was carried out on {{survey_date}}. The findings are as follows:\n\n1. Original boundary beacons: [Found/Not found]\n2. Current boundary markers: [Description]\n3. Encroachment identified: [Yes/No, details]\n4. Area discrepancy: [To be computed]\n\n{{coordinates_list}}\n\n{{beacons_list}}', fields: [], required: true },
      { id: 's7', title: 'Boundary Determination', type: 'text', content: 'Based on the evidence reviewed and the survey findings, the boundary between the disputed properties is determined as follows:\n\n[Detailed boundary determination]\n\nThe determined boundary is shown on the accompanying plan and defined by the following coordinates:', fields: [], required: true },
      { id: 's8', title: 'Recommendations', type: 'text', content: 'The following recommendations are made:\n\n1. The determined boundary should be accepted and demarcated with permanent beacons\n2. Both parties should sign a boundary agreement\n3. The determined boundary should be registered with the relevant land office\n4. Any encroachments should be addressed through mediation or legal channels', fields: [], required: false },
      { id: 's9', title: 'Professional Opinion', type: 'certification', content: 'In my professional opinion, based on the evidence examined and the survey conducted, the boundary between the properties is as described in Section 7 of this report.\n\nSigned: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\nFor and on behalf of {{organization_name}}', fields: [], required: true },
    ],
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'text', source: 'client', default: '' },
      { key: 'client_ref', label: 'Client Reference', type: 'text', source: 'client', default: '' },
      { key: 'project_ref', label: 'Project Reference', type: 'text', source: 'project', default: '' },
      { key: 'project_title', label: 'Project Title', type: 'text', source: 'project', default: '' },
      { key: 'district', label: 'District', type: 'text', source: 'project', default: '' },
      { key: 'sub_county', label: 'Sub-County', type: 'text', source: 'project', default: '' },
      { key: 'parish', label: 'Parish', type: 'text', source: 'project', default: '' },
      { key: 'village', label: 'Village', type: 'text', source: 'project', default: '' },
      { key: 'area_hectares', label: 'Area (Hectares)', type: 'number', source: 'project', default: '' },
      { key: 'survey_date', label: 'Survey Date', type: 'date', source: 'manual', default: '' },
      { key: 'surveyor_name', label: 'Surveyor Name', type: 'text', source: 'manual', default: '' },
      { key: 'surveyor_license', label: 'Surveyor License No.', type: 'text', source: 'manual', default: '' },
      { key: 'organization_name', label: 'Organization Name', type: 'text', source: 'manual', default: 'GWS Surveyors Ltd' },
      { key: 'coordinates_list', label: 'Coordinates List', type: 'text', source: 'project', default: '' },
      { key: 'beacons_list', label: 'Beacons Description', type: 'text', source: 'project', default: '' },
      { key: 'preparation_date', label: 'Preparation Date', type: 'date', source: 'manual', default: '' },
    ],
    header_text: 'BOUNDARY DISPUTE REPORT — {{project_ref}}',
    footer_text: 'Confidential — Legal Document — Prepared by {{organization_name}}',
    logo_position: 'left',
    primary_color: '#dc2626',
    is_default: true,
  },
  {
    name: 'General Survey Inspection',
    slug: 'general-survey-inspection',
    description: 'Quick inspection report template for site visits, property assessments, and general survey observations. Ideal for rapid field reporting.',
    report_type: 'general',
    category: 'inspection',
    sections: [
      { id: 's1', title: 'Cover Page', type: 'cover', content: 'Survey Inspection Report\n{{project_title}}\n{{district}}, Uganda', fields: [], required: true },
      { id: 's2', title: 'Inspection Details', type: 'text', content: 'Date of Inspection: {{survey_date}}\nInspector: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nClient: {{client_name}} (Ref: {{client_ref}})\nProject Ref: {{project_ref}}\nPurpose: [To be completed]', fields: [], required: true },
      { id: 's3', title: 'Property Details', type: 'text', content: 'Location: {{village}}, {{parish}}, {{sub_county}}, {{district}}\nArea: {{area_hectares}} Hectares\nCurrent Use: [To be completed]\nLand Title: [To be completed]\nAdjacent Properties: [To be listed]', fields: [], required: true },
      { id: 's4', title: 'Observations', type: 'text', content: 'The following observations were made during the site inspection:\n\n1. Boundary Status: [Intact/Disputed/Unknown]\n2. Beacon Condition: [Good/Fair/Poor/Missing]\n3. Encroachments: [None observed/Details]\n4. Access Roads: [Description]\n5. Utilities: [Available/Not available]\n6. Topography: [Flat/Gentle slope/Steep]\n7. Vegetation: [Description]\n8. Drainage: [Description]', fields: [], required: true },
      { id: 's5', title: 'Findings', type: 'text', content: 'Key findings from the inspection:\n\n[Finding 1]\n[Finding 2]\n[Finding 3]\n\nAreas of concern: [To be completed]', fields: [], required: true },
      { id: 's6', title: 'Photographs', type: 'image', content: '[Site photographs to be attached with captions and location references]', fields: [], required: false },
      { id: 's7', title: 'Conclusion', type: 'text', content: 'Based on the inspection carried out on {{survey_date}}, the following conclusions are drawn:\n\n[Conclusion summary]\n\nFurther action required: [Yes/No — details]', fields: [], required: true },
      { id: 's8', title: 'Sign-off', type: 'certification', content: 'I confirm that the inspection was carried out as described above and the observations are accurate.\n\nInspector: ________________________\nName: {{surveyor_name}}\nLicense No: {{surveyor_license}}\nDate: {{preparation_date}}\n\n{{organization_name}}', fields: [], required: true },
    ],
    variables: [
      { key: 'client_name', label: 'Client Name', type: 'text', source: 'client', default: '' },
      { key: 'client_ref', label: 'Client Reference', type: 'text', source: 'client', default: '' },
      { key: 'project_ref', label: 'Project Reference', type: 'text', source: 'project', default: '' },
      { key: 'project_title', label: 'Project Title', type: 'text', source: 'project', default: '' },
      { key: 'district', label: 'District', type: 'text', source: 'project', default: '' },
      { key: 'sub_county', label: 'Sub-County', type: 'text', source: 'project', default: '' },
      { key: 'parish', label: 'Parish', type: 'text', source: 'project', default: '' },
      { key: 'village', label: 'Village', type: 'text', source: 'project', default: '' },
      { key: 'area_hectares', label: 'Area (Hectares)', type: 'number', source: 'project', default: '' },
      { key: 'survey_date', label: 'Survey Date', type: 'date', source: 'manual', default: '' },
      { key: 'surveyor_name', label: 'Surveyor Name', type: 'text', source: 'manual', default: '' },
      { key: 'surveyor_license', label: 'Surveyor License No.', type: 'text', source: 'manual', default: '' },
      { key: 'organization_name', label: 'Organization Name', type: 'text', source: 'manual', default: 'GWS Surveyors Ltd' },
      { key: 'preparation_date', label: 'Preparation Date', type: 'date', source: 'manual', default: '' },
    ],
    header_text: 'SURVEY INSPECTION REPORT — {{project_ref}}',
    footer_text: 'Prepared by {{organization_name}} — {{preparation_date}}',
    logo_position: 'left',
    primary_color: '#d97706',
    is_default: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const report_type = searchParams.get('report_type')
    const category = searchParams.get('category')
    const is_active = searchParams.get('is_active')

    const where: Record<string, unknown> = {}
    if (report_type) where.report_type = report_type
    if (category) where.category = category
    if (is_active !== null && is_active !== undefined) where.is_active = is_active === 'true'

    let templates = await db.surveyReportTemplate.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { reports: true } } },
    })

    // Seed default templates if none exist
    if (templates.length === 0) {
      for (const tpl of DEFAULT_TEMPLATES) {
        await db.surveyReportTemplate.create({ data: tpl as any })
      }
      templates = await db.surveyReportTemplate.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: { _count: { select: { reports: true } } },
      })
    }

    return NextResponse.json(serialize(templates))
  } catch (error) {
    console.error('Survey report templates API error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, report_type, category, sections, variables, header_text, footer_text, logo_position, page_size, orientation, font_family, primary_color, is_active, is_default } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const template = await db.surveyReportTemplate.create({
      data: {
        name,
        slug,
        description: description || null,
        report_type: report_type || 'general',
        category: category || 'survey',
        sections: sections || [],
        variables: variables || null,
        header_text: header_text || null,
        footer_text: footer_text || null,
        logo_position: logo_position || 'left',
        page_size: page_size || 'A4',
        orientation: orientation || 'portrait',
        font_family: font_family || 'Inter',
        primary_color: primary_color || '#059669',
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default || false,
      },
    })

    return NextResponse.json(serialize(template), { status: 201 })
  } catch (error: any) {
    console.error('Create template error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A template with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
