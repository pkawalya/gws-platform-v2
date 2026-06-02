'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Printer, Maximize2 } from 'lucide-react'

interface ReportPreviewProps {
  htmlContent: string
  reportNumber?: string
  onPrint?: () => void
  onDownload?: () => void
}

export function ReportPreview({ htmlContent, reportNumber, onPrint, onDownload }: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    // Download as HTML file (can be opened in browser and printed to PDF)
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
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handlePrint}>
            <Printer className="w-3 h-3 mr-1" /> Print
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDownload}>
            <Download className="w-3 h-3 mr-1" /> Download
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleFullscreen}>
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
