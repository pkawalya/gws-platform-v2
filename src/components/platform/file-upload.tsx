'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileText, Image as ImageIcon, FileSpreadsheet, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export interface UploadedFile {
  path: string
  thumbnail_path: string | null
  name: string
  size: number
  mime_type: string
  is_image: boolean
}

interface FileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  variant?: 'compact' | 'full'
  label?: string
  disabled?: boolean
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  result?: UploadedFile
  preview?: string
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx', '.doc', '.xls']

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileSpreadsheet
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(name: string): string {
  return '.' + name.split('.').pop()?.toLowerCase()
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = '.jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx',
  multiple = true,
  maxFiles = 10,
  variant = 'full',
  label = 'Upload Files',
  disabled = false,
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const validateFile = useCallback((file: File): string | null => {
    const ext = getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type "${ext}" is not allowed`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit`
    }
    return null
  }, [])

  const uploadFile = useCallback(async (file: File, id: string) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, status: 'success' as const, progress: 100, result: data.file }
            : f
        )
      )

      return data.file as UploadedFile
    } catch (err: any) {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, status: 'error' as const, error: err.message || 'Upload failed' }
            : f
        )
      )
      throw err
    }
  }, [])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Only one file is allowed')
      return
    }

    // Check max files
    if (fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate all files first
    const validFiles: { file: File; id: string; preview?: string }[] = []
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        onUploadError?.(error)
        continue
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      let preview: string | undefined

      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      validFiles.push({ file, id, preview })
    }

    if (validFiles.length === 0) return

    // Add files to uploading list
    const newUploadingFiles: UploadingFile[] = validFiles.map(({ file, id, preview }) => ({
      id,
      file,
      progress: 0,
      status: 'uploading' as const,
      preview,
    }))

    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Simulate progress and upload
    const results: UploadedFile[] = []
    for (const { file, id } of validFiles) {
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === id && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
              : f
          )
        )
      }, 200)

      try {
        const result = await uploadFile(file, id)
        results.push(result)
      } catch {
        // Error already handled in uploadFile
      }

      clearInterval(progressInterval)
    }

    // Call completion callback with successful uploads
    if (results.length > 0) {
      onUploadComplete(results)
    }
  }, [multiple, maxFiles, validateFile, uploadFile, onUploadComplete, onUploadError])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = useCallback((id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setUploadingFiles(prev => {
      prev.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      return prev.filter(f => f.status === 'uploading')
    })
  }, [])

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingFiles.some(f => f.status === 'uploading')}
        >
          {uploadingFiles.some(f => f.status === 'uploading') ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploadingFiles.some(f => f.status === 'uploading') ? 'Uploading...' : label}
        </Button>
        {uploadingFiles.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50 p-2 space-y-1">
            {uploadingFiles.map(f => (
              <div key={f.id} className="flex items-center gap-2 p-1.5 rounded bg-slate-50 text-xs">
                {f.status === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : f.status === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                )}
                <span className="truncate flex-1">{f.file.name}</span>
                <button onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-emerald-500' : 'text-slate-300'}`} />
        <p className="text-sm font-medium text-slate-700">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          or click to browse • Max 10MB per file
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Supported: JPG, PNG, WebP, PDF, DOCX, XLSX
        </p>
      </div>

      {/* Upload Progress List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {uploadingFiles.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
              {/* Preview or Icon */}
              {f.preview && f.status !== 'error' ? (
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100">
                  <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 bg-slate-100">
                  {(() => {
                    const Icon = getFileIcon(f.file.type || 'application/octet-stream')
                    return <Icon className="w-5 h-5 text-slate-400" />
                  })()}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  {f.status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {f.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">{formatFileSize(f.file.size)}</span>
                  <Badge variant="outline" className="text-[9px] h-4">
                    {getFileExtension(f.file.name).toUpperCase().replace('.', '')}
                  </Badge>
                </div>
                {f.status === 'uploading' && (
                  <Progress value={f.progress} className="h-1 mt-1.5" />
                )}
                {f.status === 'error' && f.error && (
                  <p className="text-[11px] text-red-500 mt-0.5">{f.error}</p>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Clear Completed Button */}
          {uploadingFiles.some(f => f.status !== 'uploading') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full"
              onClick={clearCompleted}
            >
              Clear completed
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Helper: render file thumbnail/icon for document lists
export function FileThumbnail({
  filePath,
  mimeType,
  thumbnailPath,
  size = 'sm',
}: {
  filePath?: string | null
  mimeType?: string | null
  thumbnailPath?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  }

  const isImage = mimeType?.startsWith('image/')

  // If we have a thumbnail path for images, show it
  if (isImage && (thumbnailPath || filePath)) {
    const imgSrc = thumbnailPath
      ? `/api/files${thumbnailPath}`
      : filePath
        ? `/api/files${filePath}?w=100&h=100`
        : null

    if (imgSrc) {
      return (
        <div className={`${sizeClasses[size]} rounded overflow-hidden bg-slate-100 shrink-0`}>
          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
        </div>
      )
    }
  }

  // Show file type icon
  const iconSize = iconSizes[size]

  const bgColors: Record<string, string> = {
    'image/': 'bg-emerald-50 text-emerald-500',
    'application/pdf': 'bg-red-50 text-red-500',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bg-blue-50 text-blue-500',
    'application/msword': 'bg-blue-50 text-blue-500',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bg-green-50 text-green-600',
    'application/vnd.ms-excel': 'bg-green-50 text-green-600',
  }

  const bgClass = Object.entries(bgColors).find(([key]) => mimeType?.startsWith(key))?.[1] || 'bg-slate-50 text-slate-400'

  const mt = mimeType || 'application/octet-stream'
  let iconEl: React.ReactNode
  if (mt.startsWith('image/')) iconEl = <ImageIcon className={iconSize} />
  else if (mt.includes('pdf')) iconEl = <FileText className={iconSize} />
  else if (mt.includes('sheet') || mt.includes('excel')) iconEl = <FileSpreadsheet className={iconSize} />
  else iconEl = <File className={iconSize} />

  return (
    <div className={`${sizeClasses[size]} rounded flex items-center justify-center shrink-0 ${bgClass}`}>
      {iconEl}
    </div>
  )
}

// Helper: download button for files
export function FileDownloadButton({ filePath, fileName }: { filePath: string; fileName?: string }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/files${filePath}`
    link.download = fileName || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDownload}>
      <FileText className="w-3.5 h-3.5 text-slate-400" />
    </Button>
  )
}
