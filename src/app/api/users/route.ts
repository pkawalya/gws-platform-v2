import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.user.findMany({
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
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(serialize(users))
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone, job_title, department, status, role_ids } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        phone: phone || null,
        job_title: job_title || null,
        department: department || null,
        status: status || 'active',
        userRoles: role_ids?.length ? {
          createMany: {
            data: role_ids.map((rid: string) => ({ role_id: rid })),
          },
        } : undefined,
      },
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

    return NextResponse.json(serialize(user), { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
