import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [models, templates, callLogs] = await Promise.all([
      db.aiModelVersion.findMany(),
      db.aiPromptTemplate.findMany({ include: { aiModelVersion: true } }),
      db.aiCallLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
        include: { aiModelVersion: true },
      }),
    ])

    return NextResponse.json(serialize({ models, templates, callLogs }))
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Failed to fetch AI data' }, { status: 500 })
  }
}
