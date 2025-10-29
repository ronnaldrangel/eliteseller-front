"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function ConnectNowDialog({ sessionName, triggerLabel = "Conectar ahora", trigger, triggerClassName, onClose }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(null)
  const [qrImageUrl, setQrImageUrl] = useState(null)
  const [qrValue, setQrValue] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // Limpieza de blob para evitar fugas
  useEffect(() => {
    return () => {
      if (qrImageUrl && qrImageUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(qrImageUrl) } catch {}
      }
    }
  }, [qrImageUrl])

  // Al abrir el diálogo, corre el flujo: restart -> auth/qr
  useEffect(() => {
    if (!open) return
    runAuthFlow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function runAuthFlow() {
    if (!sessionName) {
      setErrorMsg('Falta sessionName')
      return
    }
    // Resetea el estado previo
    setLoading('restart')
    setErrorMsg(null)
    setQrImageUrl(null)
    setQrValue(null)

    try {
      await fetch(`/api/wazend/session/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_name: sessionName }),
      })
    } catch (e) {
      // Continuamos igualmente con el QR
    }

    // Continúa con el QR
    setLoading('authqr')
    try {
      const res = await fetch(`/api/wazend/session/auth/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_name: sessionName }),
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('image/')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setQrImageUrl(url)
        setQrValue(null)
      } else {
        const data = await res.json().catch(() => ({}))
        const value = data?.data?.value ?? data?.value ?? null
        setQrValue(value)
        setQrImageUrl(value ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(value)}` : null)
        if (!value) setErrorMsg('No se recibió un valor de QR')
      }
    } catch (e) {
      setErrorMsg('No se pudo obtener el QR')
    } finally {
      setLoading(null)
    }
  }

  const handleOpenChange = (next) => {
    setOpen(next)
    if (!next) {
      try { onClose?.() } catch {}
      try { window.dispatchEvent(new CustomEvent('wazend:profile:refresh')) } catch {}
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger
          ? React.cloneElement(trigger, { disabled: !sessionName })
          : (
            <Button className={triggerClassName ?? "h-10 px-4"} disabled={!sessionName}>
              {triggerLabel}
            </Button>
          )}
      </DialogTrigger>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Conecta tu WhatsApp</DialogTitle>
          <DialogDescription>
            Escanea el código QR para vincular tu cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center min-h-72">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>{loading === 'restart' ? 'Reiniciando…' : 'Obteniendo QR…'}</span>
            </div>
          ) : ((qrImageUrl || qrValue) ? (
            qrImageUrl ? (
              <img src={qrImageUrl} alt="QR de autenticación" className="h-72 w-72 object-contain" />
            ) : (
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrValue)}`} alt="QR generado" className="h-72 w-72 object-contain" />
            )
          ) : (
            <div className="text-sm text-destructive">{errorMsg || 'No se pudo cargar el QR'}</div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={runAuthFlow} disabled={!sessionName || loading !== null}>
            Reintentar
          </Button>
          <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}