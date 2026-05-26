import { db } from '@/lib/db'
import { serialize } from '@/lib/json'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'all'
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')

    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      dateFilter.created_at = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }
    const wfDateFilter: any = {}
    if (dateFrom || dateTo) {
      wfDateFilter.started_at = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    // ── Project Summary Report ──
    const projectReport = reportType === 'all' || reportType === 'projects' ? await (async () => {
      const [total, byStatus, byType, byPriority, byDistrict, recent, overdue] = await Promise.all([
        db.surveyProject.count({ where: dateFilter }),
        db.surveyProject.groupBy({ by: ['status'], where: dateFilter, _count: true }),
        db.surveyProject.groupBy({ by: ['project_type'], where: dateFilter, _count: true }),
        db.surveyProject.groupBy({ by: ['priority'], where: dateFilter, _count: true }),
        db.surveyProject.groupBy({ by: ['district'], where: dateFilter, _count: true }),
        db.surveyProject.findMany({
          where: dateFilter,
          include: {
            client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } },
            approvalSteps: { select: { id: true, step_name: true, status: true, step_order: true } },
            fieldObservations: { select: { id: true, observation_type: true, status: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 20,
        }),
        db.surveyProject.count({
          where: {
            ...dateFilter,
            due_date: { lt: new Date() },
            status: { notIn: ['completed', 'cancelled'] },
          },
        }),
      ])

      const totalArea = (await db.surveyProject.aggregate({
        _sum: { area_hectares: true },
        where: { ...dateFilter, area_hectares: { not: null } },
      }))._sum.area_hectares

      return {
        total,
        overdue,
        totalAreaHectares: totalArea ? Number(totalArea) : 0,
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        byType: byType.map(t => ({ type: t.project_type, count: t._count })),
        byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
        byDistrict: byDistrict.filter(d => d.district).map(d => ({ district: d.district, count: d._count })),
        recentProjects: recent.map(p => ({
          id: p.id,
          project_ref: p.project_ref,
          title: p.title,
          status: p.status,
          priority: p.priority,
          project_type: p.project_type,
          district: p.district,
          area_hectares: p.area_hectares ? Number(p.area_hectares) : null,
          due_date: p.due_date,
          created_at: p.created_at,
          client: p.client,
          approvalStepsCount: p.approvalSteps.length,
          observationsCount: p.fieldObservations.length,
          approvedSteps: p.approvalSteps.filter(s => s.status === 'approved').length,
          totalSteps: p.approvalSteps.length,
        })),
      }
    })() : null

    // ── Financial Report ──
    const financialReport = reportType === 'all' || reportType === 'financial' ? await (async () => {
      const [invoices, quotations] = await Promise.all([
        db.invoice.findMany({
          where: dateFilter,
          include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
          orderBy: { created_at: 'desc' },
        }),
        db.quotation.findMany({
          where: dateFilter,
          include: { client: { select: { id: true, client_ref: true, first_name: true, last_name: true, company_name: true, client_type: true } } },
          orderBy: { created_at: 'desc' },
        }),
      ])

      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total_amount), 0)
      const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount), 0)
      const totalOutstanding = totalInvoiced - totalPaid
      const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date())
      const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0)

      const byStatus = invoices.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + Number(i.total_amount)
        return acc
      }, {} as Record<string, number>)

      const byMonth = invoices.reduce((acc, i) => {
        const month = new Date(i.created_at).toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
        if (!acc[month]) acc[month] = { invoiced: 0, paid: 0, count: 0 }
        acc[month].invoiced += Number(i.total_amount)
        acc[month].count++
        if (i.status === 'paid') acc[month].paid += Number(i.total_amount)
        return acc
      }, {} as Record<string, { invoiced: number; paid: number; count: number }>)

      const topDebtors = Object.values(
        invoices.filter(i => i.status !== 'paid').reduce((acc, i) => {
          const key = i.client?.company_name || `${i.client?.first_name} ${i.client?.last_name}`
          if (!acc[key]) acc[key] = { client: key, clientRef: i.client?.client_ref, outstanding: 0, invoiceCount: 0 }
          acc[key].outstanding += Number(i.total_amount)
          acc[key].invoiceCount++
          return acc
        }, {} as Record<string, any>)
      ).sort((a: any, b: any) => b.outstanding - a.outstanding).slice(0, 10)

      const quotationTotal = quotations.reduce((s, q) => s + Number(q.amount || q.total_amount || 0), 0)
      const quotationByStatus = quotations.reduce((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
        invoiceCount: invoices.length,
        overdueCount: overdueInvoices.length,
        overdueAmount,
        byStatus,
        byMonth,
        topDebtors,
        quotationCount: quotations.length,
        quotationTotal,
        quotationByStatus,
        invoices: invoices.map(i => ({
          id: i.id,
          invoice_number: i.invoice_number,
          total_amount: Number(i.total_amount),
          status: i.status,
          due_date: i.due_date,
          created_at: i.created_at,
          client: i.client,
        })),
        quotations: quotations.map(q => ({
          id: q.id,
          quote_number: q.quote_number,
          amount: Number(q.amount || q.total_amount || 0),
          status: q.status,
          valid_until: q.valid_until,
          created_at: q.created_at,
          client: q.client,
        })),
      }
    })() : null

    // ── Client Summary Report ──
    const clientReport = reportType === 'all' || reportType === 'clients' ? await (async () => {
      const [total, byStatus, byType, byDistrict] = await Promise.all([
        db.client.count({ where: dateFilter }),
        db.client.groupBy({ by: ['status'], where: dateFilter, _count: true }),
        db.client.groupBy({ by: ['client_type'], where: dateFilter, _count: true }),
        db.client.groupBy({ by: ['district'], where: dateFilter, _count: true }),
      ])

      const clientsWithProjects = await db.client.findMany({
        where: dateFilter,
        include: {
          _count: { select: { surveyProjects: true, invoices: true, documents: true, communications: true } },
          organization: { select: { name: true, slug: true } },
          branch: { select: { name: true, slug: true } },
        },
        orderBy: { created_at: 'desc' },
      })

      const topClients = clientsWithProjects
        .map(c => ({
          id: c.id,
          client_ref: c.client_ref,
          name: c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`,
          client_type: c.client_type,
          status: c.status,
          district: c.district,
          organization: c.organization?.name,
          branch: c.branch?.name,
          projectCount: c._count.surveyProjects,
          invoiceCount: c._count.invoices,
          documentCount: c._count.documents,
          communicationCount: c._count.communications,
        }))
        .sort((a, b) => b.projectCount - a.projectCount)

      return {
        total,
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        byType: byType.map(t => ({ type: t.client_type, count: t._count })),
        byDistrict: byDistrict.filter(d => d.district).map(d => ({ district: d.district, count: d._count })),
        topClients,
      }
    })() : null

    // ── Workflow Report ──
    const workflowReport = reportType === 'all' || reportType === 'workflows' ? await (async () => {
      const [definitions, instances] = await Promise.all([
        db.workflowDefinition.findMany({
          include: { steps: { orderBy: { step_order: 'asc' } } },
        }),
        db.workflowInstance.findMany({
          where: wfDateFilter,
          include: {
            workflowDefinition: { select: { id: true, name: true } },
            transitions: { include: { fromStep: { select: { name: true } }, toStep: { select: { name: true } } } },
          },
        }),
      ])

      const byStatus = instances.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const avgCompletionTime = instances
        .filter(i => i.status === 'completed' && i.completed_at)
        .map(i => {
          const start = new Date(i.started_at).getTime()
          const end = new Date(i.completed_at!).getTime()
          return (end - start) / (1000 * 60 * 60)
        })
      const avgHours = avgCompletionTime.length > 0
        ? Math.round(avgCompletionTime.reduce((a, b) => a + b, 0) / avgCompletionTime.length)
        : 0

      return {
        definitionCount: definitions.length,
        instanceCount: instances.length,
        activeCount: instances.filter(i => i.status === 'in_progress').length,
        completedCount: instances.filter(i => i.status === 'completed').length,
        avgCompletionHours: avgHours,
        byStatus,
        definitions: definitions.map(d => ({
          id: d.id,
          name: d.name,
          version: d.version,
          triggerType: d.trigger_type,
          stepCount: d.steps.length,
          instanceCount: instances.filter(i => i.workflow_definition_id === d.id).length,
          steps: d.steps.map(s => ({ id: s.id, name: s.name, step_type: s.step_type, sla_hours: s.sla_hours })),
        })),
      }
    })() : null

    // ── Spatial/Observation Report ──
    const spatialReport = reportType === 'all' || reportType === 'spatial' ? await (async () => {
      const [observations, syncEvents] = await Promise.all([
        db.fieldObservation.findMany({
          where: dateFilter,
          orderBy: { created_at: 'desc' },
        }),
        db.fieldSyncEvent.findMany({
          where: wfDateFilter,
          orderBy: { started_at: 'desc' },
        }),
      ])

      const byType = observations.reduce((acc, o) => {
        acc[o.observation_type] = (acc[o.observation_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const byStatus = observations.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalPushed = syncEvents.reduce((s, e) => s + e.records_pushed, 0)
      const totalPulled = syncEvents.reduce((s, e) => s + e.records_pulled, 0)
      const totalConflicts = syncEvents.reduce((s, e) => s + e.conflicts_count, 0)

      return {
        observationCount: observations.length,
        syncEventCount: syncEvents.length,
        byType,
        byStatus,
        totalPushed,
        totalPulled,
        totalConflicts,
        avgAccuracy: observations.filter(o => o.accuracy_meters).length > 0
          ? Math.round(observations.filter(o => o.accuracy_meters).reduce((s, o) => s + Number(o.accuracy_meters), 0) / observations.filter(o => o.accuracy_meters).length * 10) / 10
          : 0,
        syncByDate: syncEvents.reduce((acc, e) => {
          const date = new Date(e.started_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
          if (!acc[date]) acc[date] = { pushed: 0, pulled: 0, conflicts: 0 }
          acc[date].pushed += e.records_pushed
          acc[date].pulled += e.records_pulled
          acc[date].conflicts += e.conflicts_count
          return acc
        }, {} as Record<string, { pushed: number; pulled: number; conflicts: number }>),
      }
    })() : null

    // ── AI Usage Report ──
    const aiReport = reportType === 'all' || reportType === 'ai' ? await (async () => {
      const [models, callLogs] = await Promise.all([
        db.aiModelVersion.findMany({ where: { is_active: true } }),
        db.aiCallLog.findMany({
          where: dateFilter,
          include: { aiModelVersion: { select: { display_name: true, provider: true } } },
          orderBy: { created_at: 'desc' },
        }),
      ])

      const totalCalls = callLogs.length
      const successfulCalls = callLogs.filter(l => l.status === 'delivered').length
      const failedCalls = callLogs.filter(l => l.status === 'failed').length
      const totalInputTokens = callLogs.reduce((s, l) => s + (l.input_tokens || 0), 0)
      const totalOutputTokens = callLogs.reduce((s, l) => s + (l.output_tokens || 0), 0)
      const totalCost = callLogs.reduce((s, l) => s + Number(l.cost_usd || 0), 0)
      const avgLatency = callLogs.filter(l => l.latency_ms).length > 0
        ? Math.round(callLogs.filter(l => l.latency_ms).reduce((s, l) => s + l.latency_ms!, 0) / callLogs.filter(l => l.latency_ms).length)
        : 0

      const byModel = callLogs.reduce((acc, l) => {
        const name = l.aiModelVersion?.display_name || 'Unknown'
        if (!acc[name]) acc[name] = { calls: 0, cost: 0, tokens: 0 }
        acc[name].calls++
        acc[name].cost += Number(l.cost_usd || 0)
        acc[name].tokens += (l.input_tokens || 0) + (l.output_tokens || 0)
        return acc
      }, {} as Record<string, { calls: number; cost: number; tokens: number }>)

      return {
        activeModels: models.length,
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
        totalInputTokens,
        totalOutputTokens,
        totalCost,
        avgLatency,
        byModel,
      }
    })() : null

    // ── Audit Trail Report ──
    const auditReport = reportType === 'all' || reportType === 'audit' ? await (async () => {
      const events = await db.domainEvent.findMany({
        where: dateFilter,
        orderBy: { created_at: 'desc' },
        take: 500,
      })

      const byType = events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const byAggregate = events.reduce((acc, e) => {
        acc[e.aggregate] = (acc[e.aggregate] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const byDate = events.reduce((acc, e) => {
        const date = new Date(e.created_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalEvents: events.length,
        byType,
        byAggregate,
        byDate,
        recentEvents: events.slice(0, 20).map(e => ({
          id: e.id,
          event_type: e.event_type,
          aggregate: e.aggregate,
          aggregate_id: e.aggregate_id,
          created_at: e.created_at,
        })),
      }
    })() : null

    return NextResponse.json(serialize({
      projectReport,
      financialReport,
      clientReport,
      workflowReport,
      spatialReport,
      aiReport,
      auditReport,
      generatedAt: new Date().toISOString(),
      dateRange: { from: dateFrom, to: dateTo },
    }))
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
  }
}
