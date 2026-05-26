import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      clientCount,
      projectCount,
      activeProjects,
      workflowInstanceCount,
      observationCount,
      orgCount,
      branchCount,
      projects,
      invoices,
    ] = await Promise.all([
      db.client.count(),
      db.surveyProject.count(),
      db.surveyProject.count({ where: { status: { in: ['field_survey', 'data_processing', 'intake'] } } }),
      db.workflowInstance.count({ where: { status: 'in_progress' } }),
      db.fieldObservation.count(),
      db.organization.count(),
      db.branch.count(),
      db.surveyProject.findMany({ include: { client: true } }),
      db.invoice.findMany(),
    ])

    const projectByStatus = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const projectByType = projects.reduce((acc, p) => {
      acc[p.project_type] = (acc[p.project_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.total_amount), 0)
    const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0)

    return NextResponse.json(serialize({
      metrics: {
        clients: clientCount,
        projects: projectCount,
        activeProjects,
        workflowInstances: workflowInstanceCount,
        observations: observationCount,
        organizations: orgCount,
        branches: branchCount,
        totalRevenue,
        paidRevenue,
      },
      projectByStatus,
      projectByType,
      recentProjects: projects.slice(0, 5),
    }))
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
