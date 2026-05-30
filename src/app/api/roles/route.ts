import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const roles = await db.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { userRoles: true } },
      },
      orderBy: { created_at: 'asc' },
    })
    return NextResponse.json(serialize(roles))
  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, display_name, description, color, permission_ids } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    const existing = await db.role.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 409 })
    }

    const role = await db.role.create({
      data: {
        name,
        display_name,
        description: description || null,
        color: color || '#10b981',
        rolePermissions: permission_ids?.length ? {
          createMany: {
            data: permission_ids.map((pid: string) => ({ permission_id: pid })),
          },
        } : undefined,
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { userRoles: true } },
      },
    })

    return NextResponse.json(serialize(role), { status: 201 })
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
