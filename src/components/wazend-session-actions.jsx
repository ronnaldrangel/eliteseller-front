"use client"

import { useState } from "react"
import ConnectNowDialog from "@/components/connect-now-dialog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function WazendSessionActions({ sessionName }) {
  const [loading, setLoading] = useState(null)

  async function call(action) {
    if (!sessionName) return
    setLoading(action)
    try {
      const res = await fetch(`/api/wazend/session/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_name: sessionName }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(`Acción ${action} completada`, {
          description: `HTTP ${res.status}`,
        })
      } else {
        toast.error(`Acción ${action} falló`, {
          description: data?.error?.message || `HTTP ${res.status}`,
        })
      }
    } catch (e) {
      toast.error(`Acción ${action} falló`, {
        description: e?.message || "Error de red",
      })
    } finally {
      setLoading(null)
      try {
        window.dispatchEvent(
          new CustomEvent("wazend:profile:refresh", {
            detail: { source: "actions", action },
          })
        )
      } catch {}
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">

        {/* <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={!sessionName || loading === "start"}
          onClick={() => call("start")}
        >
          {loading === "start" ? "Iniciando…" : "Iniciar"}
        </button> */}

        {/* <button
          className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow transition-colors hover:bg-secondary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={!sessionName || loading === "stop"}
          onClick={() => call("stop")}
        >
          {loading === "stop" ? "Deteniendo…" : "Detener"}
        </button> */}

        <Button
          variant="destructive"
          disabled={!sessionName || loading === "logout"}
          onClick={() => call("logout")}
        >
          {loading === "logout" ? "Cerrando sesión…" : "Cerrar sesión"}
        </Button>

        <Button
          variant="default"
          disabled={!sessionName || loading === "restart"}
          onClick={() => call("restart")}
        >
          {loading === "restart" ? "Reiniciando…" : "Reiniciar"}
        </Button>

        {/* <ConnectNowDialog sessionName={sessionName} /> */}
      </div>
    </div>
  )
}