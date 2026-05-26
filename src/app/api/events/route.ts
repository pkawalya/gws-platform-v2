import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const events = await db.domainEvent.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
    })
    const metrics = {
      total: events.length,
      byType: events.reduce((acc, e) => { acc[e.event_type] = (acc[e.event_type] || 0) + 1; return acc }, {} as Record<string, number>),
      byAggregate: events.reduce((acc, e) => { acc[e.aggregate] = (acc[e.aggregate] || 0) + 1; return acc }, {} as Record<string, number>),
    }
    return NextResponse.json(serialize({ metrics, events }))
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json({ error: 'Failed to fetch domain events' }, { status: 500 })
  }
}
