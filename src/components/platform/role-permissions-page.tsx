'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users, Shield, Key, Plus, MoreHorizontal, Search, Edit2, Trash2, UserPlus,
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ChevronDown, Lock,
  Mail, Phone, Building2, Briefcase, Clock, ArrowRight, Copy, Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──
interface Permission {
  id: string
  code: string
  name: string
  module: string
  description: string | null
  _count?: { rolePermissions: number }
}

interface RolePermission {
  id: string
  permission: Permission
}

interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  is_system: boolean
  rolePermissions: RolePermission[]
  _count: { userRoles: number }
}

interface UserRole {
  id: string
  role: Role
}

interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  status: string
  last_login_at: string | null
  created_at: string
  updated_at: string
  userRoles: UserRole[]
}

interface RolePermissionsPageProps {
  onToast: (type: 'success' | 'error', message: string) => void
}

// ── Module display config ──
const MODULE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  dashboard: { label: 'Dashboard', icon: Eye, color: '#6366f1' },
  clients: { label: 'Clients', icon: Users, color: '#0891b2' },
  projects: { label: 'Projects', icon: Briefcase, color: '#059669' },
  approvals: { label: 'Approvals', icon: ShieldCheck, color: '#d97706' },
  finance: { label: 'Finance', icon: Building2, color: '#7c3aed' },
  workflows: { label: 'Workflows', icon: ArrowRight, color: '#2563eb' },
  'field-sync': { label: 'Field Sync', icon: Phone, color: '#be185d' },
  spatial: { label: 'Spatial', icon: Building2, color: '#0d9488' },
  ai: { label: 'AI & Insights', icon: Key, color: '#6d28d9' },
  documents: { label: 'Documents', icon: Mail, color: '#0369a1' },
  communications: { label: 'Communications', icon: Mail, color: '#c026d3' },
  organizations: { label: 'Organizations', icon: Building2, color: '#475569' },
  reports: { label: 'Reports', icon: Eye, color: '#ea580c' },
  audit: { label: 'Audit Trail', icon: Clock, color: '#64748b' },
  settings: { label: 'Settings', icon: Lock, color: '#374151' },
  users: { label: 'Users & Roles', icon: Shield, color: '#dc2626' },
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  inactive: { label: 'Inactive', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
  suspended: { label: 'Suspended', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const DEPARTMENTS = ['IT', 'Surveying', 'Operations', 'Finance', 'Client Services', 'Spatial', 'Management', 'Legal']

// ── Helper: get initials ──
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Helper: format date ──
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Main Component ──
export function RolePermissionsPage({ onToast }: RolePermissionsPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permModules, setPermModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialog states
  const [userDialog, setUserDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; user: User | null }>({ open: false, mode: 'create', user: null })
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; role: Role | null }>({ open: false, mode: 'create', role: null })
  const [assignRoleDialog, setAssignRoleDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [permMatrixDialog, setPermMatrixDialog] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'user' | 'role'; item: any }>({ open: false, type: 'user', item: null })

  // Form states
  const [userForm, setUserForm] = useState({ email: '', name: '', phone: '', job_title: '', department: '', status: 'active', role_ids: [] as string[] })
  const [roleForm, setRoleForm] = useState({ name: '', display_name: '', description: '', color: '#10b981', permission_ids: [] as string[] })
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ])
      if (usersRes.ok) setUsers(await usersRes.json())
      if (rolesRes.ok) {
        const rData = await rolesRes.json()
        setRoles(rData)
      }
      if (permsRes.ok) {
        const pData = await permsRes.json()
        setPermissions(pData.permissions || [])
        setPermModules(pData.modules || [])
      }
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── User CRUD ──
  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      if (!res.ok) {
        const err = await res.json()
        onToast('error', err.error || 'Failed to create user')
        return
      }
      onToast('success', `User "${userForm.name}" created successfully`)
      setUserDialog({ open: false, mode: 'create', user: null })
      setUserForm({ email: '', name: '', phone: '', job_title: '', department: '', status: 'active', role_ids: [] })
      fetchData()
    } catch {
      onToast('error', 'Failed to create user')
    }
  }

  const handleUpdateUser = async () => {
    if (!userDialog.user) return
    try {
      const res = await fetch(`/api/users/${userDialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      if (!res.ok) {
        onToast('error', 'Failed to update user')
        return
      }
      onToast('success', `User "${userForm.name}" updated`)
      setUserDialog({ open: false, mode: 'create', user: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/users/${deleteDialog.item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        onToast('error', 'Failed to delete user')
        return
      }
      onToast('success', 'User deleted')
      setDeleteDialog({ open: false, type: 'user', item: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to delete user')
    }
  }

  // ── Role CRUD ──
  const handleCreateRole = async () => {
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      })
      if (!res.ok) {
        const err = await res.json()
        onToast('error', err.error || 'Failed to create role')
        return
      }
      onToast('success', `Role "${roleForm.display_name}" created`)
      setRoleDialog({ open: false, mode: 'create', role: null })
      setRoleForm({ name: '', display_name: '', description: '', color: '#10b981', permission_ids: [] })
      fetchData()
    } catch {
      onToast('error', 'Failed to create role')
    }
  }

  const handleUpdateRole = async () => {
    if (!roleDialog.role) return
    try {
      const res = await fetch(`/api/roles/${roleDialog.role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      })
      if (!res.ok) {
        onToast('error', 'Failed to update role')
        return
      }
      onToast('success', `Role "${roleForm.display_name}" updated`)
      setRoleDialog({ open: false, mode: 'create', role: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to update role')
    }
  }

  const handleDeleteRole = async () => {
    try {
      const res = await fetch(`/api/roles/${deleteDialog.item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        onToast('error', err.error || 'Failed to delete role')
        return
      }
      onToast('success', 'Role deleted')
      setDeleteDialog({ open: false, type: 'role', item: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to delete role')
    }
  }

  // ── Assign Roles to User ──
  const handleAssignRoles = async () => {
    if (!assignRoleDialog.user) return
    try {
      const res = await fetch(`/api/users/${assignRoleDialog.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_ids: selectedRoleIds }),
      })
      if (!res.ok) {
        onToast('error', 'Failed to assign roles')
        return
      }
      onToast('success', 'Roles updated')
      setAssignRoleDialog({ open: false, user: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to assign roles')
    }
  }

  // ── Sync Role Permissions ──
  const handleSyncPermissions = async () => {
    if (!permMatrixDialog.role) return
    try {
      const res = await fetch(`/api/roles/${permMatrixDialog.role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: selectedPermIds }),
      })
      if (!res.ok) {
        onToast('error', 'Failed to update permissions')
        return
      }
      onToast('success', 'Permissions updated')
      setPermMatrixDialog({ open: false, role: null })
      fetchData()
    } catch {
      onToast('error', 'Failed to update permissions')
    }
  }

  // ── Open Dialog Helpers ──
  const openEditUser = (user: User) => {
    setUserForm({
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      job_title: user.job_title || '',
      department: user.department || '',
      status: user.status,
      role_ids: user.userRoles.map(ur => ur.role.id),
    })
    setUserDialog({ open: true, mode: 'edit', user })
  }

  const openEditRole = (role: Role) => {
    setRoleForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      color: role.color,
      permission_ids: role.rolePermissions.map(rp => rp.permission.id),
    })
    setRoleDialog({ open: true, mode: 'edit', role })
  }

  const openAssignRoles = (user: User) => {
    setSelectedRoleIds(user.userRoles.map(ur => ur.role.id))
    setAssignRoleDialog({ open: true, user })
  }

  const openPermMatrix = (role: Role) => {
    setSelectedPermIds(role.rolePermissions.map(rp => rp.permission.id))
    setPermMatrixDialog({ open: true, role })
  }

  // ── Toggle Permission in Matrix ──
  const togglePermission = (permId: string) => {
    setSelectedPermIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    )
  }

  const toggleModuleAll = (module: string) => {
    const modulePerms = permissions.filter(p => p.module === module).map(p => p.id)
    const allSelected = modulePerms.every(id => selectedPermIds.includes(id))
    if (allSelected) {
      setSelectedPermIds(prev => prev.filter(id => !modulePerms.includes(id)))
    } else {
      setSelectedPermIds(prev => [...new Set([...prev, ...modulePerms])])
    }
  }

  // ── Filtered Data ──
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRoles = roles.filter(r =>
    r.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ── Stats ──
  const activeUsers = users.filter(u => u.status === 'active').length
  const totalPermissions = permissions.length
  const totalRoles = roles.length

  // ── Color Swatches ──
  const COLOR_OPTIONS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#059669', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#e11d48', '#6b7280']

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-72" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Active Users', value: activeUsers, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Roles', value: totalRoles, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: 'Permissions', value: totalPermissions, icon: Key, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="h-10">
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5" /> Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" /> Permissions
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 w-56 text-sm"
              />
            </div>
            {activeTab === 'users' && (
              <Button size="sm" className="h-9 gap-1.5" onClick={() => {
                setUserForm({ email: '', name: '', phone: '', job_title: '', department: '', status: 'active', role_ids: [] })
                setUserDialog({ open: true, mode: 'create', user: null })
              }}>
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </Button>
            )}
            {activeTab === 'roles' && (
              <Button size="sm" className="h-9 gap-1.5" onClick={() => {
                setRoleForm({ name: '', display_name: '', description: '', color: '#10b981', permission_ids: [] })
                setRoleDialog({ open: true, mode: 'create', role: null })
              }}>
                <Plus className="w-3.5 h-3.5" /> Add Role
              </Button>
            )}
          </div>
        </div>

        {/* ══════════════ USERS TAB ══════════════ */}
        <TabsContent value="users" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Job Title</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Department</TableHead>
                    <TableHead className="text-xs">Roles</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Last Login</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {searchTerm ? 'No users match your search' : 'No users yet. Click "Add User" to get started.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => {
                      const statusStyle = STATUS_STYLES[user.status] || STATUS_STYLES.inactive
                      return (
                        <TableRow key={user.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm">
                                <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: user.userRoles[0]?.role?.color || '#6b7280', color: '#fff' }}>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {user.job_title || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {user.department ? <Badge variant="outline" className="text-[10px]">{user.department}</Badge> : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.userRoles.length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">No role</span>
                              ) : (
                                user.userRoles.map(ur => (
                                  <Badge
                                    key={ur.id}
                                    className="text-[10px] font-medium text-white border-0"
                                    style={{ backgroundColor: ur.role.color }}
                                  >
                                    {ur.role.display_name}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${statusStyle.color} ${statusStyle.bg}`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'suspended' ? 'bg-red-500' : 'bg-slate-400'}`} />
                              {statusStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                            {fmtDate(user.last_login_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => openEditUser(user)}>
                                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAssignRoles(user)}>
                                  <Shield className="w-3.5 h-3.5 mr-2" /> Assign Roles
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialog({ open: true, type: 'user', item: user })}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════ ROLES TAB ══════════════ */}
        <TabsContent value="roles" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {searchTerm ? 'No roles match your search' : 'No roles yet. Click "Add Role" to create one.'}
              </div>
            ) : (
              filteredRoles.map(role => {
                const permCount = role.rolePermissions.length
                const userCount = role._count.userRoles
                return (
                  <Card key={role.id} className="group hover:shadow-md transition-all border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: role.color }}
                          >
                            {role.display_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              {role.display_name}
                              {role.is_system && (
                                <Lock className="w-3 h-3 text-amber-500" title="System role" />
                              )}
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground font-mono">@{role.name}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEditRole(role)}>
                              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPermMatrix(role)}>
                              <Key className="w-3.5 h-3.5 mr-2" /> Manage Permissions
                            </DropdownMenuItem>
                            {!role.is_system && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialog({ open: true, type: 'role', item: role })}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Role
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {role.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-2">{role.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                          <p className="text-lg font-bold" style={{ color: role.color }}>{permCount}</p>
                          <p className="text-[10px] text-muted-foreground">Permissions</p>
                        </div>
                        <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                          <p className="text-lg font-bold" style={{ color: role.color }}>{userCount}</p>
                          <p className="text-[10px] text-muted-foreground">Users</p>
                        </div>
                      </div>
                      {/* Permission preview - show module badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {[...new Set(role.rolePermissions.map(rp => rp.permission.module))].slice(0, 5).map(mod => {
                          const cfg = MODULE_CONFIG[mod]
                          return cfg ? (
                            <Badge key={mod} variant="secondary" className="text-[9px] py-0 px-1.5">
                              {cfg.label}
                            </Badge>
                          ) : null
                        })}
                        {[...new Set(role.rolePermissions.map(rp => rp.permission.module))].length > 5 && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                            +{[...new Set(role.rolePermissions.map(rp => rp.permission.module))].length - 5} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* ══════════════ PERMISSIONS TAB ══════════════ */}
        <TabsContent value="permissions" className="mt-4">
          <div className="space-y-4">
            {permModules.map(mod => {
              const cfg = MODULE_CONFIG[mod] || { label: mod, icon: Key, color: '#6b7280' }
              const modPerms = permissions.filter(p => p.module === mod)
              return (
                <Card key={mod} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                      >
                        <cfg.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{cfg.label}</CardTitle>
                        <p className="text-[11px] text-muted-foreground">{modPerms.length} permission{modPerms.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {modPerms.map(perm => (
                        <div
                          key={perm.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                        >
                          <Key className="w-3 h-3 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium">{perm.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{perm.code}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] ml-1 py-0">
                            {perm._count?.rolePermissions || 0} roles
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ══════════════ CREATE / EDIT USER DIALOG ══════════════ */}
      <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              {userDialog.mode === 'create' ? 'Create New User' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {userDialog.mode === 'create' ? 'Add a new user to the platform and optionally assign roles.' : 'Update user details and role assignments.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Full Name *</Label>
                <Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="john@gws.co.ug" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+256 700 000000" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={userForm.status} onValueChange={v => setUserForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Job Title</Label>
                <Input value={userForm.job_title} onChange={e => setUserForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Survey Manager" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Department</Label>
                <Select value={userForm.department} onValueChange={v => setUserForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Assign Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(role => (
                  <label
                    key={role.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      userForm.role_ids.includes(role.id)
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={userForm.role_ids.includes(role.id)}
                      onChange={() => {
                        setUserForm(p => ({
                          ...p,
                          role_ids: p.role_ids.includes(role.id)
                            ? p.role_ids.filter(r => r !== role.id)
                            : [...p.role_ids, role.id],
                        }))
                      }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: role.color,
                        backgroundColor: userForm.role_ids.includes(role.id) ? role.color : 'transparent',
                      }}
                    >
                      {userForm.role_ids.includes(role.id) && <CheckCircle2 className="w-2 h-2 text-white" />}
                    </div>
                    <span className="text-xs font-medium">{role.display_name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUserDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button size="sm" onClick={userDialog.mode === 'create' ? handleCreateUser : handleUpdateUser} disabled={!userForm.name || !userForm.email}>
              {userDialog.mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ CREATE / EDIT ROLE DIALOG ══════════════ */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-600" />
              {roleDialog.mode === 'create' ? 'Create New Role' : 'Edit Role'}
            </DialogTitle>
            <DialogDescription>
              {roleDialog.mode === 'create' ? 'Define a new role with a name, color, and description.' : 'Update role details. System roles cannot be renamed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Role Name (identifier) *</Label>
                <Input
                  value={roleForm.name}
                  onChange={e => setRoleForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="e.g. survey_manager"
                  disabled={roleDialog.mode === 'edit' && roleDialog.role?.is_system}
                />
                <p className="text-[10px] text-muted-foreground">Lowercase, underscores only</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Display Name *</Label>
                <Input value={roleForm.display_name} onChange={e => setRoleForm(p => ({ ...p, display_name: e.target.value }))} placeholder="e.g. Survey Manager" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={roleForm.description} onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this role do?" rows={2} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Role Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${roleForm.color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setRoleForm(p => ({ ...p, color: c }))}
                  />
                ))}
              </div>
            </div>
            {/* Quick Permission Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Permissions</Label>
                <Badge variant="secondary" className="text-[10px]">{roleForm.permission_ids.length} of {permissions.length}</Badge>
              </div>
              <ScrollArea className="h-48 rounded-lg border p-3">
                <div className="space-y-3">
                  {permModules.map(mod => {
                    const cfg = MODULE_CONFIG[mod] || { label: mod, color: '#6b7280' }
                    const modPerms = permissions.filter(p => p.module === mod)
                    const allSelected = modPerms.every(p => roleForm.permission_ids.includes(p.id))
                    return (
                      <div key={mod}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => {
                              const modPermIds = modPerms.map(p => p.id)
                              if (allSelected) {
                                setRoleForm(p => ({ ...p, permission_ids: p.permission_ids.filter(id => !modPermIds.includes(id)) }))
                              } else {
                                setRoleForm(p => ({ ...p, permission_ids: [...new Set([...p.permission_ids, ...modPermIds])] }))
                              }
                            }}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {modPerms.map(perm => (
                            <Badge
                              key={perm.id}
                              variant={roleForm.permission_ids.includes(perm.id) ? 'default' : 'outline'}
                              className={`text-[10px] cursor-pointer transition-colors ${
                                roleForm.permission_ids.includes(perm.id) ? '' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              style={roleForm.permission_ids.includes(perm.id) ? { backgroundColor: roleForm.color } : {}}
                              onClick={() => {
                                setRoleForm(p => ({
                                  ...p,
                                  permission_ids: p.permission_ids.includes(perm.id)
                                    ? p.permission_ids.filter(id => id !== perm.id)
                                    : [...p.permission_ids, perm.id],
                                }))
                              }}
                            >
                              {perm.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRoleDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button size="sm" onClick={roleDialog.mode === 'create' ? handleCreateRole : handleUpdateRole} disabled={!roleForm.name || !roleForm.display_name}>
              {roleDialog.mode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ ASSIGN ROLES DIALOG ══════════════ */}
      <Dialog open={assignRoleDialog.open} onOpenChange={(open) => setAssignRoleDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-600" />
              Assign Roles
            </DialogTitle>
            <DialogDescription>
              {assignRoleDialog.user ? `Manage roles for ${assignRoleDialog.user.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {assignRoleDialog.user && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: assignRoleDialog.user.userRoles[0]?.role?.color || '#6b7280', color: '#fff' }}>
                    {getInitials(assignRoleDialog.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{assignRoleDialog.user.name}</p>
                  <p className="text-xs text-muted-foreground">{assignRoleDialog.user.email}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {roles.map(role => {
                const isSelected = selectedRoleIds.includes(role.id)
                const userCount = role._count?.userRoles || 0
                return (
                  <label
                    key={role.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-700'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedRoleIds(prev =>
                          prev.includes(role.id) ? prev.filter(r => r !== role.id) : [...prev, role.id]
                        )
                      }}
                    />
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center border-2 transition-colors"
                      style={{
                        borderColor: role.color,
                        backgroundColor: isSelected ? role.color : 'transparent',
                      }}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{role.display_name}</span>
                        {role.is_system && <Lock className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{role.rolePermissions.length} permissions · {userCount} users</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAssignRoleDialog({ open: false, user: null })}>Cancel</Button>
            <Button size="sm" onClick={handleAssignRoles}>
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ PERMISSION MATRIX DIALOG ══════════════ */}
      <Dialog open={permMatrixDialog.open} onOpenChange={(open) => setPermMatrixDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Permission Matrix
            </DialogTitle>
            <DialogDescription>
              {permMatrixDialog.role ? `Manage permissions for "${permMatrixDialog.role.display_name}" role` : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 py-2">
              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedPermIds(permissions.map(p => p.id))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedPermIds([])}
                >
                  Deselect All
                </Button>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {selectedPermIds.length} / {permissions.length} permissions
                </Badge>
              </div>
              <Separator />
              {permModules.map(mod => {
                const cfg = MODULE_CONFIG[mod] || { label: mod, icon: Key, color: '#6b7280' }
                const modPerms = permissions.filter(p => p.module === mod)
                const allSelected = modPerms.every(p => selectedPermIds.includes(p.id))
                const someSelected = modPerms.some(p => selectedPermIds.includes(p.id))
                return (
                  <Card key={mod} className={`border shadow-none ${someSelected ? 'border-slate-300 dark:border-slate-600' : ''}`}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                          >
                            <cfg.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm font-medium">{cfg.label}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {modPerms.filter(p => selectedPermIds.includes(p.id)).length}/{modPerms.length}
                          </Badge>
                        </div>
                        <Switch
                          checked={allSelected}
                          onCheckedChange={() => toggleModuleAll(mod)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {modPerms.map(perm => {
                          const isChecked = selectedPermIds.includes(perm.id)
                          return (
                            <button
                              key={perm.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                isChecked
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                              style={isChecked ? { backgroundColor: permMatrixDialog.role?.color || '#10b981' } : {}}
                              onClick={() => togglePermission(perm.id)}
                            >
                              {isChecked ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3 opacity-30" />}
                              {perm.name}
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPermMatrixDialog({ open: false, role: null })}>Cancel</Button>
            <Button size="sm" onClick={handleSyncPermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════ DELETE CONFIRMATION DIALOG ══════════════ */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {deleteDialog.type === 'user'
                ? `Are you sure you want to delete user "${deleteDialog.item?.name}"? This action cannot be undone.`
                : `Are you sure you want to delete role "${deleteDialog.item?.display_name}"? Users with this role will lose the associated permissions.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ open: false, type: 'user', item: null })}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={deleteDialog.type === 'user' ? handleDeleteUser : handleDeleteRole}>
              Delete {deleteDialog.type === 'user' ? 'User' : 'Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
