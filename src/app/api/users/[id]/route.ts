import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(serialize(user))
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, name, phone, job_title, department, status, role_ids } = body

    const user = await db.user.update({
      where: { id },
      data: {
        email: email ?? undefined,
        name: name ?? undefined,
        phone: phone ?? undefined,
        job_title: job_title ?? undefined,
        department: department ?? undefined,
        status: status ?? undefined,
      },
    })

    // If role_ids provided, sync roles
    if (role_ids !== undefined) {
      await db.userRole.deleteMany({ where: { user_id: id } })
      if (role_ids.length > 0) {
        await db.userRole.createMany({
          data: role_ids.map((rid: string) => ({ user_id: id, role_id: rid })),
        })
      }
    }

    const updated = await db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(serialize(updated))
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.userRole.deleteMany({ where: { user_id: id } })
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
