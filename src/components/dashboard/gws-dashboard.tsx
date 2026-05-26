'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Map,
  GitBranch,
  RefreshCw,
  Brain,
  Mountain,
} from 'lucide-react'
import { OverviewTab } from './overview-tab'
import { SpatialTab } from './spatial-tab'
import { WorkflowTab } from './workflow-tab'
import { FieldSyncTab } from './field-sync-tab'
import { AiTab } from './ai-tab'

export function GwsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600">
                <Mountain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                  GWS Platform V2
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  Geomatics Workstation Services Ltd
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  System Online
                </span>
              </div>
              <Badge variant="outline" className="text-xs hidden sm:flex">
                Uganda / East Africa
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="spatial" className="gap-1.5 text-xs sm:text-sm">
              <Map className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Spatial Map</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-1.5 text-xs sm:text-sm">
              <GitBranch className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Workflows</span>
              <span className="sm:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger value="field-sync" className="gap-1.5 text-xs sm:text-sm">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Field Sync</span>
              <span className="sm:hidden">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI & Insights</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="spatial">
            <SpatialTab />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowTab />
          </TabsContent>

          <TabsContent value="field-sync">
            <FieldSyncTab />
          </TabsContent>

          <TabsContent value="ai">
            <AiTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-gray-900/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Geomatics Workstation Services Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>GWS Platform V2</span>
              <span>·</span>
              <span>Land Surveying & Property Management</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
