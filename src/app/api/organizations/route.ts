import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [organizations, branches] = await Promise.all([
      db.organization.findMany({ include: { branches: true, _count: { select: { clients: true, workflowDefinitions: true, workflowInstances: true } } } }),
      db.branch.findMany({ include: { organization: { select: { name: true, slug: true } }, _count: { select: { clients: true, workflowInstances: true } } } }),
    ])
    return NextResponse.json(serialize({ organizations, branches }))
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
