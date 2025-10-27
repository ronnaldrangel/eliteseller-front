"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { buildStrapiUrl } from "@/lib/strapi"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function EditProductForm({ initialData, token, chatbotId, documentId }) {
  const router = useRouter()
  const attrs = initialData?.attributes || initialData || {}

  const [form, setForm] = useState({
    name: attrs.name || "",
    description_wsp: attrs.description_wsp || "",
    description_complete: attrs.description_complete || "",
    price: (attrs.price ?? "").toString(),
    available: typeof attrs.available === "boolean" ? attrs.available : true,
  })
  const [status, setStatus] = useState({ loading: false, error: null })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: null })
    try {
      const priceNum = Number(form.price)
      const payload = {
        data: {
          name: form.name,
          price: Number.isFinite(priceNum) ? priceNum : 0,
          available: !!form.available,
          chatbot: chatbotId,
          description_wsp: form.description_wsp?.trim() || "",
          description_complete: form.description_complete?.trim() || "",
        },
      }

      const res = await fetch(buildStrapiUrl(`/api/products/${documentId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = body?.error?.message || "No se pudo actualizar el producto"
        setStatus({ loading: false, error: msg })
        return
      }

      toast.success("Actualizado")
      setStatus({ loading: false, error: null })
      router.push(`/dashboard/${encodeURIComponent(chatbotId)}/products`)
    } catch (err) {
      setStatus({ loading: false, error: "Error de red al actualizar" })
    }
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="product-name">Nombre del producto</Label>
          <Input id="product-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="product-description-wsp">Descripción del producto en WhatsApp</Label>
            <Textarea id="product-description-wsp" rows={3} maxLength={500} value={form.description_wsp} onChange={(e) => setForm((p) => ({ ...p, description_wsp: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="product-description-complete">Descripción completa del producto</Label>
            <Textarea id="product-description-complete" rows={3} maxLength={500} value={form.description_complete} onChange={(e) => setForm((p) => ({ ...p, description_complete: e.target.value }))} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-price">Precio</Label>
          <Input id="product-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="product-available" checked={!!form.available} onCheckedChange={(val) => setForm((p) => ({ ...p, available: !!val }))} />
          <Label htmlFor="product-available">Disponible</Label>
        </div>

        {status.error && <p className="text-sm text-red-600">{status.error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/${encodeURIComponent(chatbotId)}/products`)}>Cancelar</Button>
          <Button type="submit" disabled={status.loading || !token || !chatbotId}>{status.loading ? "Guardando…" : "Guardar cambios"}</Button>
        </div>
      </form>
    </div>
  )
}