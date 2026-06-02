'use client'

import { useEffect } from 'react'
import { initServiceWorker } from '@/lib/register-sw'

/**
 * Client component that initializes the service worker on app mount.
 * Rendered in the layout so it runs once when the app loads.
 */
export function SWRegistrar() {
  useEffect(() => {
    initServiceWorker()
  }, [])

  return null
}
