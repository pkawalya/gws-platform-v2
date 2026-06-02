'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  FileText, FileCheck, Download, Printer, Plus, Pencil, Eye, Clock, Zap,
  MapPin, Mountain, Scale, ClipboardCheck, ChevronRight, CheckCircle2,
  Loader2, Trash2, ArrowRight, X, GripVertical, FileDown,
} from 'lucide-react'
import { ReportPreview } from '@/components/platform/report-preview'
import type { ClientRecord, ProjectRecord } from '@/components/platform/types'

// ── Types ──
interface TemplateSection {
  id: string
  title: string
  type: string
  content: string
  fields: string[]
  required: boolean
}

interface TemplateVariable {
  key: string
  label: string
  type: string
  source: string
  default: string
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
  variables: TemplateVariable[] | null
  page_size: string
  orientation: string
  font_family: string
  primary_color: string
  is_active: boolean
  is_default: boolean
  version: number
  _count?: { reports: number }
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
  template: { name: string; report_type: string; primary_color: string }
}

interface SurveyReportsPageProps {
  clients: ClientRecord[]
  projects: ProjectRecord[]
  onToast: (type: 'success' | 'error', message: string) => void
  onRefresh: () => void
}

// ── Icon map for report types ──
const REPORT_TYPE_ICONS: Record<string, any> = {
  cadastral: MapPin,
  topographic: Mountain,
  boundary: Scale,
  engineering: FileText,
  general: ClipboardCheck,
}

const REPORT_TYPE_COLORS: Record<string, string> = {
  cadastral: '#059669',
  topographic: '#0284c7',
  boundary: '#dc2626',
  engineering: '#7c3aed',
  general: '#d97706',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100' },
  review: { label: 'Review', color: 'text-amber-600', bg: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  delivered: { label: 'Delivered', color: 'text-blue-600', bg: 'bg-blue-100' },
}

// ── Main Component ──
export function SurveyReportsPage({ clients, projects, onToast, onRefresh }: SurveyReportsPageProps) {
  const [templates, setTemplates] = useState<SurveyReportTemplate[]>([])
  const [reports, setReports] = useState<SurveyReport[]>([])
  const [loading, setLoading] = useState(true)

  // Generate tab state
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyReportTemplate | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [reportData, setReportData] = useState<Record<string, string>>({})
  const [generateStep, setGenerateStep] = useState(1)
  const [previewHtml, setPreviewHtml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<SurveyReport | null>(null)
  const [generationTime, setGenerationTime] = useState(0)

  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState<SurveyReportTemplate | null>(null)
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)

  // Report viewer state
  const [viewingReport, setViewingReport] = useState<SurveyReport | null>(null)
  const [reportViewerOpen, setReportViewerOpen] = useState(false)
  const [reportPreviewHtml, setReportPreviewHtml] = useState('')
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/survey-report-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (e) {
      console.error('Failed to fetch templates:', e)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/survey-reports')
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (e) {
      console.error('Failed to fetch reports:', e)
    }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await Promise.all([fetchTemplates(), fetchReports()])
      setLoading(false)
    }
    load()
  }, [fetchTemplates, fetchReports])

  // ── Generate report flow ──
  const handleSelectTemplate = (template: SurveyReportTemplate) => {
    setSelectedTemplate(template)
    setGenerateStep(2)

    // Initialize report data with defaults
    const defaults: Record<string, string> = {}
    const vars = template.variables || []
    for (const v of vars) {
      defaults[v.key] = v.default || ''
    }
    setReportData(defaults)
  }

  const handleSelectProject = async (projectId: string) => {
    setSelectedProjectId(projectId)
    if (!projectId || !selectedTemplate) return

    // Fetch project data and auto-fill
    try {
      const res = await fetch(`/api/survey-reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          project_id: projectId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setReportData(data.data)
        setPreviewHtml(data.generated_content)
      }
    } catch (e) {
      console.error('Auto-fill error:', e)
    }

    setGenerateStep(3)
  }

  const handleDataChange = (key: string, value: string) => {
    setReportData(prev => ({ ...prev, [key]: value }))
  }

  const handlePreview = async () => {
    if (!selectedTemplate) return

    try {
      const res = await fetch('/api/survey-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          project_id: selectedProjectId || undefined,
          custom_data: reportData,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewHtml(data.generated_content)
        setGenerateStep(4)
      }
    } catch (e) {
      console.error('Preview error:', e)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return
    setGenerating(true)
    const startTime = Date.now()

    try {
      // Create the report
      const res = await fetch('/api/survey-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          project_id: selectedProjectId || undefined,
          title: `${selectedTemplate.name} - ${reportData.project_ref || 'Manual'}`,
          data: reportData,
          prepared_by: reportData.surveyor_name || null,
        }),
      })

      if (res.ok) {
        const report = await res.json()
        setGeneratedReport(report)
        setGenerationTime(((Date.now() - startTime) / 1000))

        // Save the generated content
        await fetch(`/api/survey-reports/${report.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generated_content: previewHtml }),
        })

        onToast('success', `Report ${report.report_number} generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
        await fetchReports()
      } else {
        onToast('error', 'Failed to generate report')
      }
    } catch (e) {
      console.error('Generate error:', e)
      onToast('error', 'Failed to generate report')
    }

    setGenerating(false)
  }

  const resetGenerateFlow = () => {
    setSelectedTemplate(null)
    setSelectedProjectId('')
    setReportData({})
    setGenerateStep(1)
    setPreviewHtml('')
    setGeneratedReport(null)
    setGenerationTime(0)
  }

  // ── Template CRUD ──
  const handleSaveTemplate = async (template: Partial<SurveyReportTemplate>) => {
    try {
      if (template.id) {
        const res = await fetch(`/api/survey-report-templates/${template.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        })
        if (res.ok) {
          onToast('success', 'Template updated')
        }
      } else {
        const res = await fetch('/api/survey-report-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        })
        if (res.ok) {
          onToast('success', 'Template created')
        }
      }
      await fetchTemplates()
      setTemplateEditorOpen(false)
      setEditingTemplate(null)
    } catch (e) {
      onToast('error', 'Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/survey-report-templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onToast('success', 'Template deleted')
        await fetchTemplates()
      }
    } catch (e) {
      onToast('error', 'Failed to delete template')
    }
  }

  // ── Report actions ──
  const handleViewReport = async (report: SurveyReport) => {
    setViewingReport(report)
    setReportViewerOpen(true)

    // Fetch the full report with generated content
    try {
      const res = await fetch(`/api/survey-reports/${report.id}/pdf`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setReportPreviewHtml(data.html)
      }
    } catch (e) {
      console.error('Failed to load report:', e)
    }
  }

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/survey-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        onToast('success', `Report status updated to ${newStatus}`)
        await fetchReports()
        // Update viewing report if it's the same
        if (viewingReport?.id === reportId) {
          const updated = await res.json()
          setViewingReport(updated)
        }
      }
    } catch (e) {
      onToast('error', 'Failed to update report status')
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Delete this report? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/survey-reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onToast('success', 'Report deleted')
        await fetchReports()
        setReportViewerOpen(false)
      }
    } catch (e) {
      onToast('error', 'Failed to delete report')
    }
  }

  const handleUpdateReportData = async () => {
    if (!viewingReport) return
    try {
      const res = await fetch(`/api/survey-reports/${viewingReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: viewingReport.data }),
      })
      if (res.ok) {
        onToast('success', 'Report data updated')
        await fetchReports()
      }
    } catch (e) {
      onToast('error', 'Failed to update report')
    }
  }

  const handleDownloadPdf = async (reportId: string, reportNumber: string) => {
    setPdfGeneratingId(reportId)
    try {
      const res = await fetch(`/api/survey-reports/${reportId}/pdf`, { method: 'GET' })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `survey-report-${reportNumber}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        onToast('success', `PDF downloaded: survey-report-${reportNumber}.pdf`)
      } else {
        onToast('error', 'Failed to generate PDF')
      }
    } catch (e) {
      console.error('PDF download error:', e)
      onToast('error', 'Failed to download PDF')
    } finally {
      setPdfGeneratingId(null)
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Survey Reports</h2>
          <p className="text-muted-foreground text-sm">Generate professional survey reports in under 1 minute</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3" /> {reports.length} Reports
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" /> {templates.length} Templates
          </Badge>
        </div>
      </div>

      {/* Three-tab layout */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Zap className="w-4 h-4" /> Generate Report
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="w-4 h-4" /> Report Templates
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileCheck className="w-4 h-4" /> Generated Reports
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: Generate Report ═══════ */}
        <TabsContent value="generate">
          {generatedReport ? (
            /* Success state */
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Report Generated!</h3>
                <p className="text-muted-foreground mb-1">
                  Report <strong>{generatedReport.report_number}</strong> has been created
                </p>
                <p className="text-sm text-emerald-600 mb-6">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Generated in {generationTime.toFixed(1)} seconds
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    onClick={() => handleViewReport(generatedReport)}
                    className="gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> View Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPdf(generatedReport.id, generatedReport.report_number)}
                    disabled={pdfGeneratingId === generatedReport.id}
                    className="gap-1.5"
                  >
                    {pdfGeneratingId === generatedReport.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                    ) : (
                      <><FileDown className="w-4 h-4" /> Download PDF</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([previewHtml], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `survey-report-${generatedReport.report_number}.html`
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="gap-1.5"
                  >
                    <Download className="w-4 h-4" /> HTML
                  </Button>
                  <Button variant="outline" onClick={resetGenerateFlow} className="gap-1.5">
                    <Plus className="w-4 h-4" /> New Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      generateStep >= step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {generateStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`w-12 h-0.5 ${generateStep > step ? 'bg-emerald-600' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
                <span className="ml-3 text-sm text-muted-foreground">
                  {generateStep === 1 && 'Select Report Type'}
                  {generateStep === 2 && 'Select Project'}
                  {generateStep === 3 && 'Review & Edit Data'}
                  {generateStep === 4 && 'Preview & Generate'}
                </span>
              </div>

              {/* Step 1: Select template */}
              {generateStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {templates.map(template => {
                    const Icon = REPORT_TYPE_ICONS[template.report_type] || FileText
                    const color = REPORT_TYPE_COLORS[template.report_type] || '#059669'
                    return (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-700 group"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${color}15`, color }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px]">{template.report_type}</Badge>
                          </div>
                          <CardTitle className="text-sm mt-2 group-hover:text-emerald-600 transition-colors">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{(template.sections as any[])?.length || 0} sections</span>
                            <span>v{template.version}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Step 2: Select Project */}
              {generateStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Project</CardTitle>
                    <CardDescription>Choose a project to auto-fill client and location data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Button variant="ghost" size="sm" onClick={() => setGenerateStep(1)}>
                        ← Back
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Template: <strong>{selectedTemplate?.name}</strong>
                      </span>
                    </div>
                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                      <Button
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => {
                          setSelectedProjectId('')
                          setGenerateStep(3)
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium">Skip - Enter data manually</div>
                          <div className="text-xs text-muted-foreground">No project selected, fill all fields manually</div>
                        </div>
                      </Button>
                      {projects.map(project => {
                        const clientName = project.client?.client_type === 'company'
                          ? project.client?.company_name
                          : [project.client?.first_name, project.client?.last_name].filter(Boolean).join(' ')
                        return (
                          <Button
                            key={project.id}
                            variant="outline"
                            className="justify-start h-auto py-3 px-4"
                            onClick={() => handleSelectProject(String(project.id))}
                          >
                            <div className="text-left">
                              <div className="font-medium">{project.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {project.project_ref} • {clientName || 'No client'} • {project.district || 'No district'}
                              </div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Review & Edit Data */}
              {generateStep === 3 && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report Data</CardTitle>
                      <CardDescription>Review and edit the data that will be used in the report</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setGenerateStep(2)}>
                          ← Back
                        </Button>
                      </div>
                      <ScrollArea className="max-h-[500px]">
                        <div className="grid gap-4 pr-4">
                          {(selectedTemplate?.variables || []).map(variable => (
                            <div key={variable.key} className="space-y-1.5">
                              <Label className="text-sm flex items-center gap-2">
                                {variable.label}
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {variable.source}
                                </Badge>
                              </Label>
                              {variable.type === 'date' ? (
                                <Input
                                  type="date"
                                  value={reportData[variable.key] || ''}
                                  onChange={e => handleDataChange(variable.key, e.target.value)}
                                />
                              ) : variable.type === 'number' ? (
                                <Input
                                  type="number"
                                  value={reportData[variable.key] || ''}
                                  onChange={e => handleDataChange(variable.key, e.target.value)}
                                  step="0.01"
                                />
                              ) : (
                                <Input
                                  value={reportData[variable.key] || ''}
                                  onChange={e => handleDataChange(variable.key, e.target.value)}
                                  placeholder={`Enter ${variable.label.toLowerCase()}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Sections</CardTitle>
                      <CardDescription>Sections that will appear in the report</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[500px]">
                        <div className="space-y-2 pr-4">
                          {(selectedTemplate?.sections as any[] || []).map((section, i) => (
                            <div key={section.id} className="flex items-center gap-3 p-3 rounded-lg border">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{section.title}</div>
                                <div className="text-xs text-muted-foreground">{section.type}</div>
                              </div>
                              {section.required && (
                                <Badge variant="outline" className="text-[10px]">Required</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <div className="lg:col-span-2 flex justify-end">
                    <Button onClick={handlePreview} className="gap-1.5">
                      Preview Report <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Preview & Generate */}
              {generateStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setGenerateStep(3)}>
                      ← Back to edit
                    </Button>
                    <Button
                      onClick={handleGenerateReport}
                      disabled={generating}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Zap className="w-4 h-4" /> Generate Report</>
                      )}
                    </Button>
                  </div>
                  <Card className="overflow-hidden">
                    <ReportPreview
                      htmlContent={previewHtml}
                      reportNumber="PREVIEW"
                    />
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══════ TAB 2: Report Templates ═══════ */}
        <TabsContent value="templates">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{templates.length} templates available</p>
            <Button
              onClick={() => {
                setEditingTemplate({
                  id: '',
                  name: '',
                  slug: '',
                  description: '',
                  report_type: 'general',
                  category: 'survey',
                  sections: [],
                  header_text: '',
                  footer_text: '',
                  logo_position: 'left',
                  variables: [],
                  page_size: 'A4',
                  orientation: 'portrait',
                  font_family: 'Inter',
                  primary_color: '#059669',
                  is_active: true,
                  is_default: false,
                  version: 1,
                  created_at: '',
                  updated_at: '',
                })
                setTemplateEditorOpen(true)
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => {
              const Icon = REPORT_TYPE_ICONS[template.report_type] || FileText
              const color = REPORT_TYPE_COLORS[template.report_type] || '#059669'
              const sections = template.sections as any[] || []
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="text-xs">{template.report_type} • {template.category}</CardDescription>
                        </div>
                      </div>
                      {template.is_default && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{sections.length} sections</span>
                        <span>v{template.version}</span>
                        <span>{template._count?.reports || 0} reports</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingTemplate(template)
                            setTemplateEditorOpen(true)
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ═══════ TAB 3: Generated Reports ═══════ */}
        <TabsContent value="reports">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{reports.length} reports generated</p>
          </div>
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">No reports yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Generate your first report to see it here</p>
                <Button onClick={resetGenerateFlow} className="gap-1.5">
                  <Zap className="w-4 h-4" /> Generate Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(report => {
                      const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft
                      return (
                        <TableRow key={report.id} className="cursor-pointer" onClick={() => handleViewReport(report)}>
                          <TableCell className="font-mono text-xs">{report.report_number}</TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">{report.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {report.template?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${status.bg} ${status.color} border-0 text-xs`}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewReport(report)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDownloadPdf(report.id, report.report_number)}
                                disabled={pdfGeneratingId === report.id}
                                title="Download PDF"
                              >
                                {pdfGeneratingId === report.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileDown className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════ Template Editor Sheet ═══════ */}
      <Sheet open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{editingTemplate?.id ? 'Edit Template' : 'New Template'}</SheetTitle>
            <SheetDescription>Configure the report template sections and variables</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={editingTemplate?.name || ''}
                      onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      placeholder="Template name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Slug</Label>
                    <Input
                      value={editingTemplate?.slug || ''}
                      onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, slug: e.target.value })}
                      placeholder="template-slug"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      value={editingTemplate?.description || ''}
                      onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                      placeholder="Template description"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Report Type</Label>
                      <Select
                        value={editingTemplate?.report_type || 'general'}
                        onValueChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, report_type: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cadastral">Cadastral</SelectItem>
                          <SelectItem value="topographic">Topographic</SelectItem>
                          <SelectItem value="boundary">Boundary</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Category</Label>
                      <Select
                        value={editingTemplate?.category || 'survey'}
                        onValueChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, category: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="survey">Survey</SelectItem>
                          <SelectItem value="valuation">Valuation</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sections</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (!editingTemplate) return
                      const sections = [...(editingTemplate.sections as any[])]
                      sections.push({
                        id: `s${Date.now()}`,
                        title: 'New Section',
                        type: 'text',
                        content: '',
                        fields: [],
                        required: false,
                      })
                      setEditingTemplate({ ...editingTemplate, sections })
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Section
                  </Button>
                </div>
                <div className="space-y-2">
                  {(editingTemplate?.sections as any[] || []).map((section, idx) => (
                    <div key={section.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <Input
                          value={section.title}
                          onChange={e => {
                            if (!editingTemplate) return
                            const sections = [...(editingTemplate.sections as any[])]
                            sections[idx] = { ...sections[idx], title: e.target.value }
                            setEditingTemplate({ ...editingTemplate, sections })
                          }}
                          className="h-8 text-sm flex-1"
                          placeholder="Section title"
                        />
                        <Select
                          value={section.type}
                          onValueChange={v => {
                            if (!editingTemplate) return
                            const sections = [...(editingTemplate.sections as any[])]
                            sections[idx] = { ...sections[idx], type: v }
                            setEditingTemplate({ ...editingTemplate, sections })
                          }}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="table">Table</SelectItem>
                            <SelectItem value="coordinates">Coordinates</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="certification">Certification</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => {
                            if (!editingTemplate) return
                            const sections = (editingTemplate.sections as any[]).filter((_, i) => i !== idx)
                            setEditingTemplate({ ...editingTemplate, sections })
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={e => {
                          if (!editingTemplate) return
                          const sections = [...(editingTemplate.sections as any[])]
                          sections[idx] = { ...sections[idx], content: e.target.value }
                          setEditingTemplate({ ...editingTemplate, sections })
                        }}
                        className="text-xs"
                        rows={3}
                        placeholder="Section content template (use {{variable_name}} for placeholders)"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.required}
                          onCheckedChange={v => {
                            if (!editingTemplate) return
                            const sections = [...(editingTemplate.sections as any[])]
                            sections[idx] = { ...sections[idx], required: v }
                            setEditingTemplate({ ...editingTemplate, sections })
                          }}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Variables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Variables</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (!editingTemplate) return
                      const variables = [...(editingTemplate.variables || [])]
                      variables.push({ key: '', label: '', type: 'text', source: 'manual', default: '' })
                      setEditingTemplate({ ...editingTemplate, variables })
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Variable
                  </Button>
                </div>
                <div className="space-y-2">
                  {(editingTemplate?.variables || []).map((variable, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <Label className="text-[10px]">Key</Label>
                        <Input
                          value={variable.key}
                          onChange={e => {
                            if (!editingTemplate) return
                            const variables = [...(editingTemplate.variables || [])]
                            variables[idx] = { ...variables[idx], key: e.target.value }
                            setEditingTemplate({ ...editingTemplate, variables })
                          }}
                          className="h-7 text-xs"
                          placeholder="key"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Label</Label>
                        <Input
                          value={variable.label}
                          onChange={e => {
                            if (!editingTemplate) return
                            const variables = [...(editingTemplate.variables || [])]
                            variables[idx] = { ...variables[idx], label: e.target.value }
                            setEditingTemplate({ ...editingTemplate, variables })
                          }}
                          className="h-7 text-xs"
                          placeholder="Label"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Source</Label>
                        <Select
                          value={variable.source}
                          onValueChange={v => {
                            if (!editingTemplate) return
                            const variables = [...(editingTemplate.variables || [])]
                            variables[idx] = { ...variables[idx], source: v }
                            setEditingTemplate({ ...editingTemplate, variables })
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Default</Label>
                        <Input
                          value={variable.default}
                          onChange={e => {
                            if (!editingTemplate) return
                            const variables = [...(editingTemplate.variables || [])]
                            variables[idx] = { ...variables[idx], default: e.target.value }
                            setEditingTemplate({ ...editingTemplate, variables })
                          }}
                          className="h-7 text-xs"
                          placeholder="Default"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => {
                          if (!editingTemplate) return
                          const variables = (editingTemplate.variables || []).filter((_, i) => i !== idx)
                          setEditingTemplate({ ...editingTemplate, variables })
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Styling */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Styling</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Page Size</Label>
                    <Select
                      value={editingTemplate?.page_size || 'A4'}
                      onValueChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, page_size: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Orientation</Label>
                    <Select
                      value={editingTemplate?.orientation || 'portrait'}
                      onValueChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, orientation: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTemplate?.primary_color || '#059669'}
                      onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingTemplate?.primary_color || '#059669'}
                      onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, primary_color: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Header Text</Label>
                  <Input
                    value={editingTemplate?.header_text || ''}
                    onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, header_text: e.target.value })}
                    placeholder="Header text (use {{variables}})"
                  />
                </div>
                <div>
                  <Label className="text-sm">Footer Text</Label>
                  <Input
                    value={editingTemplate?.footer_text || ''}
                    onChange={e => editingTemplate && setEditingTemplate({ ...editingTemplate, footer_text: e.target.value })}
                    placeholder="Footer text (use {{variables}})"
                  />
                </div>
              </div>

              <Separator />

              {/* Active/Default toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTemplate?.is_active ?? true}
                    onCheckedChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, is_active: v })}
                  />
                  <Label className="text-sm">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTemplate?.is_default ?? false}
                    onCheckedChange={v => editingTemplate && setEditingTemplate({ ...editingTemplate, is_default: v })}
                  />
                  <Label className="text-sm">Default Template</Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t">
            <div className="flex items-center gap-2 w-full">
              <Button variant="outline" onClick={() => { setTemplateEditorOpen(false); setEditingTemplate(null) }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Save Template
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══════ Report Viewer Sheet ═══════ */}
      <Sheet open={reportViewerOpen} onOpenChange={setReportViewerOpen}>
        <SheetContent side="right" className="w-[800px] sm:max-w-[800px] p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{viewingReport?.title || 'Report'}</SheetTitle>
                <SheetDescription>{viewingReport?.report_number}</SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                {viewingReport && (() => {
                  const status = STATUS_CONFIG[viewingReport.status] || STATUS_CONFIG.draft
                  return <Badge className={`${status.bg} ${status.color} border-0`}>{status.label}</Badge>
                })()}
              </div>
            </div>
          </SheetHeader>

          {/* Status workflow buttons */}
          {viewingReport && (
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1">
                  {['draft', 'review', 'approved', 'delivered'].map((s, i) => {
                    const isCurrentOrPast = ['draft', 'review', 'approved', 'delivered'].indexOf(viewingReport.status) >= i
                    const isNext = ['draft', 'review', 'approved', 'delivered'].indexOf(viewingReport.status) === i - 1
                    return (
                      <div key={s} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                        <Button
                          variant={isCurrentOrPast ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs ${isCurrentOrPast ? 'bg-emerald-600' : ''} ${isNext ? 'border-emerald-300' : ''}`}
                          disabled={!isNext}
                          onClick={() => handleUpdateReportStatus(viewingReport.id, s)}
                        >
                          {STATUS_CONFIG[s]?.label || s}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4">
              {reportPreviewHtml ? (
                <ReportPreview
                  htmlContent={reportPreviewHtml}
                  reportNumber={viewingReport?.report_number}
                  reportId={viewingReport?.id}
                  onPrint={() => {
                    const win = window.open('', '_blank')
                    if (win) {
                      win.document.write(reportPreviewHtml)
                      win.document.close()
                      setTimeout(() => win.print(), 500)
                    }
                  }}
                  onDownloadPdf={() => {
                    if (viewingReport) {
                      handleDownloadPdf(viewingReport.id, viewingReport.report_number)
                    }
                  }}
                  onDownload={() => {
                    const blob = new Blob([reportPreviewHtml], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `survey-report-${viewingReport?.report_number || 'draft'}.html`
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report...
                </div>
              )}

              {/* Edit data section */}
              {viewingReport && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold mb-4">Edit Report Data</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(viewingReport.data || {}).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                        <Input
                          value={String(value)}
                          onChange={e => {
                            setViewingReport(prev => prev ? {
                              ...prev,
                              data: { ...prev.data, [key]: e.target.value },
                            } : null)
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleUpdateReportData} className="mt-4 gap-1.5" size="sm">
                    <Pencil className="w-3 h-3" /> Update Data
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
