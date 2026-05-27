'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Network, Users } from 'lucide-react'

interface OrganizationsPageProps {
  orgsData: any
  openDetail: (type: string, data: any) => void
}

export function OrganizationsPage({ orgsData }: OrganizationsPageProps) {
  const organizations = orgsData?.organizations || []
  const branches = orgsData?.branches || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Organizations', value: organizations.length, icon: Building2 },
          { label: 'Branches', value: branches.length, icon: Network },
          { label: 'Total Clients', value: organizations.reduce((s: number, o: any) => s + (o._count?.clients || 0), 0), icon: Users },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[11px] text-slate-500 uppercase tracking-wide">{k.label}</p><p className="text-xl font-bold mt-0.5">{k.value}</p></div>
            <k.icon className="w-5 h-5 text-slate-300" />
          </CardContent></Card>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Organizations</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org: any) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <CardTitle className="text-sm">{org.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono mt-0.5">{org.slug}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-emerald-600">{org._count?.clients || 0}</p><p className="text-[10px] text-slate-500">Clients</p></div>
                  <div><p className="text-lg font-bold text-blue-600">{org.branches?.length || 0}</p><p className="text-[10px] text-slate-500">Branches</p></div>
                  <div><p className="text-lg font-bold text-violet-600">{org._count?.workflowDefinitions || 0}</p><p className="text-[10px] text-slate-500">Workflows</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Branches</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Organization</TableHead>
                <TableHead className="text-xs">Clients</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Workflows</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {branches.map((b: any) => (
                  <TableRow key={b.id} className="hover:bg-slate-50">
                    <TableCell><div><p className="text-sm font-medium">{b.name}</p><Badge variant="outline" className="text-[10px] font-mono">{b.slug}</Badge></div></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">{b.organization?.name || '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{b._count?.clients || 0}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="text-[11px]">{b._count?.workflowInstances || 0}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
