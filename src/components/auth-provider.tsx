'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import type { DefaultSession } from 'next-auth'
import { PAGE_PERMISSIONS, PAGE_EDIT_PERMISSIONS } from '@/lib/permissions'

// ── Extended Session Types ──
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
    } & DefaultSession['user'] & {
      roles: Array<{
        id: string
        name: string
        display_name: string
        color: string
      }>
      permissions: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: Array<{
      id: string
      name: string
      display_name: string
      color: string
    }>
    permissions: string[]
  }
}

// ── Auth Context Types ──
interface AuthContextType {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    roles: Array<{
      id: string
      name: string
      display_name: string
      color: string
    }>
    permissions: string[]
  } | null
  role: string | null
  roleDisplayName: string | null
  roleColor: string | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasPageAccess: (pageId: string, mode?: 'view' | 'edit') => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// ── Auth Provider Inner (needs useSession) ──
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  const user = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      image: session.user.image,
      roles: (session.user as any).roles || [],
      permissions: (session.user as any).permissions || [],
    }
  }, [session])

  const role = useMemo(() => {
    if (!user?.roles?.length) return null
    return user.roles[0].name
  }, [user])

  const roleDisplayName = useMemo(() => {
    if (!user?.roles?.length) return null
    return user.roles[0].display_name
  }, [user])

  const roleColor = useMemo(() => {
    if (!user?.roles?.length) return null
    return user.roles[0].color
  }, [user])

  const permissions = useMemo(() => {
    return user?.permissions || []
  }, [user])

  const hasPermission = useMemo(() => {
    return (permission: string) => {
      if (!permissions.length) return false
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    }
  }, [permissions])

  const hasAnyPermission = useMemo(() => {
    return (perms: string[]) => {
      if (!permissions.length) return false
      if (permissions.includes('*')) return true
      return perms.some(p => permissions.includes(p))
    }
  }, [permissions])

  const hasPageAccess = useMemo(() => {
    return (pageId: string, mode: 'view' | 'edit' = 'view') => {
      if (!permissions.length) return false
      if (permissions.includes('*')) return true

      if (mode === 'edit') {
        const editPerm = PAGE_EDIT_PERMISSIONS[pageId]
        return editPerm ? permissions.includes(editPerm) : true
      }

      const viewPerms = PAGE_PERMISSIONS[pageId]
      if (!viewPerms) return true
      return viewPerms.some((p: string) => permissions.includes(p))
    }
  }, [permissions])

  const signOut = () => {
    nextAuthSignOut({ callbackUrl: '/' })
  }

  const value = useMemo(() => ({
    user,
    role,
    roleDisplayName,
    roleColor,
    permissions,
    isAuthenticated,
    isLoading,
    signOut,
    hasPermission,
    hasAnyPermission,
    hasPageAccess,
  }), [user, role, roleDisplayName, roleColor, permissions, isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasPageAccess])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Exported Auth Provider ──
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

// ── useAuth Hook ──
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
