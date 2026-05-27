import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const communications = await db.communication.findMany({
      include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
      orderBy: { created_at: 'desc' },
    })
    const metrics = {
      total: communications.length,
      byChannel: communications.reduce((acc, c) => { acc[c.channel] = (acc[c.channel] || 0) + 1; return acc }, {} as Record<string, number>),
      byDirection: communications.reduce((acc, c) => { acc[c.direction] = (acc[c.direction] || 0) + 1; return acc }, {} as Record<string, number>),
      byStatus: communications.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {} as Record<string, number>),
    }
    return NextResponse.json(serialize({ metrics, communications }))
  } catch (error) {
    console.error('Communications API error:', error)
    return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, body: messageBody, channel, direction, client_id } = body

    if (!messageBody || !channel || !direction || !client_id) {
      return NextResponse.json({ error: 'body, channel, direction, and client_id are required' }, { status: 400 })
    }

    const communication = await db.communication.create({
      data: {
        subject: subject || null,
        body: messageBody,
        channel,
        direction,
        client_id: BigInt(client_id),
        status: direction === 'outbound' ? 'queued' : 'received',
        sent_at: direction === 'outbound' ? new Date() : null,
      },
      include: {
        client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
      },
    })
    return NextResponse.json(serialize(communication), { status: 201 })
  } catch (error) {
    console.error('Create communication error:', error)
    return NextResponse.json({ error: 'Failed to create communication' }, { status: 500 })
  }
}
