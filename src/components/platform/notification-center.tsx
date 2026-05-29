'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell, CheckCircle2, Clock3, AlertCircle, Users, MapPin,
  Receipt, GitBranch, ShieldCheck, Eye, Trash2, Check,
} from 'lucide-react'
import { fmt } from './constants'

interface NotificationCenterProps {
  events: any[]
  onNavigate?: (page: string) => void
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  client: <Users className="w-3 h-3" />,
  project: <MapPin className="w-3 h-3" />,
  invoice: <Receipt className="w-3 h-3" />,
  approval: <CheckCircle2 className="w-3 h-3" />,
  workflow: <GitBranch className="w-3 h-3" />,
  observation: <Eye className="w-3 h-3" />,
}

const EVENT_COLORS: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  project: 'bg-emerald-100 text-emerald-700',
  invoice: 'bg-amber-100 text-amber-700',
  approval: 'bg-green-100 text-green-700',
  workflow: 'bg-violet-100 text-violet-700',
  observation: 'bg-rose-100 text-rose-700',
}

export function NotificationCenter({ events, onNavigate }: NotificationCenterProps) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gws-notification-read')
      if (saved) setReadIds(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  // Save read IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gws-notification-read', JSON.stringify(Array.from(readIds)))
    } catch {}
  }, [readIds])

  const notifications = (events || []).slice(0, 15).map((e: any, i: number) => ({
    id: `notif-${e.id || i}`,
    type: (e.aggregate || e.event_type || 'project') as string,
    action: fmt(e.event_type || e.action || 'created'),
    description: e.description || e.metadata?.title || e.aggregate_id || 'System event',
    timestamp: e.occurred_at || e.created_at || new Date().toISOString(),
    aggregate: e.aggregate,
  }))

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }

  const markRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]))
  }

  const clearAll = () => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative" title="Notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-in zoom-in duration-200">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={markAllRead}>
                <Check className="w-3 h-3 mr-1" />Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={clearAll}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications</p>
              <p className="text-xs text-slate-400 mt-1">Events will appear here as they occur</p>
            </div>
          ) : (
            <div>
              {notifications.map((n, idx) => {
                const isUnread = !readIds.has(n.id)
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b last:border-b-0 ${isUnread ? 'bg-emerald-50/50' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${EVENT_COLORS[n.type] || 'bg-slate-100 text-slate-600'}`}>
                        {EVENT_ICONS[n.type] || <AlertCircle className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-800">{n.action}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{n.type}</span>
                          {isUnread && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.description}</p>
                        <span className="text-[10px] text-slate-400">{timeAgo(n.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t bg-slate-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-emerald-700 hover:text-emerald-800"
              onClick={() => { setIsOpen(false); onNavigate?.('audit') }}
            >
              View All in Audit Trail
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
