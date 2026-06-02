import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const UPLOAD_DIR = '/home/z/my-project/upload'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/msword': ['.doc'],
  'application/vnd.ms-excel': ['.xls'],
}

function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

function isAllowedFile(filename: string, mimeType: string): boolean {
  const ext = getFileExtension(filename)
  for (const [mime, extensions] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mime === mimeType && extensions.includes(ext)) return true
  }
  // Fallback: check extension alone if mime type is not precise
  const allExts = Object.values(ALLOWED_MIME_TYPES).flat()
  if (allExts.includes(ext)) return true
  return false
}

function getMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.doc': 'application/msword',
    '.xls': 'application/vnd.ms-excel',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

function formatDatePath(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}/${m}`
}

async function generateThumbnail(filePath: string): Promise<string | null> {
  try {
    const parsed = path.parse(filePath)
    const thumbName = `${parsed.name}_thumb${parsed.ext}`
    const thumbPath = path.join(parsed.dir, thumbName)

    await sharp(filePath)
      .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
      .toFile(thumbPath)

    return thumbPath
  } catch (err) {
    console.error('Thumbnail generation failed:', err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    const mimeType = file.type || getMimeType(file.name)
    if (!isAllowedFile(file.name, mimeType)) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported: jpg, png, webp, pdf, docx, xlsx' },
        { status: 400 }
      )
    }

    // Create date-based subdirectory
    const datePath = formatDatePath()
    const uploadDir = path.join(UPLOAD_DIR, datePath)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueName = `${timestamp}-${safeName}`
    const filePath = path.join(uploadDir, uniqueName)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate thumbnail for images
    let thumbnailPath: string | null = null
    const isImage = mimeType.startsWith('image/')
    if (isImage) {
      thumbnailPath = await generateThumbnail(filePath)
    }

    // Build relative path for database storage
    const relativePath = `/upload/${datePath}/${uniqueName}`
    const relativeThumbPath = thumbnailPath
      ? `/upload/${datePath}/${path.basename(thumbnailPath)}`
      : null

    return NextResponse.json(
      {
        success: true,
        file: {
          path: relativePath,
          thumbnail_path: relativeThumbPath,
          name: file.name,
          size: file.size,
          mime_type: mimeType,
          is_image: isImage,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
