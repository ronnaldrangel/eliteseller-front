"use client"
 
import { useEffect, useState } from 'react'
import WazendSessionActions from '@/components/wazend-session-actions'
import { Skeleton } from '@/components/ui/skeleton'
 
export default function WazendSessionProfile({ sessionUrl, sessionName, apiKey, maskedApiKey, delayMs = 700, prefetchedProfile }) {
  const [status, setStatus] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState('idle')
 
  const baseUrl = sessionUrl ? (sessionUrl.endsWith('/') ? sessionUrl.slice(0, -1) : sessionUrl) : null
  const profileUrl = (baseUrl && sessionName) ? `${baseUrl}/api/${encodeURIComponent(sessionName)}/profile` : null
 
  // Si viene prefetchedProfile, usamos eso y NO hacemos fetch
  useEffect(() => {
    if (prefetchedProfile) {
      setStatus(prefetchedProfile.status ?? null)
      setPayload(prefetchedProfile.payload ?? null)
      setErrorMsg(prefetchedProfile.errorMsg ?? null)
      setLoading(null)
    }
  }, [prefetchedProfile])
 
  useEffect(() => {
    if (!profileUrl) return
    if (prefetchedProfile) return // ya tenemos datos
    let mounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      if (!mounted) return
      setLoading('fetch')
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
        setStatus(res.status)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErrorMsg(data?.error?.message || `No se pudo obtener perfil (status ${res.status})`)
          setPayload(data)
        } else {
          setPayload(data)
        }
      } catch (e) {
        if (!mounted) return
        if (e?.name !== 'AbortError') setErrorMsg('Error al conectar con Wazend (profile).')
      } finally {
        if (mounted) setLoading(null)
      }
    }, Math.max(0, Number(delayMs) || 0))
 
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [profileUrl, apiKey, delayMs, prefetchedProfile])
 
  // Oculta toda la tarjeta si el perfil devolvió 422
  if (status === 422) return null
  if (!profileUrl) return null
 
  const picture = payload?.picture
  const displayName = payload?.name ?? '—'
  const displayId = payload?.id ?? '—'
 
  if (loading) {
    return (
      <div className="rounded-lg border p-6">
        <Skeleton className="h-5 w-40" />
        <div className="mt-2 flex flex-col gap-1">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-56" />
        </div>
 
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
 
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
 
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    )
  }
 
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Perfil de sesión</h2>
      {/* <p className="text-xs text-muted-foreground">URL: {profileUrl || '—'}</p>
      <p className="text-xs text-muted-foreground">X-Api-Key: {maskedApiKey || '—'}</p> */}
 
      {errorMsg ? (
        <p className="text-sm text-destructive mt-2">{errorMsg}</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted">
              {picture ? (
                <img src={String(picture)} alt={String(displayName)} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  {(String(displayName || '').charAt(0) || '?').toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="text-base font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">ID: {displayId}</div>
            </div>
          </div>
        </>
      )}
 
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold">Acciones de sesión</h3>
          <span className="text-xs text-muted-foreground">Usa los botones para controlar la sesión</span>
        </div>
        <WazendSessionActions sessionName={sessionName} />
      </div>
    </div>
  )
}