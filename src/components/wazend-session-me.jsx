"use client"

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function WazendSessionMe({ sessionUrl, sessionName, apiKey, maskedApiKey, delayMs = 700 }) {
  const [errorMsg, setErrorMsg] = useState(null)
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState('idle')

  const baseUrl = sessionUrl ? (sessionUrl.endsWith('/') ? sessionUrl.slice(0, -1) : sessionUrl) : null
  const meUrl = (baseUrl && sessionName) ? `${baseUrl}/api/${encodeURIComponent(sessionName)}/me` : null

  useEffect(() => {
    if (!meUrl) return
    let mounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      if (!mounted) return
      setLoading('fetch')
      try {
        const res = await fetch(meUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
          },
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!mounted) return
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErrorMsg(data?.error?.message || `No se pudo obtener estado (status ${res.status})`)
          setPayload(data)
        } else {
          setPayload(data)
        }
      } catch (e) {
        if (!mounted) return
        if (e?.name !== 'AbortError') setErrorMsg('Error al conectar con Wazend (me).')
      } finally {
        if (mounted) setLoading(null)
      }
    }, Math.max(0, Number(delayMs) || 0))

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [meUrl, apiKey, delayMs])

  if (!meUrl) return null

  if (loading) {
    return (
      <div className="rounded-lg border p-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-2 flex flex-col gap-1">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Sesión Wazend</h2>
      <p className="text-xs text-muted-foreground">URL: {meUrl || '—'}</p>
      <p className="text-xs text-muted-foreground">X-Api-Key: {maskedApiKey || '—'}</p>

      {errorMsg ? (
        <p className="text-sm text-destructive mt-2">{errorMsg}</p>
      ) : (
        <pre className="mt-2 bg-muted p-3 rounded text-xs overflow-x-auto">
          {payload ? JSON.stringify(payload, null, 2) : '—'}
        </pre>
      )}
    </div>
  )
}