'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard, Users, MapPin, GitBranch, Smartphone, Layers, Brain,
  Receipt, FileText, MessageSquare, ShieldCheck, ScrollText, Building2,
  BarChart2, Plus, Search, ArrowRight, User, FolderOpen, FileBarChart,
} from 'lucide-react'
import type { PageId } from './types'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (page: PageId) => void
  openDetail: (type: string, data: any) => void
  clients: any[]
  projects: any[]
  invoices: any[]
  workflows: any[]
}

export function CommandPalette({
  open, onOpenChange, onNavigate, openDetail,
  clients, projects, invoices, workflows,
}: CommandPaletteProps) {
  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="GWS Command Palette" description="Search across all entities and navigate quickly">
      <CommandInput placeholder="Search clients, projects, invoices..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => onNavigate('dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('clients'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Go to Clients</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('projects'))}>
            <MapPin className="mr-2 h-4 w-4" />
            <span>Go to Survey Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('finance'))}>
            <Receipt className="mr-2 h-4 w-4" />
            <span>Go to Finance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('workflows'))}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Go to Workflows</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('approvals'))}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Go to Approvals</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('spatial'))}>
            <Layers className="mr-2 h-4 w-4" />
            <span>Go to Spatial Map</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('documents'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Go to Documents</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('communications'))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Go to Messages</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('reports'))}>
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Go to Reports</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => onNavigate('clients'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Client</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('projects'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Project</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('finance'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Invoice</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onNavigate('reports'))}>
            <FileBarChart className="mr-2 h-4 w-4" />
            <span>Run Report</span>
          </CommandItem>
        </CommandGroup>

        {/* Clients Search */}
        {(clients || []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {clients.slice(0, 6).map((c: any) => (
                <CommandItem
                  key={c.id}
                  value={`client ${c.client_ref} ${c.first_name || ''} ${c.last_name || ''} ${c.company_name || ''} ${c.district || ''}`}
                  onSelect={() => runCommand(() => { onNavigate('clients'); openDetail('client', c) })}
                >
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{c.client_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`}</span>
                  <span className="ml-auto text-xs text-slate-400 font-mono">{c.client_ref}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Projects Search */}
        {(projects || []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 6).map((p: any) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.project_ref} ${p.title} ${p.district || ''} ${p.project_type}`}
                  onSelect={() => runCommand(() => { onNavigate('projects'); openDetail('project', p) })}
                >
                  <FolderOpen className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>{p.title}</span>
                  <span className="ml-auto text-xs text-slate-400 font-mono">{p.project_ref}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Invoices Search */}
        {(invoices || []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Invoices">
              {invoices.slice(0, 6).map((inv: any) => (
                <CommandItem
                  key={inv.id}
                  value={`invoice ${inv.invoice_number} ${inv.status}`}
                  onSelect={() => runCommand(() => { onNavigate('finance'); openDetail('invoice', inv) })}
                >
                  <Receipt className="mr-2 h-4 w-4 text-amber-500" />
                  <span>{inv.invoice_number}</span>
                  <span className="ml-2 text-xs text-slate-400">UGX {Number(inv.total_amount).toLocaleString()}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Workflows Search */}
        {(workflows || []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Workflows">
              {workflows.slice(0, 4).map((wf: any) => (
                <CommandItem
                  key={wf.id}
                  value={`workflow ${wf.name} ${wf.description || ''}`}
                  onSelect={() => runCommand(() => { onNavigate('workflows'); openDetail('workflow', wf) })}
                >
                  <GitBranch className="mr-2 h-4 w-4 text-violet-500" />
                  <span>{wf.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{wf.steps?.length || 0} steps</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
