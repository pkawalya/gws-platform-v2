import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = '/home/z/my-project/upload'

const MIME_MAP: Record<string, string> = {
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

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    // Reconstruct the file path from the catch-all segments
    // pathSegments comes from URLs like /api/files/upload/2025/01/file.jpg
    // which means segments = ['upload', '2025', '01', 'file.jpg']
    // But we want to serve from UPLOAD_DIR directly, so strip the leading 'upload' segment
    let cleanSegments = pathSegments
    if (cleanSegments.length > 0 && cleanSegments[0] === 'upload') {
      cleanSegments = cleanSegments.slice(1)
    }
    const relativePath = cleanSegments.join('/')

    // Security: prevent directory traversal
    const normalizedRelative = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '')
    const fullPath = path.join(UPLOAD_DIR, normalizedRelative)

    // Ensure the resolved path is still within UPLOAD_DIR
    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check file exists
    let fileStat
    try {
      fileStat = await stat(fullPath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const mimeType = getMimeType(fullPath)
    const isImage = mimeType.startsWith('image/')

    // Parse resize query params
    const widthParam = request.nextUrl.searchParams.get('w')
    const heightParam = request.nextUrl.searchParams.get('h')

    // If image and resize params provided, resize on the fly using sharp
    if (isImage && (widthParam || heightParam)) {
      const width = widthParam ? parseInt(widthParam, 10) : undefined
      const height = heightParam ? parseInt(heightParam, 10) : undefined

      if ((width && width > 2000) || (height && height > 2000)) {
        return NextResponse.json({ error: 'Resize dimensions too large' }, { status: 400 })
      }

      try {
        const sharp = (await import('sharp')).default
        const buffer = await readFile(fullPath)
        const resizedBuffer = await sharp(buffer)
          .resize(width, height, { fit: 'cover', withoutEnlargement: true })
          .toBuffer()

        return new NextResponse(resizedBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Content-Length': String(resizedBuffer.length),
          },
        })
      } catch (resizeError) {
        // If sharp fails, fall through to serving the original file
        console.error('Image resize failed, serving original:', resizeError)
      }
    }

    // Serve the file directly
    const buffer = await readFile(fullPath)

    // Set cache headers based on file type
    const cacheControl = isImage || mimeType === 'application/pdf'
      ? 'public, max-age=86400, stale-while-revalidate=604800'
      : 'public, max-age=3600'

    // For PDFs and images, allow inline display; for others, force download
    const disposition = isImage || mimeType === 'application/pdf'
      ? 'inline'
      : 'attachment'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': cacheControl,
        'Content-Length': String(fileStat.size),
        'Content-Disposition': `${disposition}; filename="${path.basename(fullPath)}"`,
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
