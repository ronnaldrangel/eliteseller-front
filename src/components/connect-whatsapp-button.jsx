"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ConnectWhatsAppButton({ documentId }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!documentId) return
    setLoading(true)
    try {
      const res = await fetch("https://n8n.eliteseller.app/webhook/create-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      })
      if (res.status === 200) {
        toast.success("WhatsApp conectado")
      } else {
        const body = await res.json().catch(() => ({}))
        const msg = body?.error?.message || `No se pudo conectar (status ${res.status})`
        toast.error(msg)
      }
    } catch (_) {
      toast.error("Error de red al conectar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" className="w-full md:w-auto" onClick={handleClick} disabled={loading || !documentId}>
      {loading ? "Conectando…" : "Conectar WhatsApp"}
    </Button>
  )
}