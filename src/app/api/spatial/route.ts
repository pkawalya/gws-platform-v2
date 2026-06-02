import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [layers, annotations, clients, observations, projectBoundaries] = await Promise.all([
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
      // Fetch survey projects with boundary_geojson
      db.surveyProject.findMany({
        where: { boundary_geojson: { not: null } },
        select: {
          id: true,
          title: true,
          project_ref: true,
          project_type: true,
          status: true,
          district: true,
          boundary_geojson: true,
          area_hectares: true,
          client: {
            select: {
              id: true,
              client_type: true,
              first_name: true,
              last_name: true,
              company_name: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json(serialize({
      layers,
      annotations,
      clients,
      observations,
      projectBoundaries,
    }))
  } catch (error) {
    console.error('Spatial API error:', error)
    return NextResponse.json({ error: 'Failed to fetch spatial data' }, { status: 500 })
  }
}

// ── POST: Create annotation ──
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, title, description, feature_type, geojson, color, layer_id } = body

    if (action === 'create_annotation') {
      // Find or create a default layer for annotations
      let annotationLayerId = layer_id
      if (!annotationLayerId) {
        const existingLayer = await db.spatialLayer.findFirst({
          where: { slug: 'annotations' },
        })
        if (existingLayer) {
          annotationLayerId = existingLayer.id
        } else {
          const newLayer = await db.spatialLayer.create({
            data: {
              name: 'Annotations',
              slug: 'annotations',
              layer_type: 'annotation',
              source_type: 'manual',
              is_active: true,
              default_style: { color: color || '#10b981' },
            },
          })
          annotationLayerId = newLayer.id
        }
      }

      const annotation = await db.mapAnnotation.create({
        data: {
          layer_id: annotationLayerId,
          feature_type: feature_type || 'marker',
          geojson: geojson || {},
          properties: { color: color || '#10b981' },
          title: title || 'Untitled Annotation',
          description: description || null,
        },
      })

      return NextResponse.json(serialize({ annotation }), { status: 201 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Spatial POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ── PATCH: Update/Delete annotation ──
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, title, description, properties, feature_type, geojson } = body

    if (!id) {
      return NextResponse.json({ error: 'Annotation ID is required' }, { status: 400 })
    }

    // Delete action
    if (action === 'delete') {
      await db.mapAnnotation.delete({ where: { id: String(id) } })
      return NextResponse.json({ success: true })
    }

    // Update action
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (feature_type !== undefined) updateData.feature_type = feature_type
    if (geojson !== undefined) updateData.geojson = geojson
    if (properties !== undefined) updateData.properties = properties

    const annotation = await db.mapAnnotation.update({
      where: { id: String(id) },
      data: updateData,
    })

    return NextResponse.json(serialize({ annotation }))
  } catch (error) {
    console.error('Spatial PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 })
  }
}
