"use client"
 
import { useEffect, useState } from 'react'
import WazendSessionProfile from '@/components/wazend-session-profile'
import { Skeleton } from '@/components/ui/skeleton'
 
// Renderiza el perfil si existe; si no, muestra el fallback (children) "Conecta tu WhatsApp Business".
// Versión sencilla: un único fetch en este wrapper, sin caché compartido.
export default function WazendProfileOrConnect({ sessionUrl, sessionName, apiKey, maskedApiKey, delayMs = 300, children }) {
  const [status, setStatus] = useState(null)
  const [payload, setPayload] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState('idle')
  const [refreshKey, setRefreshKey] = useState(0)
 
  const baseUrl = sessionUrl ? (sessionUrl.endsWith('/') ? sessionUrl.slice(0, -1) : sessionUrl) : null
  const profileUrl = (baseUrl && sessionName) ? `${baseUrl}/api/${encodeURIComponent(sessionName)}/profile` : null
 
  // Escucha el evento global para refrescar el perfil tras cerrar el modal de Auth QR
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    try { window.addEventListener('wazend:profile:refresh', handler) } catch {}
    return () => {
      try { window.removeEventListener('wazend:profile:refresh', handler) } catch {}
    }
  }, [])
 
  useEffect(() => {
    if (!profileUrl) return
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
  }, [profileUrl, apiKey, delayMs, refreshKey])
 
  // Sin datos suficientes, mostramos el fallback
  if (!profileUrl) return <>{children}</>
 
  // Mostrar skeleton durante la carga para evitar hueco visual.
  if (loading) {
    return (
      <div className="rounded-lg border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 sm:w-1/2">
          <Skeleton className="h-6 w-56" />
          <div className="mt-2 flex flex-col gap-2">
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
        <div className="w-full sm:w-1/2">
          <Skeleton className="h-48 sm:h-64 w-full rounded-md" />
        </div>
      </div>
    )
  }
 
  const hasProfile = status >= 200 && status < 300 && status !== 422
 
  if (hasProfile) {
    return (
      <WazendSessionProfile
        sessionUrl={sessionUrl}
        sessionName={sessionName}
        apiKey={apiKey}
        maskedApiKey={maskedApiKey}
        delayMs={0}
        prefetchedProfile={{ status, payload, errorMsg }}
      />
    )
  }
 
  // Fallback: muestra el contenido de conexión si no hay perfil
  return <>{children}</>
}