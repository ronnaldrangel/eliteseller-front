"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { buildStrapiUrl } from "@/lib/strapi"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function NewProductForm({ token, chatbotId }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", price: "", available: true, stock: "" })
  const [status, setStatus] = useState({ loading: false, error: null })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: null })
    try {
      const priceNum = Number(form.price)
      const stockNum = Number(form.stock)
      const payload = {
        data: {
          name: form.name,
          price: Number.isFinite(priceNum) ? priceNum : 0,
          available: !!form.available,
          stock: Number.isFinite(stockNum) ? stockNum : 0,
          chatbot: chatbotId,
        },
      }

      const res = await fetch(buildStrapiUrl(`/api/products`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = body?.error?.message || "No se pudo crear el producto"
        setStatus({ loading: false, error: msg })
        return
      }

      toast.success("Creado")
      setStatus({ loading: false, error: null })
      router.push(`/dashboard/${encodeURIComponent(chatbotId)}/products`)
    } catch (err) {
      setStatus({ loading: false, error: "Error de red al crear" })
    }
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="product-name">Nombre</Label>
          <Input id="product-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-price">Precio</Label>
          <Input id="product-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-stock">Stock</Label>
          <Input id="product-stock" type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="product-available" checked={!!form.available} onCheckedChange={(val) => setForm((p) => ({ ...p, available: !!val }))} />
          <Label htmlFor="product-available">Disponible</Label>
        </div>

        {status.error && <p className="text-sm text-red-600">{status.error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/${encodeURIComponent(chatbotId)}/products`)}>Cancelar</Button>
          <Button type="submit" disabled={status.loading || !token || !chatbotId}>{status.loading ? "Creando…" : "Crear"}</Button>
        </div>
      </form>
    </div>
  )
}