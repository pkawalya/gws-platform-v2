'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Printer, Maximize2, FileText, Loader2 } from 'lucide-react'

interface ReportPreviewProps {
  htmlContent: string
  reportNumber?: string
  reportId?: string
  onPrint?: () => void
  onDownload?: () => void
  onDownloadPdf?: () => void
}

export function ReportPreview({
  htmlContent,
  reportNumber,
  reportId,
  onPrint,
  onDownload,
  onDownloadPdf,
}: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent])

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
      return
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
      return
    }
    // Download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `survey-report-${reportNumber || 'draft'}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    if (onDownloadPdf) {
      onDownloadPdf()
      return
    }

    if (!reportId) return

    setPdfGenerating(true)
    try {
      const res = await fetch(`/api/survey-reports/${reportId}/pdf`, {
        method: 'GET',
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `survey-report-${reportNumber || 'draft'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        console.error('Failed to generate PDF')
        // Fallback to HTML download
        handleDownload()
      }
    } catch (e) {
      console.error('PDF download error:', e)
      handleDownload()
    } finally {
      setPdfGenerating(false)
    }
  }

  const handlePrintPdf = async () => {
    if (!reportId) {
      handlePrint()
      return
    }

    setPdfGenerating(true)
    try {
      const res = await fetch(`/api/survey-reports/${reportId}/pdf`, {
        method: 'GET',
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const printWindow = window.open(url, '_blank')
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print()
          })
        }
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        // Fallback to iframe print
        handlePrint()
      }
    } catch (e) {
      console.error('PDF print error:', e)
      handlePrint()
    } finally {
      setPdfGenerating(false)
    }
  }

  const handleFullscreen = () => {
    if (iframeRef.current?.contentWindow) {
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(htmlContent)
        win.document.close()
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">
          Report Preview {reportNumber ? `• ${reportNumber}` : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handlePrintPdf}
            disabled={pdfGenerating}
          >
            {pdfGenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Printer className="w-3 h-3 mr-1" />
            )}
            Print PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
          >
            {pdfGenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <FileText className="w-3 h-3 mr-1" />
            )}
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleDownload}
          >
            <Download className="w-3 h-3 mr-1" /> HTML
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleFullscreen}
          >
            <Maximize2 className="w-3 h-3 mr-1" /> Full
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 overflow-auto">
        <div className="mx-auto shadow-lg" style={{ maxWidth: '210mm' }}>
          <iframe
            ref={iframeRef}
            className="w-full bg-white border-0"
            style={{ height: '297mm', minHeight: '600px' }}
            title="Report Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
