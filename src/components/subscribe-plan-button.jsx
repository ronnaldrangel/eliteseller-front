"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SubscribePlanButton({ planId, userId }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (!planId || !userId || loading) return
    setLoading(true)
    try {
      const url = `/api/plans/subscribe?plan_id=${encodeURIComponent(planId)}&userId=${encodeURIComponent(userId)}`
      const res = await fetch(url, { method: "GET" })
      const contentType = res.headers.get("content-type") || ""
      let data = null
      let text = null
      if (contentType.includes("application/json")) {
        try { data = await res.json() } catch {}
      } else {
        try { text = await res.text() } catch {}
      }

      if (res.ok) {
        let target = data?.url || data?.redirectUrl || data?.href || null
        if (typeof target === "string" && target.startsWith("vhttp")) {
          target = target.slice(1)
        }
        if (typeof target === "string" && target.length > 0) {
          toast.success("Suscripción iniciada")
          window.location.href = target
          return
        }
        const msg = (data && data.text) || text || "Error en el sistema."
        if (msg) toast.success(msg)
      } else {
        if (res.status === 403) {
          router.push("/billing")
          return
        }
        const msg = (data && (data.text || data?.error?.message)) || text || `No se pudo iniciar la suscripción (status ${res.status})`
        toast.error(msg)
      }
    } catch (_) {
      toast.error("Error conectando con el servicio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" size="lg" className="w-full mt-auto h-12 text-base" onClick={handleClick} disabled={loading || !planId || !userId}>
      {loading ? "Procesando…" : "Empieza ahora"}
    </Button>
  )
}