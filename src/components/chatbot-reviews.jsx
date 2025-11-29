"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, PencilIcon, Trash2Icon, PlusIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildStrapiUrl } from "@/lib/strapi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const TYPE_OPTIONS = [
  { value: "envio_seguro", label: "Envio seguro" },
  { value: "cliente", label: "Reseña de cliente" },
  { value: "confiabilidad", label: "Confiabilidad" },
  { value: "otro", label: "Otro" },
]

const normalizeImage = (img) => {
  if (!img) return null
  const base = img?.attributes || img || {}
  const url = typeof base.url === "string" ? base.url : ""
  const finalUrl = url.startsWith("http") ? url : url ? buildStrapiUrl(url) : ""
  return {
    id: base.id ?? base.documentId ?? null, // Strapi suele retornar id numérico; documentId es string
    documentId: base.documentId ?? base.id ?? null,
    url: finalUrl,
    name: base.name || "image",
  }
}

const normalizeReview = (r) => {
  const a = r?.attributes || r || {}
  const imagesRaw = Array.isArray(a?.images?.data)
    ? a.images.data
    : Array.isArray(a?.images)
    ? a.images
    : []
  return {
    id: r?.id ?? a?.id,
    documentId: a?.documentId,
    description: a?.description || "",
    type: a?.type || "otro",
    images: imagesRaw.map(normalizeImage).filter(Boolean),
  }
}

const ImageThumb = ({ img }) => {
  if (!img?.url) return null
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt={img.name || "review"} className="h-full w-full object-cover" />
    </div>
  )
}

export default function ChatbotReviews({ items = [], token, chatbotId }) {
  const router = useRouter()
  const [reviews, setReviews] = useState(Array.isArray(items) ? items.map(normalizeReview).filter(Boolean) : [])

  useEffect(() => {
    setReviews(Array.isArray(items) ? items.map(normalizeReview).filter(Boolean) : [])
  }, [items])

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ description: "", type: "confiabilidad" })
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [status, setStatus] = useState({ loading: false, error: null })

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ description: "", type: "confiabilidad" })
  const [createFiles, setCreateFiles] = useState([])
  const [createStatus, setCreateStatus] = useState({ loading: false, error: null })

  const [toDelete, setToDelete] = useState(null)
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null })

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return []
    const fd = new FormData()
    Array.from(files).forEach((file) => fd.append("files", file))
    const res = await fetch(buildStrapiUrl("/api/upload"), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error?.message || "No se pudo subir las imagenes")
    }
    return Array.isArray(body) ? body : []
  }

  const extractMediaIds = (items = []) =>
    items
      .map((item) => {
        const id = item?.id
        if (typeof id === "number") return id
        const docId = item?.documentId || item?.document_id || item?._id || id
        if (typeof docId === "number") return docId
        if (typeof docId === "string" && /^\d+$/.test(docId)) return Number(docId)
        return null
      })
      .filter((v) => v !== null)

  const toRelationSet = (ids = []) =>
    ids
      .map((id) => {
        if (typeof id === "number") return { id }
        if (typeof id === "string") return { documentId: id }
        return null
      })
      .filter(Boolean)

  const openEdit = (rev) => {
    setEditing(rev)
    setForm({ description: rev?.description || "", type: rev?.type || "confiabilidad" })
    setExistingImages(rev?.images || [])
    setNewFiles([])
    setStatus({ loading: false, error: null })
  }

  const closeEdit = () => {
    setEditing(null)
    setStatus({ loading: false, error: null })
    setExistingImages([])
    setNewFiles([])
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editing) return
    setStatus({ loading: true, error: null })
    try {
      const uploads = await uploadFiles(newFiles)
      const uploadIds = extractMediaIds(uploads)
      const existingIds = extractMediaIds(existingImages)

      const docId = editing.documentId || editing.id
      const res = await fetch(buildStrapiUrl(`/api/reviews/${encodeURIComponent(docId)}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          data: {
            description: form.description,
            type: form.type,
            images: { set: toRelationSet([...existingIds, ...uploadIds]) },
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ loading: false, error: body?.error?.message || "No se pudo actualizar la reseña" })
        return
      }

      const normalized = normalizeReview(body?.data || body) || {
        ...editing,
        description: form.description,
        type: form.type,
        images: existingImages,
      }
      setReviews((prev) =>
        prev.map((r) => ((r.documentId || r.id) === docId ? { ...normalized, images: existingImages } : r))
      )
      toast.success("Reseña actualizada")
      closeEdit()
      router.refresh()
    } catch (err) {
      setStatus({ loading: false, error: err?.message || "Error de red al actualizar" })
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleteStatus({ loading: true, error: null })
    try {
      const docId = toDelete.documentId || toDelete.id
      const res = await fetch(buildStrapiUrl(`/api/reviews/${encodeURIComponent(docId)}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteStatus({ loading: false, error: body?.error?.message || "No se pudo eliminar la reseña" })
        return
      }
      setReviews((prev) => prev.filter((r) => (r.documentId || r.id) !== docId))
      setDeleteStatus({ loading: false, error: null })
      setToDelete(null)
      router.refresh()
    } catch (e) {
      setDeleteStatus({ loading: false, error: "Error de red al eliminar" })
    }
  }

  const openCreate = () => {
    setCreateOpen(true)
    setCreateForm({ description: "", type: "confiabilidad" })
    setCreateFiles([])
    setCreateStatus({ loading: false, error: null })
  }
  const closeCreate = () => {
    setCreateOpen(false)
    setCreateStatus({ loading: false, error: null })
    setCreateFiles([])
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateStatus({ loading: true, error: null })
    try {
      const uploads = await uploadFiles(createFiles)
      const uploadIds = extractMediaIds(uploads)
      const payload = {
        data: {
          description: createForm.description,
          type: createForm.type,
          images: { set: toRelationSet(uploadIds) },
          chatbot: chatbotId,
        },
      }
      const res = await fetch(buildStrapiUrl(`/api/reviews`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateStatus({ loading: false, error: body?.error?.message || "No se pudo crear la reseña" })
        return
      }
      const normalized = normalizeReview(body?.data || body) || {
        description: createForm.description,
        type: createForm.type,
        images: [],
      }
      setReviews((prev) => [normalized, ...prev])
      toast.success("Reseña creada")
      setCreateStatus({ loading: false, error: null })
      closeCreate()
      router.refresh()
    } catch (err) {
      setCreateStatus({ loading: false, error: err?.message || "Error de red al crear" })
    }
  }

  const formatFileNames = (files, fallback = "Selecciona imágenes") => {
    if (!files || files.length === 0) return fallback
    const names = files.map((f) => f.name).join(", ")
    return names.length > 60 ? `${names.slice(0, 57)}...` : names
  }

  const typeLabel = useMemo(() => {
    const map = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]))
    return map
  }, [])

  return (
    <div className="rounded-xl border bg-card p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-muted-foreground" />
          Reseñas / Confiabilidad
        </h4>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          onClick={openCreate}
          disabled={!token || !chatbotId}
        >
          <PlusIcon className="size-4" /> Añadir reseña
        </Button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin reseñas configuradas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((rev) => (
            <div key={rev.documentId || rev.id || rev.description} className="rounded-xl border bg-background p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-medium leading-tight break-words">{rev.description}</div>
                    <span className="inline-flex text-xs rounded-md border px-2 py-0.5 text-muted-foreground w-fit">
                      {typeLabel[rev.type] || rev.type || "Confiabilidad"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(rev)}>
                      <PencilIcon className="size-4" />
                      Editar
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => setToDelete(rev)}>
                      <Trash2Icon className="size-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
                {rev.images && rev.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {rev.images.map((img) => (
                      <ImageThumb key={img.id || img.url} img={img} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => (open ? null : closeEdit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar reseña</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="rev-desc" className="text-sm font-medium">Descripción</label>
              <Textarea
                id="rev-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="rev-type" className="text-sm font-medium">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger id="rev-type" className="w-full">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Imágenes actuales</div>
              {existingImages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin imágenes</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id || img.url} className="group relative">
                      <ImageThumb img={img} />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white opacity-0 group-hover:opacity-100"
                        onClick={() => setExistingImages((prev) => prev.filter((p) => (p.id || p.url) !== (img.id || img.url)))}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="rev-files" className="text-sm font-medium">Añadir imágenes</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="w-full justify-start" asChild>
                  <label htmlFor="rev-files" className="w-full cursor-pointer text-left">
                    <ImageIcon className="mr-2 inline size-4" />
                    {formatFileNames(newFiles, "Selecciona imágenes")}
                  </label>
                </Button>
                <input
                  id="rev-files"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                />
              </div>
              <p className="text-xs text-muted-foreground">Si no subes nuevas, se mantienen las actuales.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit}>Cancelar</Button>
              <Button type="submit" disabled={status.loading || !token}>
                {status.loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
            {status.error && <p className="text-sm text-red-600">{status.error}</p>}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => (open ? null : closeCreate())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva reseña</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3">
              <label htmlFor="new-rev-desc" className="text-sm font-medium">Descripción</label>
              <Textarea
                id="new-rev-desc"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="new-rev-type" className="text-sm font-medium">Tipo</label>
              <Select value={createForm.type} onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger id="new-rev-type" className="w-full">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="new-rev-files" className="text-sm font-medium">Imágenes</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="w-full justify-start" asChild>
                  <label htmlFor="new-rev-files" className="w-full cursor-pointer text-left">
                    <ImageIcon className="mr-2 inline size-4" />
                    {formatFileNames(createFiles, "Selecciona imágenes")}
                  </label>
                </Button>
                <input
                  id="new-rev-files"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setCreateFiles(e.target.files ? Array.from(e.target.files) : [])}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreate}>Cancelar</Button>
              <Button type="submit" disabled={createStatus.loading || !token || !chatbotId}>
                {createStatus.loading ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
            {createStatus.error && <p className="text-sm text-red-600">{createStatus.error}</p>}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => (open ? null : setToDelete(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar reseña</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Seguro que deseas eliminar esta reseña? Esta acción no se puede deshacer.</p>
          {deleteStatus.error && <p className="text-sm text-red-600">{deleteStatus.error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStatus.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStatus.loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
