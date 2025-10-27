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
import CardUpload from "@/components/card-upload"

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
  const [files, setFiles] = useState([])
  const [uploadItems, setUploadItems] = useState([])
  const existingMedia = Array.isArray(attrs?.media) ? attrs.media : []

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

      // Derivar arrays desde CardUpload
      const newFiles = (uploadItems || [])
        .map((item) => item?.file)
        .filter((f) => typeof File !== 'undefined' && f instanceof File)

      // Upload new files if provided
      let uploadedMediaIds = []
      if (newFiles && newFiles.length > 0) {
        const fd = new FormData()
        newFiles.forEach((f) => fd.append("files", f))

        const uploadRes = await fetch(buildStrapiUrl(`/api/upload`), {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        })

        const uploaded = await uploadRes.json().catch(() => [])
        if (!uploadRes.ok) {
          const msg = Array.isArray(uploaded) ? "No se pudieron subir las imágenes" : (uploaded?.error?.message || "No se pudieron subir las imágenes")
          setStatus({ loading: false, error: msg })
          return
        }
        uploadedMediaIds = (Array.isArray(uploaded) ? uploaded : []).map((u) => u?.id).filter(Boolean)
      }

      // IDs de imágenes existentes se derivan de uploadItems actuales (excluyendo las eliminadas)
      const existingMediaIds = (uploadItems || [])
        .map((item) => item?.file)
        .filter((f) => !(typeof File !== 'undefined' && f instanceof File))
        .map((f) => f?.id)
        .filter(Boolean)

      const finalMedia = [...existingMediaIds, ...uploadedMediaIds]
      if (finalMedia.length > 0) {
        payload.data.media = finalMedia
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

  const handleUploadChange = (items) => {
    setUploadItems(items)
    const newFiles = items
      .map((item) => item?.file)
      .filter((f) => typeof File !== 'undefined' && f instanceof File)
    setFiles(newFiles)
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
        <Label className="font-medium">Imágenes, videos (MP4) y PDF del producto</Label>
        <div className="rounded-lg border bg-background p-4">
          <CardUpload
            accept="image/*,video/mp4,application/pdf"
            multiple={true}
            simulateUpload={false}
            defaultFilesEnabled={false}
            initialFiles={existingMedia.map((m) => ({
              id: m?.id,
              name: m?.name || `Imagen`,
              size: typeof m?.size === 'number' ? m.size : 0,
              type: m?.mime || 'image/jpeg',
              url: m?.url,
            }))}
            onFilesChange={handleUploadChange}
          />
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