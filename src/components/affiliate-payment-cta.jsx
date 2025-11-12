"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AffiliatePaymentCta({ userId }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      if (!userId) {
        toast.error("No se pudo iniciar la afiliación", {
          description: "Sesión no disponible: userId faltante.",
        })
        return
      }

      const res = await fetch("https://n8n.eliteseller.app/webhook/flow/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      let data = null
      try {
        data = await res.json()
      } catch (_) {
        data = null
      }
      const url = typeof data?.url === "string" ? data.url : null
      if (res.ok && url) {
        // Redirigir a la URL entregada por el webhook (externa)
        if (typeof window !== "undefined") {
          window.location.href = url
          return
        }
      } else {
        toast.error("No se pudo iniciar la afiliación", {
          description: data?.error?.message || "El servicio no devolvió una URL válida.",
        })
      }
    } catch (err) {
      console.warn("Webhook POST failed", err)
      toast.error("Error conectando con el servicio", {
        description: err?.message || "Inténtalo de nuevo.",
      })
    } finally {
      // Mantener al usuario en la página; no redirigir en error
      setIsSubmitting(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
      disabled={isSubmitting}
    >
      Afiliar método de pago
    </button>
  )
}