import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { userRoles: true } },
      },
    })
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    return NextResponse.json(serialize(role))
  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, display_name, description, color, permission_ids } = body

    const role = await db.role.update({
      where: { id },
      data: {
        name: name ?? undefined,
        display_name: display_name ?? undefined,
        description: description ?? undefined,
        color: color ?? undefined,
      },
    })

    // If permission_ids provided, sync permissions
    if (permission_ids !== undefined) {
      await db.rolePermission.deleteMany({ where: { role_id: id } })
      if (permission_ids.length > 0) {
        await db.rolePermission.createMany({
          data: permission_ids.map((pid: string) => ({ role_id: id, permission_id: pid })),
        })
      }
    }

    const updated = await db.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { userRoles: true } },
      },
    })

    return NextResponse.json(serialize(updated))
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const role = await db.role.findUnique({ where: { id } })
    if (role?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }
    await db.rolePermission.deleteMany({ where: { role_id: id } })
    await db.userRole.deleteMany({ where: { role_id: id } })
    await db.role.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete role error:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
