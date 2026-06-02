'use client'

import React, { useMemo } from 'react'
import { useAuth } from '@/components/auth-provider'
import { LoginPage } from '@/components/login-page'
import { MapPin, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PAGE_PERMISSIONS } from '@/lib/permissions'

interface AuthGuardProps {
  children: React.ReactNode
  currentPage?: string
}

export function AuthGuard({ children, currentPage }: AuthGuardProps) {
  const { isAuthenticated, isLoading, permissions, role } = useAuth()

  // Show loading spinner while session is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">GWS Platform V2</h2>
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Check if user has access to the current page
  if (currentPage && permissions.length > 0 && !permissions.includes('*')) {
    const requiredPerms = PAGE_PERMISSIONS[currentPage]
    if (requiredPerms && !requiredPerms.some(p => permissions.includes(p))) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 mb-4">
              <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Restricted
            </h2>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>Role: <strong>{role || 'Unknown'}</strong></span>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
