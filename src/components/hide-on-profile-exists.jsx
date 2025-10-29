"use client"

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Envuelve hijos y los oculta si el perfil existe. Mientras chequea, muestra skeleton del contenedor.
export default function HideOnProfileExists({ children, sessionUrl, sessionName, apiKey, delayMs = 500, showSkeletonWhileChecking = true }) {
  const [exists, setExists] = useState(false)
  const [checking, setChecking] = useState(true)

  const baseUrl = sessionUrl ? (sessionUrl.endsWith('/') ? sessionUrl.slice(0, -1) : sessionUrl) : null
  const profileUrl = (baseUrl && sessionName) ? `${baseUrl}/api/${encodeURIComponent(sessionName)}/profile` : null

  useEffect(() => {
    if (!profileUrl) {
      setChecking(false)
      setExists(false)
      return
    }
    let mounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      if (!mounted) return
      try {
        const res = await fetch(profileUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
          },
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!mounted) return
        setExists(res.ok)
      } catch (_) {
        if (!mounted) return
        setExists(false)
      } finally {
        if (mounted) setChecking(false)
      }
    }, Math.max(0, Number(delayMs) || 0))

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [profileUrl, apiKey, delayMs])

  if (exists) return null
  if (checking && showSkeletonWhileChecking) {
    return (
      <div className="rounded-lg border p-6">
        <Skeleton className="h-5 w-56" />
        <div className="mt-2 flex flex-col gap-1">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}