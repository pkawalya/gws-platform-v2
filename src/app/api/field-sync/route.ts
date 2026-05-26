import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [syncEvents, observations] = await Promise.all([
      db.fieldSyncEvent.findMany({ orderBy: { started_at: 'desc' } }),
      db.fieldObservation.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
    ])

    return NextResponse.json(serialize({ syncEvents, observations }))
  } catch (error) {
    console.error('Field sync API error:', error)
    return NextResponse.json({ error: 'Failed to fetch field sync data' }, { status: 500 })
  }
}
