'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MapPin, Triangle, Minus, Square, Circle, Pencil, Trash2, Eye,
  ChevronRight, Plus, Tag, Palette,
} from 'lucide-react'

// ── Types ──
export interface AnnotationItem {
  id: string
  feature_type: 'marker' | 'polygon' | 'polyline' | 'rectangle' | 'circle'
  title: string
  description?: string
  geojson: object
  properties?: {
    color?: string
    label?: string
  }
  created_at?: string
  layer_id?: string
}

interface MapAnnotationsProps {
  annotations: AnnotationItem[]
  drawnFeatures: Array<{
    type: 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle'
    geojson: object
    measurement?: string
  }>
  onZoomTo: (annotation: AnnotationItem) => void
  onSaveAnnotation: (data: { title: string; description: string; feature_type: string; geojson: object; color: string }) => void
  onUpdateAnnotation: (id: string, data: Partial<AnnotationItem>) => void
  onDeleteAnnotation: (id: string) => void
}

// ── Feature type icon + color mapping ──
const FEATURE_META: Record<string, { icon: any; color: string; label: string }> = {
  marker: { icon: MapPin, color: 'bg-amber-100 text-amber-700', label: 'Point' },
  polyline: { icon: Minus, color: 'bg-orange-100 text-orange-700', label: 'Line' },
  polygon: { icon: Triangle, color: 'bg-emerald-100 text-emerald-700', label: 'Polygon' },
  rectangle: { icon: Square, color: 'bg-purple-100 text-purple-700', label: 'Rectangle' },
  circle: { icon: Circle, color: 'bg-blue-100 text-blue-700', label: 'Circle' },
}

const COLOR_OPTIONS = [
  { value: '#10b981', label: 'Emerald' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#6b7280', label: 'Gray' },
]

export function MapAnnotations({
  annotations,
  drawnFeatures,
  onZoomTo,
  onSaveAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: MapAnnotationsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('#10b981')

  // New annotation from drawn feature
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedDrawnIdx, setSelectedDrawnIdx] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState('#10b981')

  const startEdit = (a: AnnotationItem) => {
    setEditingId(a.id)
    setEditTitle(a.title || '')
    setEditDescription(a.description || '')
    setEditColor(a.properties?.color || '#10b981')
  }

  const saveEdit = () => {
    if (editingId) {
      onUpdateAnnotation(editingId, {
        title: editTitle,
        description: editDescription,
        properties: { color: editColor },
      })
      setEditingId(null)
    }
  }

  const handleSaveDrawn = () => {
    if (selectedDrawnIdx !== null && drawnFeatures[selectedDrawnIdx]) {
      const feature = drawnFeatures[selectedDrawnIdx]
      onSaveAnnotation({
        title: newTitle || `Annotation ${annotations.length + 1}`,
        description: newDescription,
        feature_type: feature.type === 'polyline' ? 'polyline' : feature.type,
        geojson: feature.geojson,
        color: newColor,
      })
      setSaveDialogOpen(false)
      setNewTitle('')
      setNewDescription('')
      setSelectedDrawnIdx(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Saved Annotations ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Annotations ({annotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-52 overflow-y-auto">
          {annotations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No annotations yet. Draw on the map to create one.</p>
          ) : (
            annotations.map((a) => {
              const meta = FEATURE_META[a.feature_type] || FEATURE_META.marker
              const Icon = meta.icon
              const isEditing = editingId === a.id
              const color = a.properties?.color || '#6b7280'

              return (
                <div
                  key={a.id}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Title"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="text-xs min-h-[48px]"
                        placeholder="Description"
                      />
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-3 h-3 text-slate-400" />
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              background: c.value,
                              borderColor: editColor === c.value ? '#1e293b' : 'transparent',
                            }}
                            onClick={() => setEditColor(c.value)}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={saveEdit}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: color + '22' }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{a.title || 'Untitled'}</p>
                        {a.description && (
                          <p className="text-[10px] text-slate-400 truncate">{a.description}</p>
                        )}
                        <Badge variant="outline" className={`text-[9px] mt-0.5 ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
                          title="Zoom to"
                          onClick={() => onZoomTo(a)}
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
                          title="Edit"
                          onClick={() => startEdit(a)}
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="Delete"
                          onClick={() => onDeleteAnnotation(a.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* ── Drawn Features (unsaved) ── */}
      {drawnFeatures.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              Drawn Shapes ({drawnFeatures.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-40 overflow-y-auto">
            {drawnFeatures.map((f, idx) => {
              const meta = FEATURE_META[f.type] || FEATURE_META.marker
              const Icon = meta.icon
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-amber-600" />
                    <div>
                      <span className="text-xs font-medium text-amber-800">{meta.label}</span>
                      {f.measurement && (
                        <span className="text-[10px] text-amber-600 ml-1.5">{f.measurement}</span>
                      )}
                    </div>
                  </div>
                  <Dialog open={saveDialogOpen && selectedDrawnIdx === idx} onOpenChange={(open) => {
                    if (open) {
                      setSelectedDrawnIdx(idx)
                      setSaveDialogOpen(true)
                    } else {
                      setSaveDialogOpen(false)
                      setSelectedDrawnIdx(null)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100">
                        Save
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="text-sm">Save as Annotation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Annotation title"
                          className="text-sm"
                        />
                        <Textarea
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm min-h-[60px]"
                        />
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Color</label>
                          <div className="flex items-center gap-2">
                            {COLOR_OPTIONS.map((c) => (
                              <button
                                key={c.value}
                                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                  background: c.value,
                                  borderColor: newColor === c.value ? '#1e293b' : 'transparent',
                                }}
                                onClick={() => setNewColor(c.value)}
                              />
                            ))}
                          </div>
                        </div>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={handleSaveDrawn}
                          disabled={!newTitle.trim()}
                        >
                          Save Annotation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
