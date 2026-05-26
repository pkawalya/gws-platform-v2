import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [layers, annotations, clients, observations] = await Promise.all([
      db.spatialLayer.findMany({ where: { is_active: true } }),
      db.mapAnnotation.findMany(),
      db.client.findMany({
        where: { latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true,
          client_ref: true,
          first_name: true,
          last_name: true,
          company_name: true,
          client_type: true,
          district: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      }),
      db.fieldObservation.findMany({
        select: {
          id: true,
          title: true,
          observation_type: true,
          description: true,
          latitude: true,
          longitude: true,
          accuracy_meters: true,
          altitude_meters: true,
          status: true,
          created_at: true,
        },
      }),
    ])

    return NextResponse.json(serialize({ layers, annotations, clients, observations }))
  } catch (error) {
    console.error('Spatial API error:', error)
    return NextResponse.json({ error: 'Failed to fetch spatial data' }, { status: 500 })
  }
}
